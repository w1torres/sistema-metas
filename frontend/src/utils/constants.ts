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

// Sinônimos aceitos na coluna "role" da importação em planilha — além dos
// valores exatos do enum (Role), aceita os rótulos exibidos na tela e os
// nomes dos grupos da Tabela de Múltiplos de PPR (ex.: "DEMAIS CARGOS" é como
// o grupo do COLABORADOR aparece lá, mas o rótulo do perfil continua sendo
// "Colaborador" no resto do app — ver utils/ppr.ts).
export const ROLE_ALIASES: Record<string, Role> = {
  MASTER: 'MASTER',
  ADMIN: 'ADMIN',
  ADMINISTRADOR: 'ADMIN',
  GERENTES: 'GERENTES',
  GERENTE: 'GERENTES',
  COORDENADORES_SUPERVISORES: 'COORDENADORES_SUPERVISORES',
  'COORDENADORES E SUPERVISORES': 'COORDENADORES_SUPERVISORES',
  'COORDENADOR/SUPERVISOR': 'COORDENADORES_SUPERVISORES',
  'COORDENADOR E SUPERVISOR': 'COORDENADORES_SUPERVISORES',
  // A planilha pode trazer "Coordenador" e "Supervisor" como cargos
  // separados — os dois caem no mesmo perfil COORDENADORES_SUPERVISORES
  // (não existe um perfil só pra cada um).
  COORDENADOR: 'COORDENADORES_SUPERVISORES',
  COORDENADORES: 'COORDENADORES_SUPERVISORES',
  SUPERVISOR: 'COORDENADORES_SUPERVISORES',
  SUPERVISORES: 'COORDENADORES_SUPERVISORES',
  COLABORADOR: 'COLABORADOR',
  'DEMAIS CARGOS': 'COLABORADOR',
};

export const MANAGER_ROLES: Role[] = ['ADMIN', 'MASTER'];

// Quem pode aprovar/rejeitar em algum estágio do fluxo de conclusão (ver
// AprovacoesPage). COORDENADORES_SUPERVISORES só de fato aprova quando
// `ehGestorDepartamento` abaixo confirma que ele lidera o departamento (sem
// Gerente lá) — a página/rota trata o caso contrário como sem acesso.
export const APPROVER_ROLES: Role[] = ['ADMIN', 'MASTER', 'GERENTES', 'COORDENADORES_SUPERVISORES'];

// Coordenadores/Supervisores têm o mesmo nível de acesso que Colaborador —
// só o múltiplo de PPR muda entre os dois (ver utils/ppr.ts) — EXCETO
// aprovação de departamento, onde ele assume o papel de GERENTES se o
// departamento não tiver nenhum Gerente ativo (ver `ehGestorDepartamento`).
// Usar esta lista em qualquer outra verificação de RBAC/navegação que hoje
// checaria só 'COLABORADOR'.
export const COLABORADOR_TIER_ROLES: Role[] = ['COLABORADOR', 'COORDENADORES_SUPERVISORES'];

// Departamentos que um GERENTES aprova: o principal (departamento_id) mais
// quaisquer adicionais (ex.: gerente administrativo que também responde por
// Compras, Estoque e Faturamento). Deduplicado — para outros papéis, retorna
// só o próprio departamento (sem uso prático, já que só GERENTES é escopado
// por departamento nas aprovações).
export function departamentosDoGestor(user: Pick<User, 'departamento_id' | 'departamentosAdicionais'>): string[] {
  return Array.from(new Set([user.departamento_id, ...(user.departamentosAdicionais ?? [])]));
}

// Um Coordenador/Supervisor assume a aprovação de 1º nível (mesmo papel de
// GERENTES) só nos departamentos que não têm nenhum Gerente ativo — comum em
// unidades regionais menores do organograma real importado, onde o
// Coordenador/Supervisor é quem efetivamente lidera. Se o departamento já
// tem um Gerente, o Coordenador/Supervisor de lá continua no mesmo nível de
// acesso do Colaborador (decisão confirmada com o usuário).
export function ehGestorDepartamento(
  user: Pick<User, 'role' | 'departamento_id' | 'departamentosAdicionais'>,
  todosUsuarios: Pick<User, 'ativo' | 'role' | 'departamento_id'>[],
): boolean {
  if (user.role === 'GERENTES') return true;
  if (user.role !== 'COORDENADORES_SUPERVISORES') return false;
  return departamentosDoGestor(user).some(
    (deptId) => !todosUsuarios.some((u) => u.ativo && u.role === 'GERENTES' && u.departamento_id === deptId),
  );
}

// Colunas do catálogo de indicadores (planilha de PPR por função/pilar) — o
// responsável é vinculado por CPF a um usuário JÁ cadastrado (ver Usuários),
// não é mais criado na hora: departamento/cargo do indicador vêm do cadastro
// do próprio responsável.
export const IMPORT_TEMPLATE_HEADERS = [
  'Pilar',
  'Indicador / Meta',
  'Descrição',
  'Meta',
  'Forma de Medição',
  'Evidência Obrigatória',
  'Tabela de Atingimento (Redutor)',
  'Peso',
  'Observação / Sinalização',
  'CPF',
];

// "email" é opcional: quem ainda não tem email corporativo entra cadastrado
// mas sem acesso, até alguém completar o cadastro depois. O CPF é
// obrigatório — é ele que identifica o usuário nas duas situações: pra achar
// e completar um cadastro sem email, e pra fazer upsert (uma linha com um
// CPF já cadastrado ATUALIZA o usuário existente em vez de duplicar ou dar
// erro — ver ImportUsuariosModal.tsx).
export const IMPORT_USUARIOS_TEMPLATE_HEADERS = [
  'nome',
  'cpf',
  'email',
  'departamento',
  'cargo',
  'role',
  'filial',
  'data_nascimento',
  'data_admissao',
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
