// Papel/Perfil: um único campo que define, ao mesmo tempo, o grupo de PPR
// (ver utils/ppr.ts) e a permissão de acesso (RBAC) — não existe mais um
// campo "Cargo" separado que influencie PPR ou permissões.
// GERENTES: aprova 1º nível do próprio departamento (era GERENTE_DEPARTAMENTO).
// COORDENADORES_SUPERVISORES / COLABORADOR: mesmo nível de acesso (sem
// aprovação), só o múltiplo de PPR muda entre os dois.
// ADMIN: administração do sistema/usuários. MASTER: Gerente de RH + Controller
// — vê e aprova em todos os departamentos (era GERENTE_RH).
export type Role = 'GERENTES' | 'COORDENADORES_SUPERVISORES' | 'COLABORADOR' | 'ADMIN' | 'MASTER';

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
  dataNascimento?: string;
  dataAdmissao?: string;
  filial?: string;
  enderecoCompleto?: string;
  telefone?: string;
  celular?: string;
  // Só relevante para role GERENTES: departamentos além do `departamento_id`
  // (o "principal") que este gestor também aprova — ex.: gerente
  // administrativo que também responde por Compras, Estoque e Faturamento.
  departamentosAdicionais?: string[];
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

export interface FaixaAtingimento {
  faixa: string;
  percentualPeso: number;
}

// Indicador ANUAL: um único ciclo colaborador -> gestor -> RH para o
// período inteiro (fluxo já existente). Indicador MENSAL: um registro por
// mês, só colaborador -> gestor (sem RH por mês) — o RH/controller só entra
// para uma validação final única, depois que o período termina.
export type PeriodicidadeIndicador = 'ANUAL' | 'MENSAL';

export type StatusRegistroMensal = 'PENDENTE' | 'AGUARDANDO_GESTOR' | 'APROVADO';

export interface RegistroMensal {
  mes: string; // "YYYY-MM"
  status: StatusRegistroMensal;
  nota?: string | null;
  observacaoGestor?: string | null;
  enviado_em?: string | null;
  aprovado_em?: string | null;
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
  // Detalhamento adicional do catálogo de indicadores (planilha de PPR por função/pilar).
  // Opcionais porque indicadores mais antigos do mock não têm esse detalhamento.
  funcao?: string;
  pilar?: string;
  meta?: string;
  formaMedicao?: string;
  evidenciaObrigatoria?: string;
  tabelaAtingimento?: FaixaAtingimento[];
  // Percentual do peso escolhido pelo gestor do departamento na 1ª aprovação,
  // a partir da Tabela de Atingimento (quando existe) — fica pendente até o
  // RH dar a avaliação final, momento em que vira o `atendimento` definitivo.
  percentualAtingido?: number | null;
  // Ausente == 'ANUAL' (indicadores existentes continuam no fluxo de sempre).
  periodicidade?: PeriodicidadeIndicador;
  registrosMensais?: RegistroMensal[];
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
  // Observação livre de quem aprovou, dirigida a quem vai receber o
  // indicador em seguida (gestor -> RH, RH -> colaborador) — distinta do
  // `motivo` (texto fixo do sistema, ex: "Aprovado pelo gestor do departamento").
  observacao?: string | null;
  // Presente só no evento APROVACAO_GESTOR de indicadores com Tabela de
  // Atingimento: o % do peso que o gestor marcou como resultado atingido.
  percentualAtingido?: number | null;
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

export interface PilarPeso {
  pilar: string;
  peso: number;
}

export interface Trilha {
  id: string;
  nome: string;
  descricao: string;
  pilares: PilarPeso[];
}
