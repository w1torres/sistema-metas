import { db } from '../../db/knex.js';
import type { Role, User } from '../../types/index.js';

const SELECT_COLUMNS = [
  'users.id',
  'users.email',
  'users.nome',
  'users.cpf',
  'users.matricula',
  'users.departamento_id',
  'departamentos.nome as departamento',
  'users.cargo_id',
  'cargos.nome as cargo',
  'users.role',
  'users.avatar_url',
  'users.ativo',
  'users.data_nascimento',
  'users.data_admissao',
  'users.filial',
  'users.endereco_completo',
  'users.telefone',
  'users.celular',
  'users.criado_em',
  'users.atualizado_em',
];

function baseQuery() {
  return db('users')
    .leftJoin('departamentos', 'departamentos.id', 'users.departamento_id')
    .leftJoin('cargos', 'cargos.id', 'users.cargo_id')
    .select(SELECT_COLUMNS);
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export async function findAll(): Promise<User[]> {
  return baseQuery().orderBy('users.nome');
}

export async function findById(id: string): Promise<User | undefined> {
  return baseQuery().where('users.id', id).first();
}

export async function findByEmail(email: string): Promise<User | undefined> {
  return baseQuery().whereRaw('LOWER(users.email) = LOWER(?)', [email]).first();
}

// CPF é usado como identificador humano no import de indicadores (em vez de
// e-mail ou UUID interno) — ver indicators/import.ts.
export async function findByCpf(cpf: string): Promise<User | undefined> {
  const digitos = normalizeCpf(cpf);
  if (!digitos) return undefined;
  return baseQuery().whereRaw(`regexp_replace(users.cpf, '\\D', '', 'g') = ?`, [digitos]).first();
}

interface CreateUserInput {
  email: string;
  nome: string;
  cpf?: string | null;
  matricula?: string | null;
  departamento_id: string;
  cargo_id?: string | null;
  role: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
  endereco_completo?: string | null;
  telefone?: string | null;
  celular?: string | null;
}

export async function create(input: CreateUserInput): Promise<User> {
  const [row] = await db('users')
    .insert({
      email: input.email.trim().toLowerCase(),
      nome: input.nome.trim(),
      cpf: input.cpf ?? null,
      matricula: input.matricula ?? null,
      departamento_id: input.departamento_id,
      cargo_id: input.cargo_id ?? null,
      role: input.role,
      data_nascimento: input.data_nascimento ?? null,
      data_admissao: input.data_admissao ?? null,
      filial: input.filial ?? null,
      endereco_completo: input.endereco_completo ?? null,
      telefone: input.telefone ?? null,
      celular: input.celular ?? null,
    })
    .returning('id');
  const created = await findById(row.id);
  if (!created) throw new Error('Falha ao carregar usuário recém-criado');
  return created;
}

interface UpdateUserInput {
  nome?: string;
  cpf?: string | null;
  matricula?: string | null;
  departamento_id?: string;
  cargo_id?: string | null;
  role?: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
  endereco_completo?: string | null;
  telefone?: string | null;
  celular?: string | null;
}

export async function update(id: string, input: UpdateUserInput): Promise<User | undefined> {
  const campos: Record<string, unknown> = { atualizado_em: db.fn.now() };
  for (const [chave, valor] of Object.entries(input)) {
    if (valor !== undefined) campos[chave] = valor;
  }
  if (campos.nome) campos.nome = String(campos.nome).trim();
  await db('users').where('id', id).update(campos);
  return findById(id);
}

export async function setAtivo(id: string, ativo: boolean): Promise<User | undefined> {
  await db('users')
    .where('id', id)
    .update({
      ativo,
      atualizado_em: db.fn.now(),
      desativado_em: ativo ? null : db.fn.now(),
    });
  return findById(id);
}

export async function registrarUltimoLogin(id: string): Promise<void> {
  await db('users').where('id', id).update({ ultimo_login: db.fn.now() });
}
