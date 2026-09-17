import * as repository from './repository.js';
import { ApiError } from '../../utils/ApiError.js';
import type { Cargo, GrupoPPR } from '../../types/index.js';

// Mesma régua do frontend (cargoParaGrupoPPR em utils/ppr.ts): cargos criados
// sem grupo explícito caem em "DEMAIS CARGOS" por padrão, e só GERENTE/
// DIRETORIA e COORDENADOR/SUPERVISOR têm grupo diferente.
const CARGOS_GERENTES = ['GERENTE', 'DIRETORIA'];
const CARGOS_COORDENADORES = ['COORDENADOR', 'SUPERVISOR'];

export function inferirGrupoPPR(nomeCargo: string): GrupoPPR {
  const normalizado = nomeCargo.trim().toUpperCase();
  if (CARGOS_GERENTES.includes(normalizado)) return 'GERENTES';
  if (CARGOS_COORDENADORES.includes(normalizado)) return 'COORDENADORES E SUPERVISORES';
  return 'DEMAIS CARGOS';
}

export async function listCargos(): Promise<Cargo[]> {
  return repository.findAll();
}

export async function findOrCreateByNome(nome: string): Promise<Cargo> {
  const existente = await repository.findByNome(nome);
  if (existente) return existente;
  return repository.create({ nome, grupo_ppr: inferirGrupoPPR(nome) });
}

export async function createCargo(input: {
  nome: string;
  descricao?: string | null;
  nivel?: string | null;
  trilha_id?: string | null;
  grupo_ppr?: GrupoPPR | null;
}): Promise<Cargo> {
  const existente = await repository.findByNome(input.nome);
  if (existente) throw ApiError.conflict('Já existe um cargo com este nome');
  return repository.create({ ...input, grupo_ppr: input.grupo_ppr ?? inferirGrupoPPR(input.nome) });
}
