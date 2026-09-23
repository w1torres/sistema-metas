import type {
  Attachment,
  Bonificacao,
  BonificacaoParticipante,
  Departamento,
  Indicador,
  IndicadorStatus,
  IndicadorUpdate,
  MinhaBonificacao,
  PilarPeso,
  PPRFaixa,
  Trilha,
  User,
} from '../types';

// Formato exato de app/src/types/index.ts (backend) — nomes de campo em
// snake_case/português vindos do banco, alguns diferentes do shape do
// frontend (ex.: avatar_url -> avatar, data_nascimento -> dataNascimento).
export interface BackendUser {
  id: string;
  email: string | null;
  nome: string;
  cpf: string | null;
  departamento_id: string;
  departamento?: string;
  cargo_id: string | null;
  cargo?: string | null;
  role: User['role'];
  avatar_url: string | null;
  ativo: boolean;
  data_nascimento: string | null;
  data_admissao: string | null;
  filial: string | null;
  criado_em: string;
  atualizado_em: string;
}

export function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    email: u.email ?? undefined,
    cpf: u.cpf ?? undefined,
    nome: u.nome,
    departamento_id: u.departamento_id,
    departamento: u.departamento ?? '',
    cargo: u.cargo ?? '',
    role: u.role,
    avatar: u.avatar_url ?? undefined,
    ativo: u.ativo,
    dataNascimento: u.data_nascimento ?? undefined,
    dataAdmissao: u.data_admissao ?? undefined,
    filial: u.filial ?? undefined,
    // "Departamentos adicionais" (gerente que também aprova outro depto)
    // ainda não tem equivalente no backend — ver plano.
    departamentosAdicionais: undefined,
  };
}

export interface BackendDepartamento {
  id: string;
  nome: string;
  descricao: string | null;
  gerente_id: string | null;
}

export function mapDepartamento(d: BackendDepartamento): Departamento {
  return { id: d.id, nome: d.nome, descricao: d.descricao ?? '' };
}

export interface BackendCargo {
  id: string;
  nome: string;
  descricao: string | null;
  nivel: string | null;
  trilha_id: string | null;
  grupo_ppr: string | null;
}

export interface BackendBonificacao {
  id: string;
  fornecedor: string;
  valor_total: number;
  mes_referencia: string;
  criado_por: string;
  criado_por_nome: string;
  total_colaboradores: number;
  valor_por_colaborador: number;
  paga: boolean;
  pago_em: string | null;
  criado_em: string;
  atualizado_em: string;
  participantes?: BackendBonificacaoParticipante[];
}

export function mapBonificacao(b: BackendBonificacao): Bonificacao {
  return {
    id: b.id,
    fornecedor: b.fornecedor,
    valorTotal: b.valor_total,
    mesReferencia: b.mes_referencia,
    criadoPor: b.criado_por,
    criadoPorNome: b.criado_por_nome,
    totalColaboradores: b.total_colaboradores,
    valorPorColaborador: b.valor_por_colaborador,
    paga: b.paga,
    pagoEm: b.pago_em,
    criadoEm: b.criado_em,
    atualizadoEm: b.atualizado_em,
    participantes: b.participantes?.map(mapBonificacaoParticipante),
  };
}

export interface BackendBonificacaoParticipante {
  id: string;
  bonificacao_id: string;
  usuario_id: string;
  usuario_nome: string;
  data_admissao: string | null;
  percentual_nota: number;
  valor_por_colaborador: number;
  valor_recebido: number;
}

export function mapBonificacaoParticipante(p: BackendBonificacaoParticipante): BonificacaoParticipante {
  return {
    id: p.id,
    bonificacaoId: p.bonificacao_id,
    usuarioId: p.usuario_id,
    usuarioNome: p.usuario_nome,
    dataAdmissao: p.data_admissao,
    percentualNota: p.percentual_nota,
    valorPorColaborador: p.valor_por_colaborador,
    valorRecebido: p.valor_recebido,
  };
}

