import type { Departamento, User } from '../types';

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
