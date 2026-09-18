import { db } from '../../db/knex.js';
import type { Role, User } from '../../types/index.js';

const SELECT_COLUMNS = [
  'users.id',
  'users.email',
  'users.nome',
  'users.cpf',
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

// Elegibilidade de Bonificação (ver bonificacoes/service.ts): ativo, admitido
// até a data-limite informada (ex.: 31/12 do ano anterior ao mês de
// referência da bonificação), excluindo MASTER/ADMIN (contas de
// administração do sistema, não colaboradores de fato).
export async function findElegiveisParaBonificacao(dataLimiteAdmissao: string): Promise<User[]> {
  return baseQuery()
    .where('users.ativo', true)
    .whereNotIn('users.role', ['MASTER', 'ADMIN'])
    .whereNotNull('users.data_admissao')
    .andWhere('users.data_admissao', '<=', dataLimiteAdmissao)
    .orderBy('users.nome');
}

interface CreateUserInput {
  email?: string | null;
  nome: string;
  cpf?: string | null;
  departamento_id: string;
  cargo_id?: string | null;
  role: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
}

export async function create(input: CreateUserInput): Promise<User> {
  const [row] = await db('users')
    .insert({
      email: input.email ? input.email.trim().toLowerCase() : null,
      nome: input.nome.trim(),
      cpf: input.cpf ?? null,
      departamento_id: input.departamento_id,
      cargo_id: input.cargo_id ?? null,
      role: input.role,
      data_nascimento: input.data_nascimento ?? null,
      data_admissao: input.data_admissao ?? null,
      filial: input.filial ?? null,
    })
    .returning('id');
  const created = await findById(row.id);
  if (!created) throw new Error('Falha ao carregar usuário recém-criado');
  return created;
}

interface UpdateUserInput {
  nome?: string;
  email?: string | null;
  cpf?: string | null;
  departamento_id?: string;
  cargo_id?: string | null;
  role?: Role;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  filial?: string | null;
}

export async function update(id: string, input: UpdateUserInput): Promise<User | undefined> {
  const campos: Record<string, unknown> = { atualizado_em: db.fn.now() };
  for (const [chave, valor] of Object.entries(input)) {
    if (valor !== undefined) campos[chave] = valor;
  }
  if (campos.nome) campos.nome = String(campos.nome).trim();
  if (typeof campos.email === 'string') {
    campos.email = campos.email.trim().toLowerCase() || null;
  }
  await db('users').where('id', id).update(campos);
  return findById(id);
}

// Exclusão definitiva — o FK de indicadores.usuario_responsavel_id não tem
// onDelete definido (NO ACTION), então o Postgres já recusa sozinho excluir
// um usuário que ainda é responsável por algum indicador (ver
// service.removeUser, que traduz esse erro numa mensagem amigável).
export async function remove(id: string): Promise<void> {
  await db('users').where('id', id).del();
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

// --- Autenticação (senha + Entra ID) --------------------------------------
// SELECT_COLUMNS nunca inclui password_hash/tokens — só esta consulta
// separada, usada exclusivamente por auth/service.ts, expõe o hash.

export async function findByEmailComSenha(
  email: string,
): Promise<(User & { password_hash: string | null }) | undefined> {
  return baseQuery()
    .select('users.password_hash')
    .whereRaw('LOWER(users.email) = LOWER(?)', [email])
    .first();
}

export async function setSenha(id: string, passwordHash: string): Promise<void> {
  await db('users').where('id', id).update({
    password_hash: passwordHash,
    auth_provider: 'LOCAL',
    password_reset_token: null,
    password_reset_expires_at: null,
    atualizado_em: db.fn.now(),
  });
}

export async function setTokenDefinicaoSenha(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await db('users').where('id', id).update({
    password_reset_token: tokenHash,
    password_reset_expires_at: expiresAt,
    atualizado_em: db.fn.now(),
  });
}

export async function findByTokenDefinicaoSenha(
  tokenHash: string,
): Promise<(User & { password_reset_expires_at: string | null }) | undefined> {
  return baseQuery()
    .select('users.password_reset_expires_at')
    .where('users.password_reset_token', tokenHash)
    .first();
}

export async function marcarProviderEntra(id: string): Promise<void> {
  await db('users').where('id', id).update({ auth_provider: 'ENTRA', atualizado_em: db.fn.now() });
}
