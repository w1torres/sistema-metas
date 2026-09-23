import type { Bonificacao, BonificacaoParticipante, Departamento, MinhaBonificacao, PilarPeso, PPRFaixa, Trilha, User } from '../types';

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
