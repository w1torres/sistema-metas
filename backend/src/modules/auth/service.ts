import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import * as usersRepository from '../users/repository.js';
import { registrarUltimoLogin } from '../users/repository.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { isCorporateEmail } from '../../utils/emailDomain.js';
import { validarTokenEntraId } from '../../utils/entraId.js';
import { enviarEmail } from '../../utils/email.js';
import { logger } from '../../utils/logger.js';
import type { AuthUser, User } from '../../types/index.js';

const SALT_ROUNDS = 10;

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    departamentoId: user.departamento_id,
  };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Login antigo (só e-mail, sem senha) — mantido atrás de env.auth.devLoginEnabled
// só durante a migração pro backend real (nunca disponível em produção, ver
// config/env.ts). Preferir loginSenha/loginEntraId.
export async function loginDevMode(email: string): Promise<{ token: string; user: User }> {
  if (!env.auth.devLoginEnabled) {
    throw ApiError.forbidden('Login dev-mode desativado — use /auth/login-senha ou /auth/entra.');
  }
  const user = await usersRepository.findByEmail(email);
  if (!user) throw ApiError.unauthorized('Usuário não encontrado. Use um e-mail cadastrado no sistema.');
  if (!user.ativo) throw ApiError.unauthorized('Usuário inativo.');

  await registrarUltimoLogin(user.id);
  return { token: signToken(toAuthUser(user)), user };
}

export async function loginSenha(email: string, senha: string): Promise<{ token: string; user: User }> {
  if (isCorporateEmail(email)) {
    throw ApiError.badRequest('Este e-mail é corporativo — entre com "Entrar com Microsoft".');
  }

  const user = await usersRepository.findByEmailComSenha(email);
  // Mesma mensagem genérica pra email inexistente, sem senha definida ou
  // senha errada — não vaza qual dessas situações é a verdadeira.
  const erroGenerico = () => ApiError.unauthorized('E-mail ou senha inválidos.');

  if (!user || !user.ativo || !user.password_hash) throw erroGenerico();
  const senhaConfere = await bcrypt.compare(senha, user.password_hash);
  if (!senhaConfere) throw erroGenerico();

  await registrarUltimoLogin(user.id);
  return { token: signToken(toAuthUser(user)), user };
}

interface LoginEntraInput {
  idToken?: string;
  // Só usado quando env.auth.msal.modoLocal está ligado (nunca em produção)
  // — pula a validação real do token pra testar o fluxo sem Azure AD de
  // verdade configurado localmente.
  email?: string;
}

export async function loginEntraId(input: LoginEntraInput): Promise<{ token: string; user: User }> {
  let email: string;

  if (env.auth.msal.modoLocal) {
    if (!input.email) throw ApiError.badRequest('MSAL_MODO_LOCAL ligado: informe "email" (sem idToken real).');
    logger.warn(`[auth] MSAL_MODO_LOCAL ativo — login Entra ID simulado para ${input.email}, sem validar token.`);
    email = input.email;
  } else {
    if (!input.idToken) throw ApiError.badRequest('idToken é obrigatório.');
    const claims = await validarTokenEntraId(input.idToken).catch((err: Error) => {
      throw ApiError.unauthorized(`Token do Entra ID inválido: ${err.message}`);
    });
    const claimEmail = claims.email ?? claims.preferred_username;
    if (!claimEmail) throw ApiError.unauthorized('Token do Entra ID sem e-mail.');
    email = claimEmail;
  }

  if (!isCorporateEmail(email)) {
    throw ApiError.forbidden('Este e-mail não é do domínio corporativo — entre com e-mail e senha.');
  }

  const user = await usersRepository.findByEmail(email);
  if (!user) throw ApiError.unauthorized('Usuário não encontrado. Peça a um administrador para cadastrá-lo.');
  if (!user.ativo) throw ApiError.unauthorized('Usuário inativo.');

  if (!env.auth.msal.modoLocal) await usersRepository.marcarProviderEntra(user.id);
  await registrarUltimoLogin(user.id);
  return { token: signToken(toAuthUser(user)), user };
}

function linkDefinicaoSenha(tokenBruto: string): string {
  return `${env.frontendUrl}/definir-senha?token=${tokenBruto}`;
}

async function enviarLinkDefinicaoSenha(user: User, tokenBruto: string): Promise<void> {
  await enviarEmail({
    to: user.email!,
    subject: 'Defina sua senha de acesso',
    html: `
      <p>Olá, ${user.nome}.</p>
      <p>Use o link abaixo para definir sua senha de acesso ao Sistema de Metas:</p>
      <p><a href="${linkDefinicaoSenha(tokenBruto)}">${linkDefinicaoSenha(tokenBruto)}</a></p>
      <p>O link expira em ${env.auth.passwordResetTokenTtlHours} horas.</p>
    `,
  });
}

// Chamado tanto no cadastro de um usuário sem e-mail corporativo (ver
// users/service.ts createUser) quanto no "esqueci minha senha" — mesmo
// mecanismo de token pras duas situações.
export async function solicitarDefinicaoSenha(email: string): Promise<void> {
  if (isCorporateEmail(email)) {
    throw ApiError.badRequest('E-mail corporativo entra pelo Microsoft — não usa senha.');
  }

  const user = await usersRepository.findByEmail(email);
  // Não revela se o e-mail existe ou não — mesma resposta (sucesso) nos dois
  // casos, só que sem mandar nada quando não existe.
  if (!user || !user.ativo) return;

  const tokenBruto = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.auth.passwordResetTokenTtlHours * 60 * 60 * 1000);
  await usersRepository.setTokenDefinicaoSenha(user.id, hashToken(tokenBruto), expiresAt);
  await enviarLinkDefinicaoSenha(user, tokenBruto);
}

export async function definirSenha(tokenBruto: string, novaSenha: string): Promise<{ token: string; user: User }> {
  const user = await usersRepository.findByTokenDefinicaoSenha(hashToken(tokenBruto));
  if (!user) throw ApiError.badRequest('Link inválido ou já utilizado.');
  if (!user.password_reset_expires_at || new Date(user.password_reset_expires_at) < new Date()) {
    throw ApiError.badRequest('Link expirado — solicite um novo.');
  }
  if (novaSenha.length < 8) throw ApiError.badRequest('A senha precisa ter pelo menos 8 caracteres.');

  const hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  await usersRepository.setSenha(user.id, hash);
  await registrarUltimoLogin(user.id);
  return { token: signToken(toAuthUser(user)), user };
}

// Disparado pelo cadastro de usuário (users/service.ts) — não expõe erro pro
// admin que criou o usuário se o envio de e-mail falhar (SMTP fora do ar não
// deve impedir o cadastro), só loga.
export async function dispararDefinicaoSenhaParaNovoUsuario(user: User): Promise<void> {
  if (!user.email || isCorporateEmail(user.email)) return;
  try {
    const tokenBruto = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.auth.passwordResetTokenTtlHours * 60 * 60 * 1000);
    await usersRepository.setTokenDefinicaoSenha(user.id, hashToken(tokenBruto), expiresAt);
    await enviarLinkDefinicaoSenha(user, tokenBruto);
  } catch (err) {
    logger.error(`[auth] Falha ao enviar e-mail de definição de senha para ${user.email}: ${(err as Error).message}`);
  }
}
