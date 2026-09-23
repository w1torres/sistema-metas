import { db } from '../../db/knex.js';

export interface AtingimentoFaixa {
  id: string;
  faixa_min: number;
  faixa_max: number;
  percentual_peso: number;
}

function mapRow(row: any): AtingimentoFaixa {
  return {
    id: row.id,
    faixa_min: Number(row.faixa_min),
    faixa_max: Number(row.faixa_max),
    percentual_peso: Number(row.percentual_peso),
  };
}

export async function findAll(): Promise<AtingimentoFaixa[]> {
  const rows = await db('atingimento_faixas')
    .select('id', 'faixa_min', 'faixa_max', 'percentual_peso')
    .orderBy('faixa_min', 'desc');
  return rows.map(mapRow);
}

export async function atualizarFaixas(
  edicoes: { id: string; faixaMin: number; faixaMax: number; percentualPeso: number }[],
): Promise<void> {
  await db.transaction(async (trx) => {
    for (const e of edicoes) {
      await trx('atingimento_faixas')
        .where('id', e.id)
        .update({
          faixa_min: e.faixaMin,
          faixa_max: e.faixaMax,
          percentual_peso: e.percentualPeso,
          atualizado_em: trx.fn.now(),
        });
    }
  });
}