export interface BackendMinhaBonificacao {
  id: string;
  fornecedor: string;
  valor_total: number;
  mes_referencia: string;
  percentual_nota: number;
  total_colaboradores: number;
  valor_por_colaborador: number;
  valor_recebido: number;
}

export function mapMinhaBonificacao(b: BackendMinhaBonificacao): MinhaBonificacao {
  return {
    id: b.id,
    fornecedor: b.fornecedor,
    valorTotal: b.valor_total,
    mesReferencia: b.mes_referencia,
    percentualNota: b.percentual_nota,
    totalColaboradores: b.total_colaboradores,
    valorPorColaborador: b.valor_por_colaborador,
    valorRecebido: b.valor_recebido,
  };
}

export interface BackendPPRFaixa {
  id: string;
  grupo_cargo: string;
  faixa_min: number;
  faixa_max: number;
  multiplo: number;
}

export function mapPPRFaixa(f: BackendPPRFaixa): PPRFaixa {
  return { id: f.id, cargo: f.grupo_cargo, faixaMin: f.faixa_min, faixaMax: f.faixa_max, multiplo: f.multiplo };
}

export interface BackendTrilhaPilar {
  pilar: string;
  peso: number;
  ordem: number | null;
}

export interface BackendTrilha {
  id: string;
  nome: string;
  descricao: string | null;
  pilares: BackendTrilhaPilar[];
}

function mapPilarPeso(p: BackendTrilhaPilar): PilarPeso {
  return { pilar: p.pilar, peso: p.peso };
}

export function mapTrilha(t: BackendTrilha): Trilha {
  return { id: t.id, nome: t.nome, descricao: t.descricao ?? '', pilares: t.pilares.map(mapPilarPeso) };
}

export interface BackendAtingimentoFaixa {
  id: string;
  faixa_min: number;
  faixa_max: number;
  percentual_peso: number;
}

export interface AtingimentoFaixa {
  id: string;
  faixaMin: number;
  faixaMax: number;
  percentualPeso: number;
}

export function mapAtingimentoFaixa(f: BackendAtingimentoFaixa): AtingimentoFaixa {
  return { id: f.id, faixaMin: f.faixa_min, faixaMax: f.faixa_max, percentualPeso: f.percentual_peso };
}

// --- Indicadores -----------------------------------------------------------

// O backend nomeia os 2 status de aprovação diferente do frontend (herdado
// de antes da integração real) — traduzido só aqui, pra não precisar mudar
// toda comparação `status === 'AGUARDANDO_APROVACAO_GESTOR'` já espalhada
// pelas telas (Sidebar, AprovacoesPage, IndicadorCard, etc.).
const STATUS_BACKEND_PARA_FRONTEND: Record<string, IndicadorStatus> = {
  AGUARDANDO_APROVACAO: 'AGUARDANDO_APROVACAO_GESTOR',
  AGUARDANDO_RH: 'AGUARDANDO_APROVACAO_RH',
};

function mapIndicadorStatus(status: string): IndicadorStatus {
  return (STATUS_BACKEND_PARA_FRONTEND[status] ?? status) as IndicadorStatus;
}

export interface BackendAttachment {
  id: string;
  indicador_id: string;
  usuario_id: string;
  nome_arquivo: string;
  url: string;
  tipo_mime: string | null;
  // bigint no Postgres — o driver pg devolve como string (evita perda de
  // precisão acima de Number.MAX_SAFE_INTEGER), nunca um number de verdade.
  tamanho_bytes: string | number | null;
  descricao: string | null;
  criado_em: string;
}

