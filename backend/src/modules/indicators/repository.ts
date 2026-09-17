import { db } from '../../db/knex.js';
import type { Attachment, FaixaAtingimento, Indicador, IndicadorStatus, IndicadorUpdate, TipoAlteracao } from '../../types/index.js';

const SELECT_COLUMNS = [
  'indicadores.id',
  'indicadores.departamento_id',
  'departamentos.nome as departamento',
  'indicadores.usuario_responsavel_id',
  'users.nome as responsavel',
  'indicadores.nome',
  'indicadores.peso',
  'indicadores.status',
  'indicadores.atendimento',
  'indicadores.detalhamento',
  'indicadores.objetivo',
  'indicadores.data_inicio',
  'indicadores.data_fim',
  'indicadores.concluido_em',
  'indicadores.criado_em',
  'indicadores.atualizado_em',
  'indicadores.funcao',
  'indicadores.pilar',
  'indicadores.meta',
  'indicadores.forma_medicao',
  'indicadores.evidencia_obrigatoria',
  'indicadores.tabela_atingimento',
];

function baseQuery() {
  return db('indicadores')
    .join('departamentos', 'departamentos.id', 'indicadores.departamento_id')
    .join('users', 'users.id', 'indicadores.usuario_responsavel_id')
    .select(SELECT_COLUMNS);
}

function mapRow(row: any): Indicador {
  return {
    ...row,
    peso: Number(row.peso),
    atendimento: Number(row.atendimento),
  };
}

// tabela_atingimento é jsonb — precisa ir serializado no insert/update, e só
// quando o campo foi de fato enviado (pra não sobrescrever com null um
// update parcial que não mexeu nesse campo).
function serializarTabelaAtingimento<T extends { tabela_atingimento?: FaixaAtingimento[] | null }>(
  input: T,
): Omit<T, 'tabela_atingimento'> & { tabela_atingimento?: string | null } {
  const { tabela_atingimento, ...resto } = input;
  if (tabela_atingimento === undefined) return resto;
  return { ...resto, tabela_atingimento: tabela_atingimento === null ? null : JSON.stringify(tabela_atingimento) };
}

export interface IndicadorFilters {
  departamentoId?: string;
  usuarioResponsavelId?: string;
  status?: IndicadorStatus;
  search?: string;
}

export async function findMany(filters: IndicadorFilters): Promise<Indicador[]> {
  const query = baseQuery();
  if (filters.departamentoId) query.where('indicadores.departamento_id', filters.departamentoId);
  if (filters.usuarioResponsavelId) query.where('indicadores.usuario_responsavel_id', filters.usuarioResponsavelId);
  if (filters.status) query.where('indicadores.status', filters.status);
  if (filters.search) {
    query.where((qb) => {
      qb.whereILike('indicadores.nome', `%${filters.search}%`).orWhereILike('users.nome', `%${filters.search}%`);
    });
  }
  const rows = await query.orderBy('indicadores.criado_em', 'desc');
  return rows.map(mapRow);
}

export async function findById(id: string): Promise<Indicador | undefined> {
  const row = await baseQuery().where('indicadores.id', id).first();
  return row ? mapRow(row) : undefined;
}

interface CreateIndicadorInput {
  departamento_id: string;
  usuario_responsavel_id: string;
  nome: string;
  peso: number;
  objetivo?: string | null;
  detalhamento?: string | null;
  data_inicio: string;
  data_fim: string;
  funcao?: string | null;
  pilar?: string | null;
  meta?: string | null;
  forma_medicao?: string | null;
  evidencia_obrigatoria?: string | null;
  tabela_atingimento?: FaixaAtingimento[] | null;
}

export async function create(input: CreateIndicadorInput): Promise<Indicador> {
  const [row] = await db('indicadores')
    .insert(
      serializarTabelaAtingimento({
        departamento_id: input.departamento_id,
        usuario_responsavel_id: input.usuario_responsavel_id,
        nome: input.nome,
        peso: input.peso,
        objetivo: input.objetivo ?? null,
        detalhamento: input.detalhamento ?? null,
        data_inicio: input.data_inicio,
        data_fim: input.data_fim,
        funcao: input.funcao ?? null,
        pilar: input.pilar ?? null,
        meta: input.meta ?? null,
        forma_medicao: input.forma_medicao ?? null,
        evidencia_obrigatoria: input.evidencia_obrigatoria ?? null,
        tabela_atingimento: input.tabela_atingimento ?? null,
      }),
    )
    .returning('id');
  const created = await findById(row.id);
  if (!created) throw new Error('Falha ao carregar indicador recém-criado');
  return created;
}

