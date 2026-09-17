import type { Knex } from 'knex';

// Reconcilia o backend com decisões tomadas no frontend depois do milestone
// de fundação, e prepara autenticação real (senha + Entra ID) — ver
// "Drift identificado" no plano desta etapa.

export async function up(knex: Knex): Promise<void> {
  // 1. Role: modelo de 3 papéis (MASTER/GESTOR/COLABORADOR) virou 5
  // (MASTER/ADMIN/GERENTES/COORDENADORES_SUPERVISORES/COLABORADOR) no
  // frontend. Nenhuma das duas constraints (antiga ou nova) aceita as DUAS
  // formas ao mesmo tempo (a antiga não conhece GERENTES, a nova não conhece
  // GESTOR) — por isso a ordem certa é: solta a constraint, migra o dado
  // livre de restrição, só depois recria a constraint (que aí já valida
  // contra os dados já convertidos).
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role');
  // GESTOR não existe mais como valor — quem já era GESTOR vira GERENTES
  // (mapeamento mais próximo: gestor de departamento = gerente).
  await knex('users').where({ role: 'GESTOR' }).update({ role: 'GERENTES' });
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('MASTER','ADMIN','GERENTES','COORDENADORES_SUPERVISORES','COLABORADOR'))`,
  );

  // 2. Email deixa de ser obrigatório — um usuário pode ser cadastrado só
  // com CPF (ver ImportUsuariosModal.tsx) e receber o email depois. Troca a
  // UNIQUE simples (que rejeitaria um 2º NULL) por um índice único parcial
  // que ignora linhas com email nulo. Acha o nome da constraint dinamicamente
  // em vez de supor "users_email_key", pra não depender da convenção de
  // nomes do Postgres/Knex.
  await knex.raw('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
  await knex.raw(`
    DO $$
    DECLARE
      nome_constraint text;
    BEGIN
      SELECT conname INTO nome_constraint
      FROM pg_constraint
      WHERE conrelid = 'users'::regclass
        AND contype = 'u'
        AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'users'::regclass AND attname = 'email')];
      IF nome_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT %I', nome_constraint);
      END IF;
    END $$;
  `);
  await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_nao_nulo ON users (email) WHERE email IS NOT NULL');

  // 3. Campos tirados do cadastro no frontend nesta mesma sessão — dropar a
  // coluna já remove sozinho qualquer constraint dependente (ex.: o UNIQUE
  // de matricula).
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('matricula');
    t.dropColumn('endereco_completo');
    t.dropColumn('telefone');
    t.dropColumn('celular');
  });

  // 4. Autenticação real: LOCAL (senha, bcrypt) para email não-corporativo,
  // ENTRA (Microsoft Entra ID) para email @<domínio corporativo>. Token de
  // reset também serve para a primeira definição de senha (mesmo fluxo).
  await knex.schema.alterTable('users', (t) => {
    t.string('password_hash', 255);
    t.string('auth_provider', 20).notNullable().defaultTo('LOCAL');
    t.string('password_reset_token', 255);
    t.timestamp('password_reset_expires_at');
  });
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT chk_users_auth_provider CHECK (auth_provider IN ('ENTRA','LOCAL'))`,
  );
  await knex.schema.alterTable('users', (t) => {
    t.index('password_reset_token');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('password_hash');
    t.dropColumn('auth_provider');
    t.dropColumn('password_reset_token');
    t.dropColumn('password_reset_expires_at');
  });
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_auth_provider');

  await knex.schema.alterTable('users', (t) => {
    t.string('matricula', 50).unique();
    t.text('endereco_completo');
    t.string('telefone', 20);
    t.string('celular', 20);
  });

  await knex.raw('DROP INDEX IF EXISTS users_email_unique_nao_nulo');
  // Reverter pra NOT NULL exige que ninguém tenha email nulo no momento —
  // se houver, o rollback falha aqui de propósito (dado real seria perdido
  // silenciosamente do contrário).
  await knex.raw('ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)');
  await knex.raw('ALTER TABLE users ALTER COLUMN email SET NOT NULL');

  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role');
  await knex.raw(`ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('MASTER', 'GESTOR', 'COLABORADOR'))`);
  // Não reverte GERENTES -> GESTOR: perderíamos a distinção com
  // COORDENADORES_SUPERVISORES (que também viraria inválido pra esse
  // enum). Rollback desta migration não deve rodar em produção depois que
  // dados reais existirem com os 5 papéis.
}
