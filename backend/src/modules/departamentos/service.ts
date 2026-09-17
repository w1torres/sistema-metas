import * as repository from './repository.js';
import { ApiError } from '../../utils/ApiError.js';
import type { Departamento } from '../../types/index.js';

export async function listDepartamentos(): Promise<Departamento[]> {
  return repository.findAll();
}

export async function findOrCreateByNome(nome: string, descricao?: string | null): Promise<Departamento> {
  const existente = await repository.findByNome(nome);
  if (existente) return existente;
  return repository.create(nome, descricao);
}

export async function createDepartamento(nome: string, descricao?: string | null): Promise<Departamento> {
  const existente = await repository.findByNome(nome);
  if (existente) throw ApiError.conflict('Já existe um departamento com este nome');
  return repository.create(nome, descricao);
}