// `url` do backend é o caminho em disco do servidor (armazenamento local) —
// nunca exposto como está; o frontend baixa pelo endpoint autenticado
// (ver apiClient.downloadFile) usando indicadorId+attachmentId, não essa URL.
export function mapAttachment(a: BackendAttachment): Attachment {
  return {
    id: a.id,
    nome_arquivo: a.nome_arquivo,
    url: `/indicators/${a.indicador_id}/attachments/${a.id}/download`,
    tipo_mime: a.tipo_mime ?? '',
    tamanho_bytes: a.tamanho_bytes != null ? Number(a.tamanho_bytes) : 0,
    descricao: a.descricao ?? undefined,
    criado_em: a.criado_em,
  };
}

export interface BackendIndicador {
  id: string;
  departamento_id: string;
  departamento?: string;
  usuario_responsavel_id: string;
  responsavel?: string;
  nome: string;
  peso: number;
  status: string;
  atendimento: number;
  detalhamento: string | null;
  objetivo: string | null;
  data_inicio: string;
  data_fim: string;
  concluido_em: string | null;
  criado_em: string;
  atualizado_em: string;
  funcao: string | null;
  pilar: string | null;
  meta: string | null;
  forma_medicao: string | null;
  evidencia_obrigatoria: string | null;
  tabela_atingimento: { faixa: string; percentualPeso: number }[] | null;
  nota_conclusao_atual?: string | null;
  observacao_gestor?: string | null;
  observacao_rh?: string | null;
  anexos?: BackendAttachment[];
}

export function mapIndicador(i: BackendIndicador): Indicador {
  return {
    id: i.id,
    departamento_id: i.departamento_id,
    departamento: i.departamento ?? '',
    usuario_responsavel_id: i.usuario_responsavel_id,
    responsavel: i.responsavel ?? '',
    nome: i.nome,
    peso: i.peso,
    status: mapIndicadorStatus(i.status),
    atendimento: i.atendimento,
    detalhamento: i.detalhamento ?? '',
    objetivo: i.objetivo ?? '',
    data_inicio: i.data_inicio,
    data_fim: i.data_fim,
    concluido_em: i.concluido_em,
    criado_em: i.criado_em,
    atualizado_em: i.atualizado_em,
    anexos: (i.anexos ?? []).map(mapAttachment),
    funcao: i.funcao ?? undefined,
    pilar: i.pilar ?? undefined,
    meta: i.meta ?? undefined,
    formaMedicao: i.forma_medicao ?? undefined,
    evidenciaObrigatoria: i.evidencia_obrigatoria ?? undefined,
    tabelaAtingimento: i.tabela_atingimento ?? undefined,
    notaConclusaoAtual: i.nota_conclusao_atual ?? null,
    observacaoGestor: i.observacao_gestor ?? null,
    observacaoRH: i.observacao_rh ?? null,
  };
}

export interface BackendIndicadorUpdate {
  id: string;
  indicador_id: string;
  usuario_alterou_id: string;
  usuario_nome: string;
  tipo_alteracao: IndicadorUpdate['tipo_alteracao'];
  campo_alterado: string | null;
  valor_anterior: unknown;
  valor_novo: unknown;
  motivo: string | null;
  observacao?: string | null;
  criado_em: string;
}

export function mapIndicadorUpdate(h: BackendIndicadorUpdate): IndicadorUpdate {
  return {
    id: h.id,
    indicador_id: h.indicador_id,
    usuario_alterou_id: h.usuario_alterou_id,
    usuario_nome: h.usuario_nome,
    tipo_alteracao: h.tipo_alteracao,
    campo_alterado: h.campo_alterado,
    valor_anterior: h.valor_anterior,
    valor_novo: h.valor_novo,
    motivo: h.motivo,
    observacao: h.observacao ?? null,
    // Nunca preenchido pelo backend (sem coluna própria) — a "Tabela de
    // Atingimento" por indicador nunca chegou a ser exposta na tela de
    // criação/edição, então esse valor nunca existe na prática.
    percentualAtingido: null,
    criado_em: h.criado_em,
  };
}
