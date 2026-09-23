export type Role = 'MASTER' | 'ADMIN' | 'GERENTES' | 'COORDENADORES_SUPERVISORES' | 'COLABORADOR';

export type IndicadorStatus =
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_APROVACAO'
  | 'AGUARDANDO_RH'
  | 'CONCLUIDO'
  | 'ATRASADO'
  | 'PAUSADO';

export type TipoAlteracao =
  | 'CRIACAO'
  | 'EDICAO'
  | 'CONCLUSAO'
  | 'REATRIBUICAO'
  | 'SOLICITACAO_CONCLUSAO'
  | 'APROVACAO_GESTOR'
  | 'APROVACAO_RH'
  | 'REJEICAO';

export const PPR_GRUPOS = ['GERENTES', 'COORDENADORES E SUPERVISORES', 'DEMAIS CARGOS'] as const;
export type GrupoPPR = (typeof PPR_GRUPOS)[number];

export interface AuthUser {
  id: string;
  email: string | null;
  nome: string;
  role: Role;
  departamentoId: string;
}

export interface User {
  id: string;
  // Opcional: usuário pode ser cadastrado só com CPF (ver
  // ImportUsuariosModal.tsx no frontend) até alguém completar o cadastro
  // com o email/Entra ID.
  email: string | null;
  nome: string;
  cpf: string | null;
  departamento_id: string;
  departamento?: string;
  cargo_id: string | null;
  cargo?: string | null;
  role: Role;
  avatar_url: string | null;
  ativo: boolean;
  data_nascimento: string | null;
  data_admissao: string | null;
  filial: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Departamento {
  id: string;
  nome: string;
  descricao: string | null;
  gerente_id: string | null;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao: string | null;
  nivel: string | null;
  trilha_id: string | null;
  grupo_ppr: GrupoPPR | null;
}

export interface TrilhaPilar {
  pilar: string;
  peso: number;
  ordem: number | null;
}

export interface Trilha {
  id: string;
  nome: string;
  descricao: string | null;
  pilares: TrilhaPilar[];
}

export interface FaixaAtingimento {
  faixa: string;
  percentualPeso: number;
}

export interface Indicador {
  id: string;
  departamento_id: string;
  departamento?: string;
  usuario_responsavel_id: string;
  responsavel?: string;
  nome: string;
  peso: number;
  status: IndicadorStatus;
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
  tabela_atingimento: FaixaAtingimento[] | null;
  // Embutidos na listagem/detalhe (subquery em repository.ts) — evita o
  // frontend ter que buscar o histórico completo só pra mostrar a nota do
  // colaborador e a observação do gestor no card do indicador.
  nota_conclusao_atual?: string | null;
  observacao_gestor?: string | null;
  observacao_rh?: string | null;
  anexos?: Attachment[];
}

export interface IndicadorUpdate {
  id: string;
  indicador_id: string;
  usuario_alterou_id: string;
  usuario_nome?: string;
  tipo_alteracao: TipoAlteracao;
  campo_alterado: string | null;
  valor_anterior: unknown;
  valor_novo: unknown;
  motivo: string | null;
  observacao: string | null;
  criado_em: string;
}

export interface Attachment {
  id: string;
  indicador_id: string;
  usuario_id: string;
  nome_arquivo: string;
  url: string;
  tipo_mime: string | null;
  tamanho_bytes: number | null;
  descricao: string | null;
  criado_em: string;
}

export interface PPRFaixa {
  id: string;
  grupo_cargo: GrupoPPR;
  faixa_min: number;
  faixa_max: number;
  multiplo: number;
}

export interface DashboardResumo {
  total_indicadores: number;
  pendentes: number;
  em_aprovacao: number;
  aprovados: number;
  taxa_conclusao: number;
}

export interface DashboardStats {
  resumo_geral?: DashboardResumo;
  resumo_departamento?: DashboardResumo & { departamento: string };
  por_departamento?: Array<{ departamento: string } & DashboardResumo>;
  por_colaborador: Array<
    { nome: string; email: string; departamento?: string } & DashboardResumo
  >;
}
