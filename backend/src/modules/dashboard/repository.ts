import { db } from '../../db/knex.js';

export interface StatsRow {
  usuario_responsavel_id: string;
  responsavel_nome: string;
  responsavel_email: string;
  departamento_id: string;
  departamento_nome: string;
  status: string;
}

export async function findStatsRows(departamentoId?: string): Promise<StatsRow[]> {
  const query = db('indicadores')
    .join('users', 'users.id', 'indicadores.usuario_responsavel_id')
    .join('departamentos', 'departamentos.id', 'indicadores.departamento_id')
    .select(
      'indicadores.usuario_responsavel_id',
      'users.nome as responsavel_nome',
      'users.email as responsavel_email',
      'indicadores.departamento_id',
      'departamentos.nome as departamento_nome',
      'indicadores.status',
    );
  if (departamentoId) query.where('indicadores.departamento_id', departamentoId);
  return query;
}
