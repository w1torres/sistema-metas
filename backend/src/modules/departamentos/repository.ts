import { db } from '../../db/knex.js';
import type { Departamento } from '../../types/index.js';

export async function findAll(): Promise<Departamento[]> {
  return db('departamentos').select('id', 'nome', 'descricao', 'gerente_id').orderBy('nome');
}

export async function findByNome(nome: string): Promise<Departamento | undefined> {
  return db('departamentos').whereRaw('UPPER(nome) = UPPER(?)', [nome]).first();
}

export async function create(nome: string, descricao?: string | null): Promise<Departamento> {
  const [row] = await db('departamentos')
    .insert({ nome: nome.trim().toUpperCase(), descricao: descricao ?? null })
    .returning(['id', 'nome', 'descricao', 'gerente_id']);
  return row;
}
