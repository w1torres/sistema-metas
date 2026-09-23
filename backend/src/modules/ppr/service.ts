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

export interface EdicaoFaixaMultiplo {
  id: string;
  faixaMin: number;
  faixaMax: number;
  multiplo: number;
}

/**
 * Edita faixa (min/max) e múltiplo de várias linhas de uma vez — a "linha" da
 * Tabela de Múltiplos vale pros 3 grupos de cargo ao mesmo tempo (mesma
 * faixa), então o front sempre manda todas juntas. Sobreposição é validada
 * contra o conjunto NOVO completo por grupo, não contra o estado antigo —
 * senão uma edição legítima em duas faixas vizinhas gera falso positivo.
 */
export async function atualizarBandas(edicoes: EdicaoFaixaMultiplo[]): Promise<PPRFaixa[]> {
  for (const e of edicoes) {
    if (Number.isNaN(e.faixaMin) || e.faixaMin < 0 || e.faixaMin > 999) {
      throw ApiError.badRequest('Faixa mínima inválida');
    }
    if (Number.isNaN(e.faixaMax) || e.faixaMax < e.faixaMin) {
      throw ApiError.badRequest('Faixa máxima deve ser maior ou igual à mínima');
    }
    if (Number.isNaN(e.multiplo) || e.multiplo < 0) {
      throw ApiError.badRequest('Múltiplo não pode ser negativo');
    }
  }

  const faixasAtuais = await repository.findAll();
  const cargoPorId = new Map(faixasAtuais.map((f) => [f.id, f.grupo_cargo]));

  const porCargo = new Map<string, EdicaoFaixaMultiplo[]>();
  for (const e of edicoes) {
    const cargo = cargoPorId.get(e.id);
    if (!cargo) throw ApiError.notFound(`Faixa não encontrada: ${e.id}`);
    const lista = porCargo.get(cargo) ?? [];
    lista.push(e);
    porCargo.set(cargo, lista);
  }
  for (const lista of porCargo.values()) {
    const ordenadas = [...lista].sort((a, b) => a.faixaMin - b.faixaMin);
    for (let i = 1; i < ordenadas.length; i += 1) {
      if (ordenadas[i].faixaMin < ordenadas[i - 1].faixaMax) {
        throw ApiError.badRequest('As faixas informadas se sobrepõem — ajuste os intervalos.');
      }
    }
  }

  await repository.atualizarBandas(edicoes);
  return repository.findAll();
}
