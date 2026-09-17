import * as usersRepository from './repository.js';
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
  email: string;
  nome: string;
  cpf?: string | null;
  matricula?: string | null;
  departamento_id: string;
  cargo_id?: string | null;
  role: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
  endereco_completo?: string | null;
  telefone?: string | null;
  celular?: string | null;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const existente = await usersRepository.findByEmail(input.email);
  if (existente) throw ApiError.conflict('Já existe um usuário com este e-mail');
  if (input.cpf) {
    const existenteCpf = await usersRepository.findByCpf(input.cpf);
    if (existenteCpf) throw ApiError.conflict('Já existe um usuário com este CPF');
  }
  return usersRepository.create(input);
}

interface UpdateUserInput {
  nome?: string;
  cpf?: string | null;
  matricula?: string | null;
  departamento_id?: string;
  cargo_id?: string | null;
  role?: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
  endereco_completo?: string | null;
  telefone?: string | null;
  celular?: string | null;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const atual = await usersRepository.findById(id);
  if (!atual) throw ApiError.notFound('Usuário não encontrado');

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
