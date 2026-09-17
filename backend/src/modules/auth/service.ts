import * as usersRepository from '../users/repository.js';
import { registrarUltimoLogin } from '../users/repository.js';
import { signToken } from '../../utils/jwt.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthUser, User } from '../../types/index.js';

// Login modo dev: autentica só pelo e-mail (sem senha), igual ao protótipo
// frontend atual. Produção usará Microsoft Entra ID (MSAL) — fora de escopo
// desta etapa; esta função é a única coisa a trocar quando isso acontecer,
// o resto do RBAC/JWT já está pronto para receber o AuthUser de qualquer
// fonte de autenticação.
export async function login(email: string): Promise<{ token: string; user: User }> {
  const user = await usersRepository.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Usuário não encontrado. Use um e-mail cadastrado no sistema.');
  }
  if (!user.ativo) {
    throw ApiError.unauthorized('Usuário inativo.');
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    departamentoId: user.departamento_id,
  };

  await registrarUltimoLogin(user.id);
  return { token: signToken(authUser), user };
}
