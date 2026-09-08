import type { IndicadorStatus, Role } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  GERENTE_RH: 'Gerente de RH',
  GERENTE_DEPARTAMENTO: 'Gerente de Departamento',
  COLABORADOR: 'Colaborador',
};

export const ROLE_OPTIONS: Role[] = ['ADMIN', 'GERENTE_RH', 'GERENTE_DEPARTAMENTO', 'COLABORADOR'];

export const MANAGER_ROLES: Role[] = ['ADMIN', 'GERENTE_RH'];

// Quem pode aprovar/rejeitar em algum estágio do fluxo de conclusão (ver AprovacoesPage)
export const APPROVER_ROLES: Role[] = ['ADMIN', 'GERENTE_RH', 'GERENTE_DEPARTAMENTO'];

export const IMPORT_TEMPLATE_HEADERS = [
  'nome_colaborador',
  'email_colaborador',
  'departamento',
  'cargo',
  'nome_indicador',
  'peso',
  'objetivo',
  'safra',
];

export const STATUS_META: Record<IndicadorStatus, { label: string; badge: string; icon: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', badge: 'bg-warning/20 text-yellow-800', icon: '🟡' },
  AGUARDANDO_APROVACAO_GESTOR: { label: 'Aguardando Gestor', badge: 'bg-info/20 text-cyan-800', icon: '⏳' },
  AGUARDANDO_APROVACAO_RH: { label: 'Aguardando RH', badge: 'bg-primary/15 text-primary', icon: '⏳' },
  CONCLUIDO: { label: 'Concluído', badge: 'bg-success/15 text-success', icon: '✓' },
  ATRASADO: { label: 'Atrasado', badge: 'bg-danger/15 text-danger', icon: '⚠️' },
  PAUSADO: { label: 'Pausado', badge: 'bg-secondary/15 text-secondary', icon: '⏸️' },
};

// Todos os status, para filtros de listagem
export const STATUS_OPTIONS: IndicadorStatus[] = [
  'EM_ANDAMENTO',
  'AGUARDANDO_APROVACAO_GESTOR',
  'AGUARDANDO_APROVACAO_RH',
  'CONCLUIDO',
  'ATRASADO',
  'PAUSADO',
];

// Status que podem ser escolhidos manualmente no formulário de edição — conclusão
// só acontece pelo fluxo de aprovação (AprovacoesPage), nunca por edição direta.
export const STATUS_EDIT_OPTIONS: IndicadorStatus[] = ['EM_ANDAMENTO', 'ATRASADO', 'PAUSADO'];

export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

export const ACCEPTED_FILE_LABEL = 'PDF, DOC, DOCX, JPG, PNG';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const PAGE_SIZE = 25;
