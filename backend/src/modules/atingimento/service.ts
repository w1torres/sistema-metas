import * as repository from './repository.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AtingimentoFaixa } from './repository.js';

export async function listFaixas(): Promise<AtingimentoFaixa[]> {
  return repository.findAll();
}

export interface EdicaoFaixaAtingimento {
  id: string;
  faixaMin: number;
  faixaMax: number;
  percentualPeso: number;
}

/**
 * Edita todas as faixas de uma vez — evita falso positivo de sobreposição ao
 * salvar várias linhas ao mesmo tempo (mesmo padrão de ppr/service.ts
 * atualizarBandas). Não cria nem remove faixa, só ajusta as 5 existentes.
 */
export async function atualizarFaixas(edicoes: EdicaoFaixaAtingimento[]): Promise<AtingimentoFaixa[]> {
  const faixasAtuais = await repository.findAll();
  const idsValidos = new Set(faixasAtuais.map((f) => f.id));

  for (const e of edicoes) {
    if (!idsValidos.has(e.id)) throw ApiError.notFound(`Faixa não encontrada: ${e.id}`);
    if (Number.isNaN(e.faixaMin) || e.faixaMin < 0 || e.faixaMin > 999) {
      throw ApiError.badRequest('Faixa mínima inválida');
    }
    if (Number.isNaN(e.faixaMax) || e.faixaMax < e.faixaMin) {
      throw ApiError.badRequest('Faixa máxima deve ser maior ou igual à mínima');
    }
    if (Number.isNaN(e.percentualPeso) || e.percentualPeso < 0 || e.percentualPeso > 100) {
      throw ApiError.badRequest('% do peso deve estar entre 0 e 100');
    }
  }

  const ordenadas = [...edicoes].sort((a, b) => a.faixaMin - b.faixaMin);
  for (let i = 1; i < ordenadas.length; i += 1) {
    if (ordenadas[i].faixaMin < ordenadas[i - 1].faixaMax) {
      throw ApiError.badRequest('As faixas informadas se sobrepõem — ajuste os intervalos.');
    }
  }

  await repository.atualizarFaixas(edicoes);
  return repository.findAll();
}
