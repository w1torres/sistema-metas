import type { IndicadorStatus, Role, User } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  MASTER: 'Master',
  ADMIN: 'Administrador',
  GERENTES: 'Gerente',
  COORDENADORES_SUPERVISORES: 'Coordenador/Supervisor',
  COLABORADOR: 'Colaborador',
};

// Ordem = hierarquia, do topo (Master) à base (Colaborador) — mesma ordem
// usada no seletor de cadastro.
export const ROLE_OPTIONS: Role[] = ['MASTER', 'ADMIN', 'GERENTES', 'COORDENADORES_SUPERVISORES', 'COLABORADOR'];

export const MANAGER_ROLES: Role[] = ['ADMIN', 'MASTER'];

// Quem pode aprovar/rejeitar em algum estágio do fluxo de conclusão (ver AprovacoesPage)
export const APPROVER_ROLES: Role[] = ['ADMIN', 'MASTER', 'GERENTES'];

// Coordenadores/Supervisores têm o mesmo nível de acesso que Colaborador —
// só o múltiplo de PPR muda entre os dois (ver utils/ppr.ts). Usar esta
// lista em qualquer verificação de RBAC/navegação que hoje checaria
// só 'COLABORADOR'.
export const COLABORADOR_TIER_ROLES: Role[] = ['COLABORADOR', 'COORDENADORES_SUPERVISORES'];

// Departamentos que um GERENTES aprova: o principal (departamento_id) mais
// quaisquer adicionais (ex.: gerente administrativo que também responde por
// Compras, Estoque e Faturamento). Deduplicado — para outros papéis, retorna
// só o próprio departamento (sem uso prático, já que só GERENTES é escopado
// por departamento nas aprovações).
export function departamentosDoGestor(user: Pick<User, 'departamento_id' | 'departamentosAdicionais'>): string[] {
  return Array.from(new Set([user.departamento_id, ...(user.departamentosAdicionais ?? [])]));
}

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

export const IMPORT_USUARIOS_TEMPLATE_HEADERS = [
  'nome',
  'email',
  'cpf',
  'matricula',
  'departamento',
  'cargo',
  'role',
  'filial',
  'data_nascimento',
  'data_admissao',
  'telefone',
  'celular',
  'endereco',
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
