import type { Role } from '../types/index.js';

// GERENTES e COORDENADORES_SUPERVISORES são os dois níveis do antigo papel
// único GESTOR — ambos gerenciam/aprovam no escopo do próprio departamento
// (a distinção entre os dois hoje só importa pra Tabela de Múltiplos de PPR,
// ver ppr/ e frontend/src/utils/ppr.ts).
const ROLES_GESTAO_DEPARTAMENTO: readonly Role[] = ['GERENTES', 'COORDENADORES_SUPERVISORES'];

// MASTER e ADMIN têm acesso amplo (todos os departamentos, gestão de
// usuários/departamentos/cargos) — só a aprovação final de indicador
// (AGUARDANDO_RH -> CONCLUIDO) e a Tabela de Múltiplos de PPR ficam
// exclusivas de MASTER.
const ROLES_ACESSO_AMPLO: readonly Role[] = ['MASTER', 'ADMIN'];

export function isGestorDepartamento(role: Role): boolean {
  return ROLES_GESTAO_DEPARTAMENTO.includes(role);
}

export function temAcessoAmplo(role: Role): boolean {
  return ROLES_ACESSO_AMPLO.includes(role);
}
