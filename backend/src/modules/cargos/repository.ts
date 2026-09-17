import { db } from '../../db/knex.js';
import type { Cargo, GrupoPPR } from '../../types/index.js';

export async function findAll(): Promise<Cargo[]> {
  return db('cargos').select('id', 'nome', 'descricao', 'nivel', 'trilha_id', 'grupo_ppr').orderBy('nome');
}

export async function findByNome(nome: string): Promise<Cargo | undefined> {
  return db('cargos').whereRaw('UPPER(nome) = UPPER(?)', [nome]).first();
}

interface CreateCargoInput {
  nome: string;
  descricao?: string | null;
  nivel?: string | null;
  trilha_id?: string | null;
  grupo_ppr?: GrupoPPR | null;
}

export async function create(input: CreateCargoInput): Promise<Cargo> {
  const [row] = await db('cargos')
    .insert({
      nome: input.nome.trim().toUpperCase(),
      descricao: input.descricao ?? null,
      nivel: input.nivel ?? null,
      trilha_id: input.trilha_id ?? null,
      grupo_ppr: input.grupo_ppr ?? null,
    })
    .returning(['id', 'nome', 'descricao', 'nivel', 'trilha_id', 'grupo_ppr']);
  return row;
}
