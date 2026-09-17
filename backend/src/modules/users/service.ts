import * as usersRepository from './repository.js';
import { dispararDefinicaoSenhaParaNovoUsuario } from '../auth/service.js';
import { ApiError } from '../../utils/ApiError.js';
import type { Role, User } from '../../types/index.js';

export async function listUsers(): Promise<User[]> {
  return usersRepository.findAll();
}

export async function getUserByEmail(email: string): Promise<User> {
  const user = await usersRepository.findByEmail(email);
  if (!user) throw ApiError.notFound('Usuário não encontrado');
  return user;
}

interface CreateUserInput {
  email?: string | null;
  nome: string;
  cpf?: string | null;
  departamento_id: string;
  cargo_id?: string | null;
  role: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  if (!input.email && !input.cpf) {
    throw ApiError.badRequest('Informe pelo menos o email ou o CPF (o CPF identifica o usuário até o email ser cadastrado)');
  }
  if (input.email) {
    const existente = await usersRepository.findByEmail(input.email);
    if (existente) throw ApiError.conflict('Já existe um usuário com este e-mail');
  }
  if (input.cpf) {
    const existenteCpf = await usersRepository.findByCpf(input.cpf);
    if (existenteCpf) throw ApiError.conflict('Já existe um usuário com este CPF');
  }
  const criado = await usersRepository.create(input);
  // Email não-corporativo: já dispara o link de definição de senha (não
  // bloqueia a criação se o envio falhar — ver auth/service.ts).
  await dispararDefinicaoSenhaParaNovoUsuario(criado);
  return criado;
}

interface UpdateUserInput {
  nome?: string;
  email?: string | null;
  cpf?: string | null;
  departamento_id?: string;
  cargo_id?: string | null;
  role?: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const atual = await usersRepository.findById(id);
  if (!atual) throw ApiError.notFound('Usuário não encontrado');

  const emailFinal = input.email !== undefined ? input.email : atual.email;
  const cpfFinal = input.cpf !== undefined ? input.cpf : atual.cpf;
  if (!emailFinal && !cpfFinal) {
    throw ApiError.badRequest('Informe pelo menos o email ou o CPF (o CPF identifica o usuário até o email ser cadastrado)');
  }

  if (input.email) {
    const existenteEmail = await usersRepository.findByEmail(input.email);
    if (existenteEmail && existenteEmail.id !== id) throw ApiError.conflict('Já existe um usuário com este e-mail');
  }
  if (input.cpf) {
    const existenteCpf = await usersRepository.findByCpf(input.cpf);
    if (existenteCpf && existenteCpf.id !== id) throw ApiError.conflict('Já existe um usuário com este CPF');
  }

  const atualizado = await usersRepository.update(id, input);
  if (!atualizado) throw ApiError.notFound('Usuário não encontrado');
  return atualizado;
}

export async function toggleAtivo(id: string, ativo: boolean, requesterId: string): Promise<User> {
  if (id === requesterId && !ativo) {
    throw ApiError.badRequest('Você não pode desativar a própria conta');
  }
  const atualizado = await usersRepository.setAtivo(id, ativo);
  if (!atualizado) throw ApiError.notFound('Usuário não encontrado');
  return atualizado;
}

export async function removeUser(id: string, requesterId: string): Promise<void> {
  if (id === requesterId) throw ApiError.badRequest('Você não pode excluir a própria conta');

  const atual = await usersRepository.findById(id);
  if (!atual) throw ApiError.notFound('Usuário não encontrado');

  try {
    await usersRepository.remove(id);
  } catch (err) {
    // 23503 = foreign_key_violation — usuário ainda é responsável por algum
    // indicador (ver comentário em repository.remove).
    if ((err as { code?: string }).code === '23503') {
      throw ApiError.conflict(
        'Usuário é responsável por indicadores cadastrados — mude o responsável ou desative o usuário em vez de excluir.',
      );
    }
    throw err;
  }
}
