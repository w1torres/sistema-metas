import { db } from '../../db/knex.js';
import type { Trilha } from '../../types/index.js';

export async function findAll(): Promise<Trilha[]> {
  const trilhas = await db('trilhas').select('id', 'nome', 'descricao').orderBy('nome');
  const pilares = await db('trilha_pilares')
    .select('trilha_id', 'pilar', 'peso', 'ordem')
    .orderBy(['trilha_id', 'ordem']);

  return trilhas.map((trilha) => ({
    ...trilha,
    pilares: pilares
      .filter((p) => p.trilha_id === trilha.id)
      .map((p) => ({ pilar: p.pilar, peso: Number(p.peso), ordem: p.ordem })),
  }));
}
