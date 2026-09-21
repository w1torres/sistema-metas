import { db } from '../../db/knex.js';

export interface Bonificacao {
  id: string;
  fornecedor: string;
  valor_total: number;
  mes_referencia: string;
  criado_por: string;
  criado_por_nome?: string;
  paga: boolean;
  pago_em: string | null;
  criado_em: string;
  atualizado_em: string;
  total_colaboradores: number;
}

export interface BonificacaoParticipante {
  id: string;
  bonificacao_id: string;
  usuario_id: string;
  usuario_nome: string;
  data_admissao: string | null;
  percentual_nota: number;
  criado_em: string;
  atualizado_em: string;
}

export interface MinhaBonificacao {
  id: string;
  fornecedor: string;
  valor_total: number;
  mes_referencia: string;
  percentual_nota: number;
  total_colaboradores: number;
}

const BASE_COLUMNS = [
  'bonificacoes.id',
  'bonificacoes.fornecedor',
  'bonificacoes.valor_total',
  'bonificacoes.mes_referencia',
  'bonificacoes.criado_por',
  'bonificacoes.paga',
  'bonificacoes.pago_em',
  'bonificacoes.criado_em',
  'bonificacoes.atualizado_em',
];
// GROUP BY não aceita "coluna AS alias" (erro de sintaxe) — precisa da
// referência crua, diferente da lista usada no SELECT.
const GROUP_BY_COLUMNS = [...BASE_COLUMNS, 'users.nome'];

function mapBonificacao(row: any): Bonificacao {
  return {
    ...row,
    valor_total: Number(row.valor_total),
    total_colaboradores: Number(row.total_colaboradores),
  };
}

function baseQuery() {
  return db('bonificacoes')
    .join('users', 'users.id', 'bonificacoes.criado_por')
    // Só colaboradores ativos entram no total (e, portanto, no valor por colaborador).
    .leftJoin(
      db.raw(
        '(bonificacao_colaboradores bc JOIN users uc ON uc.id = bc.usuario_id AND uc.ativo = true) ON bc.bonificacao_id = bonificacoes.id',
      ),
    )
    .select([...BASE_COLUMNS, 'users.nome as criado_por_nome', db.raw('COUNT(bc.id)::int as total_colaboradores')])
    .groupBy(GROUP_BY_COLUMNS);
}

export async function findAll(): Promise<Bonificacao[]> {
  const rows = await baseQuery().orderBy('bonificacoes.mes_referencia', 'desc').orderBy('bonificacoes.criado_em', 'desc');
  return rows.map(mapBonificacao);
}

export async function findById(id: string): Promise<Bonificacao | undefined> {
  const row = await baseQuery().where('bonificacoes.id', id).first();
  return row ? mapBonificacao(row) : undefined;
}

export async function create(input: {
  fornecedor: string;
  valor_total: number;
  mes_referencia: string;
  criado_por: string;
}): Promise<Bonificacao> {
  const [row] = await db('bonificacoes').insert(input).returning('id');
  return (await findById(row.id))!;
}

export async function update(
  id: string,
  input: Partial<{ fornecedor: string; valor_total: number; mes_referencia: string }>,
): Promise<Bonificacao | undefined> {
  await db('bonificacoes')
    .where({ id })
    .update({ ...input, atualizado_em: db.fn.now() });
  return findById(id);
}

export async function remove(id: string): Promise<void> {
  await db('bonificacoes').where({ id }).del();
}

export async function setPaga(id: string, paga: boolean): Promise<Bonificacao | undefined> {
  await db('bonificacoes')
    .where({ id })
    .update({ paga, pago_em: paga ? db.fn.now() : null, atualizado_em: db.fn.now() });
  return findById(id);
}

export async function findParticipantes(bonificacaoId: string): Promise<BonificacaoParticipante[]> {
  const rows = await db('bonificacao_colaboradores as bc')
    .join('users', 'users.id', 'bc.usuario_id')
    .select([
      'bc.id',
      'bc.bonificacao_id',
      'bc.usuario_id',
      'users.nome as usuario_nome',
      db.raw("to_char(users.data_admissao, 'YYYY-MM-DD') as data_admissao"),
      'bc.percentual_nota',
      'bc.criado_em',
      'bc.atualizado_em',
    ])
    .where('bc.bonificacao_id', bonificacaoId)
    .where('users.ativo', true)
    .orderBy('users.nome');
  return rows.map((row) => ({ ...row, percentual_nota: Number(row.percentual_nota) }));
}

/**
 * Sincroniza os participantes com a lista de elegíveis calculada pelo
 * service (ver sincronizarParticipantesElegiveis) — quem já era participante
 * mantém a nota que já tinha (não reseta pra o padrão à toa); quem está
 * entrando agora recebe `percentualNotaPadrao`; quem não é mais elegível é
 * removido.
 */
export async function sincronizarParticipantes(
  bonificacaoId: string,
  usuarioIds: string[],
  percentualNotaPadrao: number,
): Promise<void> {
  await db.transaction(async (trx) => {
    const existentes: { usuario_id: string }[] = await trx('bonificacao_colaboradores')
      .where({ bonificacao_id: bonificacaoId })
      .select('usuario_id');
    const existentesIds = new Set(existentes.map((e) => e.usuario_id));
    const novosIds = new Set(usuarioIds);

    const paraRemover = [...existentesIds].filter((id) => !novosIds.has(id));
    if (paraRemover.length > 0) {
      await trx('bonificacao_colaboradores')
        .where({ bonificacao_id: bonificacaoId })
        .whereIn('usuario_id', paraRemover)
        .del();
    }

    const paraInserir = usuarioIds.filter((id) => !existentesIds.has(id));
    if (paraInserir.length > 0) {
      await trx('bonificacao_colaboradores').insert(
        paraInserir.map((usuario_id) => ({
          bonificacao_id: bonificacaoId,
          usuario_id,
          percentual_nota: percentualNotaPadrao,
        })),
      );
    }
  });
}

export async function updateParticipanteNota(
  bonificacaoId: string,
  usuarioId: string,
  percentualNota: number,
): Promise<boolean> {
  const linhas = await db('bonificacao_colaboradores')
    .where({ bonificacao_id: bonificacaoId, usuario_id: usuarioId })
    .update({ percentual_nota: percentualNota, atualizado_em: db.fn.now() });
  return linhas > 0;
}

/** Aplica a nota a todas as bonificações em que o colaborador participa; devolve quantas linhas foram atualizadas. */
export async function updateNotaPorUsuario(usuarioId: string, percentualNota: number): Promise<number> {
  return db('bonificacao_colaboradores')
    .where({ usuario_id: usuarioId })
    .update({ percentual_nota: percentualNota, atualizado_em: db.fn.now() });
}

export async function findMinhas(usuarioId: string): Promise<MinhaBonificacao[]> {
  const rows = await db('bonificacao_colaboradores as bc')
    .join('bonificacoes as b', 'b.id', 'bc.bonificacao_id')
    .select([
      'b.id',
      'b.fornecedor',
      'b.valor_total',
      'b.mes_referencia',
      'bc.percentual_nota',
      db.raw(
        '(SELECT COUNT(*) FROM bonificacao_colaboradores bc2 JOIN users u2 ON u2.id = bc2.usuario_id WHERE bc2.bonificacao_id = b.id AND u2.ativo = true)::int as total_colaboradores',
      ),
    ])
    .where('bc.usuario_id', usuarioId)
    .orderBy('b.mes_referencia', 'desc');
  return rows.map((row) => ({
    ...row,
    valor_total: Number(row.valor_total),
    percentual_nota: Number(row.percentual_nota),
  }));
}