type UpdatableFields = Partial<
  Pick<
    Indicador,
    | 'nome'
    | 'peso'
    | 'objetivo'
    | 'detalhamento'
    | 'data_inicio'
    | 'data_fim'
    | 'funcao'
    | 'pilar'
    | 'meta'
    | 'forma_medicao'
    | 'evidencia_obrigatoria'
    | 'tabela_atingimento'
  >
>;

export async function update(id: string, fields: UpdatableFields): Promise<Indicador | undefined> {
  await db('indicadores')
    .where('id', id)
    .update({ ...serializarTabelaAtingimento(fields), atualizado_em: db.fn.now() });
  return findById(id);
}

export async function updateStatus(
  id: string,
  status: IndicadorStatus,
  extra: Partial<Pick<Indicador, 'atendimento' | 'concluido_em'>> = {},
): Promise<Indicador | undefined> {
  await db('indicadores')
    .where('id', id)
    .update({ status, ...extra, atualizado_em: db.fn.now() });
  return findById(id);
}

export async function reatribuir(id: string, novoResponsavelId: string): Promise<Indicador | undefined> {
  await db('indicadores')
    .where('id', id)
    .update({ usuario_responsavel_id: novoResponsavelId, atualizado_em: db.fn.now() });
  return findById(id);
}

export async function remove(id: string): Promise<void> {
  await db('indicadores').where('id', id).delete();
}

// --- Histórico / auditoria ---------------------------------------------

interface HistoryEntry {
  indicador_id: string;
  usuario_alterou_id: string;
  tipo_alteracao: TipoAlteracao;
  campo_alterado?: string | null;
  valor_anterior?: unknown;
  valor_novo?: unknown;
  motivo?: string | null;
  observacao?: string | null;
}

export async function pushHistory(entry: HistoryEntry): Promise<void> {
  await db('indicador_updates').insert({
    indicador_id: entry.indicador_id,
    usuario_alterou_id: entry.usuario_alterou_id,
    tipo_alteracao: entry.tipo_alteracao,
    campo_alterado: entry.campo_alterado ?? null,
    valor_anterior: entry.valor_anterior !== undefined ? JSON.stringify(entry.valor_anterior) : null,
    valor_novo: entry.valor_novo !== undefined ? JSON.stringify(entry.valor_novo) : null,
    motivo: entry.motivo ?? null,
    observacao: entry.observacao ?? null,
  });
}

export async function historyFor(indicadorId: string): Promise<IndicadorUpdate[]> {
  return db('indicador_updates')
    .join('users', 'users.id', 'indicador_updates.usuario_alterou_id')
    .where('indicador_updates.indicador_id', indicadorId)
    .select(
      'indicador_updates.id',
      'indicador_updates.indicador_id',
      'indicador_updates.usuario_alterou_id',
      'users.nome as usuario_nome',
      'indicador_updates.tipo_alteracao',
      'indicador_updates.campo_alterado',
      'indicador_updates.valor_anterior',
      'indicador_updates.valor_novo',
      'indicador_updates.motivo',
      'indicador_updates.observacao',
      'indicador_updates.criado_em',
    )
    .orderBy('indicador_updates.criado_em', 'desc');
}

export async function notaConclusaoAtual(indicadorId: string): Promise<string | null> {
  const entrada = await db('indicador_updates')
    .where({ indicador_id: indicadorId, tipo_alteracao: 'SOLICITACAO_CONCLUSAO' })
    .orderBy('criado_em', 'desc')
    .first();
  return entrada?.motivo ?? null;
}

// --- Anexos ---------------------------------------------------------------

export async function addAttachment(input: {
  indicador_id: string;
  usuario_id: string;
  nome_arquivo: string;
  url: string;
  tipo_mime?: string | null;
  tamanho_bytes?: number | null;
}): Promise<Attachment> {
  const [row] = await db('attachments')
    .insert({
      indicador_id: input.indicador_id,
      usuario_id: input.usuario_id,
      nome_arquivo: input.nome_arquivo,
      url: input.url,
      tipo_mime: input.tipo_mime ?? null,
      tamanho_bytes: input.tamanho_bytes ?? null,
    })
    .returning('*');
  return row;
}

export async function listAttachments(indicadorId: string): Promise<Attachment[]> {
  return db('attachments').where('indicador_id', indicadorId).orderBy('criado_em', 'desc');
}

export async function findAttachment(id: string): Promise<Attachment | undefined> {
  return db('attachments').where('id', id).first();
}

export async function removeAttachment(id: string): Promise<void> {
  await db('attachments').where('id', id).delete();
}
