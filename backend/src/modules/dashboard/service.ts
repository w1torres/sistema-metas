import * as repository from './repository.js';
import type { StatsRow } from './repository.js';
import { db } from '../../db/knex.js';
import { temAcessoAmplo } from '../../utils/roles.js';
import type { AuthUser, DashboardResumo, DashboardStats } from '../../types/index.js';

// Mesmas 3 categorias das views v_dashboard_stats_* da spec: "pendentes"
// conta só EM_ANDAMENTO (ATRASADO/PAUSADO entram no total mas não em nenhum
// dos 3 baldes, igual ao SQL original), "em_aprovacao" cobre as 2 etapas do
// fluxo (AGUARDANDO_APROVACAO + AGUARDANDO_RH), "aprovados" é CONCLUIDO.
function calcResumo(rows: StatsRow[]): DashboardResumo {
  const total = rows.length;
  const pendentes = rows.filter((r) => r.status === 'EM_ANDAMENTO').length;
  const emAprovacao = rows.filter((r) => r.status === 'AGUARDANDO_APROVACAO' || r.status === 'AGUARDANDO_RH').length;
  const aprovados = rows.filter((r) => r.status === 'CONCLUIDO').length;

  return {
    total_indicadores: total,
    pendentes,
    em_aprovacao: emAprovacao,
    aprovados,
    taxa_conclusao: total > 0 ? Math.round((aprovados / total) * 10000) / 100 : 0,
  };
}

function agruparPorColaborador(rows: StatsRow[]): DashboardStats['por_colaborador'] {
  const porUsuario = new Map<string, StatsRow[]>();
  rows.forEach((row) => {
    const lista = porUsuario.get(row.usuario_responsavel_id) ?? [];
    lista.push(row);
    porUsuario.set(row.usuario_responsavel_id, lista);
  });

  return Array.from(porUsuario.values())
    .map((linhas) => ({
      nome: linhas[0].responsavel_nome,
      email: linhas[0].responsavel_email,
      departamento: linhas[0].departamento_nome,
      ...calcResumo(linhas),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

function agruparPorDepartamento(rows: StatsRow[]): NonNullable<DashboardStats['por_departamento']> {
  const porDepto = new Map<string, StatsRow[]>();
  rows.forEach((row) => {
    const lista = porDepto.get(row.departamento_id) ?? [];
    lista.push(row);
    porDepto.set(row.departamento_id, lista);
  });

  return Array.from(porDepto.values())
    .map((linhas) => ({ departamento: linhas[0].departamento_nome, ...calcResumo(linhas) }))
    .sort((a, b) => a.departamento.localeCompare(b.departamento));
}

export async function getStats(user: AuthUser): Promise<DashboardStats> {
  if (temAcessoAmplo(user.role)) {
    const rows = await repository.findStatsRows();
    return {
      resumo_geral: calcResumo(rows),
      por_departamento: agruparPorDepartamento(rows),
      por_colaborador: agruparPorColaborador(rows),
    };
  }

  // GERENTES/COORDENADORES_SUPERVISORES só veem o próprio departamento.
  const rows = await repository.findStatsRows(user.departamentoId);
  const departamentoNome =
    rows[0]?.departamento_nome ??
    (await db('departamentos').select('nome').where('id', user.departamentoId).first())?.nome ??
    '';

  return {
    resumo_departamento: { departamento: departamentoNome, ...calcResumo(rows) },
    por_colaborador: agruparPorColaborador(rows),
  };
}
