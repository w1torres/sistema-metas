import * as repository from './repository.js';
import { ApiError } from '../../utils/ApiError.js';
import type { PPRFaixa } from '../../types/index.js';

export async function listFaixas(): Promise<PPRFaixa[]> {
  return repository.findAll();
}

export async function updateMultiplo(id: string, multiplo: number): Promise<PPRFaixa> {
  if (Number.isNaN(multiplo) || multiplo < 0) {
    throw ApiError.badRequest('Múltiplo inválido — use um número maior ou igual a zero');
  }
  const atualizado = await repository.updateMultiplo(id, multiplo);
  if (!atualizado) throw ApiError.notFound('Faixa de PPR não encontrada');
  return atualizado;
}
