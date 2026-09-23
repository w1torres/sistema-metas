import type { Knex } from 'knex';

// Tabela de referência (editável) que converte o % da meta atingida por um
// indicador no % do peso dele que conta no cálculo do colaborador — "Tabela
// 1 — Quanto maior, melhor" (ver frontend/src/components/ppr/TabelaAtingimentoTable.tsx).
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('atingimento_faixas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.decimal('faixa_min', 5, 2).notNullable();
    t.decimal('faixa_max', 5, 2).notNullable();
    t.decimal('percentual_peso', 5, 2).notNullable();
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
    t.check('faixa_max >= faixa_min AND percentual_peso >= 0 AND percentual_peso <= 100', [], 'chk_atingimento_faixas');
  });

  await knex('atingimento_faixas').insert([
    { faixa_min: 100, faixa_max: 999, percentual_peso: 100 },
    { faixa_min: 90, faixa_max: 99.99, percentual_peso: 80 },
    { faixa_min: 80, faixa_max: 89.99, percentual_peso: 60 },
    { faixa_min: 70, faixa_max: 79.99, percentual_peso: 40 },
    { faixa_min: 0, faixa_max: 69.99, percentual_peso: 0 },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('atingimento_faixas');
}
