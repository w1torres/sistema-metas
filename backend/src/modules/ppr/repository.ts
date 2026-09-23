import { db } from '../../db/knex.js';
import type { PPRFaixa } from '../../types/index.js';

export async function findAll(): Promise<PPRFaixa[]> {
  const rows = await db('ppr_faixas')
    .select('id', 'grupo_cargo', 'faixa_min', 'faixa_max', 'multiplo')
    .orderBy(['grupo_cargo', 'faixa_min']);
  return rows.map((r) => ({
    ...r,
    faixa_min: Number(r.faixa_min),
    faixa_max: Number(r.faixa_max),
    multiplo: Number(r.multiplo),
  }));
}

export async function findById(id: string): Promise<PPRFaixa | undefined> {
  const row = await db('ppr_faixas').select('id', 'grupo_cargo', 'faixa_min', 'faixa_max', 'multiplo').where('id', id).first();
  if (!row) return undefined;
  return { ...row, faixa_min: Number(row.faixa_min), faixa_max: Number(row.faixa_max), multiplo: Number(row.multiplo) };
}

export async function updateMultiplo(id: string, multiplo: number): Promise<PPRFaixa | undefined> {
  await db('ppr_faixas').where('id', id).update({ multiplo, atualizado_em: db.fn.now() });
  return findById(id);
}

export async function atualizarBandas(
  edicoes: { id: string; faixaMin: number; faixaMax: number; multiplo: number }[],
): Promise<void> {
  await db.transaction(async (trx) => {
    for (const e of edicoes) {
      await trx('ppr_faixas')
        .where('id', e.id)
        .update({ faixa_min: e.faixaMin, faixa_max: e.faixaMax, multiplo: e.multiplo, atualizado_em: trx.fn.now() });
    }
  });
}

export async function findFaixaParaGrupo(grupoCargo: string, percentual: number): Promise<PPRFaixa | undefined> {
  const rows = await findAll();
  const doGrupo = rows.filter((r) => r.grupo_cargo === grupoCargo).sort((a, b) => a.faixa_min - b.faixa_min);
  if (doGrupo.length === 0) return undefined;
  const exata = doGrupo.find((f) => percentual >= f.faixa_min && percentual <= f.faixa_max);
  if (exata) return exata;
  const ultima = doGrupo[doGrupo.length - 1];
  return percentual > ultima.faixa_max ? ultima : undefined;
}
