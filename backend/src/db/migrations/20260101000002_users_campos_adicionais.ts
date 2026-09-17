import type { Knex } from 'knex';

// v2.1 (complemento) — campos de cadastro de colaborador que faltavam:
// data de nascimento/admissão, filial, endereço e telefones. Ver
// ESPECIFICACOES_FALTANTES_v2.1.md em files/. Não trazemos a tabela
// `safras` nem `tabelas_atingimento` de referência propostas no mesmo lote —
// conflitam com o que já está implementado e validado (ver decisão do
// usuário: manter tabela_atingimento embutida em JSONB, sem conceito de
// safra como entidade).

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (t) => {
    t.date('data_nascimento');
    t.date('data_admissao');
    t.string('filial', 255);
    t.text('endereco_completo');
    t.string('telefone', 20);
    t.string('celular', 20);
  });
  await knex.schema.alterTable('users', (t) => {
    t.index('filial');
  });
  await knex.raw(
    `ALTER TABLE users ADD CONSTRAINT chk_users_data_admissao_nao_futura CHECK (data_admissao IS NULL OR data_admissao <= CURRENT_DATE)`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_data_admissao_nao_futura');
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('data_nascimento');
    t.dropColumn('data_admissao');
    t.dropColumn('filial');
    t.dropColumn('endereco_completo');
    t.dropColumn('telefone');
    t.dropColumn('celular');
  });
}
