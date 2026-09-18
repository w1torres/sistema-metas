import type { Knex } from 'knex';

// Bonificação por fornecedor, dividida igualmente entre os colaboradores
// participantes e reduzida pelo percentual da nota de avaliação de
// desempenho de cada um. `valor_por_colaborador`/`valor_recebido` não são
// colunas — são sempre calculados em cima de `valor_total` e da contagem de
// participantes (ver repository.ts), pra nunca dessincronizar quando um
// participante é adicionado/removido depois de cadastrado.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('bonificacoes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('fornecedor', 255).notNullable();
    t.decimal('valor_total', 14, 2).notNullable();
    // Formato 'YYYY-MM' — mês/ano a que a bonificação se refere.
    t.string('mes_referencia', 7).notNullable();
    t.uuid('criado_por').notNullable().references('id').inTable('users');
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
    t.check('valor_total > 0', [], 'chk_bonificacoes_valor_total');
  });
  await knex.schema.alterTable('bonificacoes', (t) => {
    t.index('mes_referencia');
  });

  await knex.schema.createTable('bonificacao_colaboradores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('bonificacao_id').notNullable().references('id').inTable('bonificacoes').onDelete('CASCADE');
    t.uuid('usuario_id').notNullable().references('id').inTable('users');
    // Percentual da nota de avaliação de desempenho (0-100) — define quanto
    // do valor por colaborador ele efetivamente recebe.
    t.decimal('percentual_nota', 5, 2).notNullable();
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
    t.unique(['bonificacao_id', 'usuario_id']);
    t.check('percentual_nota >= 0 AND percentual_nota <= 100', [], 'chk_bonificacao_colaboradores_percentual');
  });
  await knex.schema.alterTable('bonificacao_colaboradores', (t) => {
    t.index('bonificacao_id');
    t.index('usuario_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bonificacao_colaboradores');
  await knex.schema.dropTableIfExists('bonificacoes');
}
