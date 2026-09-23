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

export async function findById(id: string): Promise<Trilha | undefined> {
  const trilha = await db('trilhas').select('id', 'nome', 'descricao').where('id', id).first();
  if (!trilha) return undefined;
  const pilares = await db('trilha_pilares')
    .select('pilar', 'peso', 'ordem')
    .where('trilha_id', id)
    .orderBy('ordem');
  return { ...trilha, pilares: pilares.map((p) => ({ pilar: p.pilar, peso: Number(p.peso), ordem: p.ordem })) };
}

export async function atualizarPesos(trilhaId: string, pesos: { pilar: string; peso: number }[]): Promise<void> {
  await db.transaction(async (trx) => {
    for (const p of pesos) {
      await trx('trilha_pilares').where({ trilha_id: trilhaId, pilar: p.pilar }).update({ peso: p.peso });
    }
  });
}
