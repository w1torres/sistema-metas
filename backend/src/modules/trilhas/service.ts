import * as repository from './repository.js';
import { ApiError } from '../../utils/ApiError.js';
import type { Trilha } from '../../types/index.js';

export async function listTrilhas(): Promise<Trilha[]> {
  return repository.findAll();
}

/**
 * Substitui de uma vez os pesos de TODOS os pilares de uma trilha — nunca um
 * peso isolado, pra não deixar a soma inconsistente (tem que ser 100) entre
 * um save e o próximo. Não cria nem remove pilar, só ajusta o peso dos que já
 * existem (mesmo conjunto de nomes da trilha).
 */
export async function atualizarPesos(
  trilhaId: string,
  pesos: { pilar: string; peso: number }[],
): Promise<Trilha> {
  const trilha = await repository.findById(trilhaId);
  if (!trilha) throw ApiError.notFound('Trilha não encontrada');

  if (pesos.length !== trilha.pilares.length) {
    throw ApiError.badRequest('Todos os pilares da trilha precisam de um peso');
  }

  const pilaresExistentes = new Set(trilha.pilares.map((p) => p.pilar));
  for (const p of pesos) {
    if (!pilaresExistentes.has(p.pilar)) {
      throw ApiError.badRequest(`Pilar não pertence a esta trilha: ${p.pilar}`);
    }
    // Mesmo CHECK do banco (peso > 0 AND peso <= 100) — falha aqui com uma
    // mensagem legível em vez de estourar a constraint no INSERT/UPDATE.
    if (Number.isNaN(p.peso) || p.peso <= 0 || p.peso > 100) {
      throw ApiError.badRequest('Peso inválido — use um número maior que 0 e até 100');
    }
  }

  const soma = pesos.reduce((total, p) => total + p.peso, 0);
  if (Math.abs(soma - 100) > 0.1) {
    throw ApiError.badRequest(`A soma dos pesos precisa ser 100% (está em ${soma.toFixed(2)}%)`);
  }

  await repository.atualizarPesos(trilhaId, pesos);
  return (await repository.findById(trilhaId))!;
}
