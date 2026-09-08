export type Role = 'ADMIN' | 'GERENTE_RH' | 'GERENTE_DEPARTAMENTO' | 'COLABORADOR';

export type IndicadorStatus =
  | 'EM_ANDAMENTO'
  | 'AGUARDANDO_APROVACAO_GESTOR'
  | 'AGUARDANDO_APROVACAO_RH'
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

export interface User {
  id: string;
  email: string;
  cpf?: string;
  matricula?: string;
  nome: string;
  departamento_id: string;
  departamento: string;
  cargo: string;
  role: Role;
  avatar?: string;
  ativo: boolean;
}

export interface Departamento {
  id: string;
  nome: string;
  descricao: string;
}

export interface Attachment {
  id: string;
  nome_arquivo: string;
  url: string;
  tipo_mime: string;
  tamanho_bytes: number;
  descricao?: string;
  criado_em: string;
}

export interface Indicador {
  id: string;
  departamento_id: string;
  departamento: string;
  usuario_responsavel_id: string;
  responsavel: string;
  nome: string;
  peso: number;
  status: IndicadorStatus;
  atendimento: number;
  detalhamento: string;
  objetivo: string;
  data_inicio: string;
  data_fim: string;
  concluido_em: string | null;
  criado_em: string;
  atualizado_em: string;
  anexos: Attachment[];
}

export interface IndicadorUpdate {
  id: string;
  indicador_id: string;
  usuario_alterou_id: string;
  usuario_nome: string;
  tipo_alteracao: TipoAlteracao;
  campo_alterado: string | null;
  valor_anterior: unknown;
  valor_novo: unknown;
  motivo: string | null;
  criado_em: string;
}

export interface IndicadorFilters {
  departamento: string | null;
  status: IndicadorStatus | null;
  search: string;
}

export interface PPRFaixa {
  id: string;
  cargo: string;
  faixaMin: number;
  faixaMax: number;
  multiplo: number;
}
