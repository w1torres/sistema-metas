import type { Knex } from 'knex';

// Flag de pagamento — marca quando a bonificação já foi efetivamente paga
// (não afeta o cálculo de valor_por_colaborador/valor_recebido, só o status
// exibido no card).

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bonificacoes', (t) => {
    t.boolean('paga').notNullable().defaultTo(false);
    t.timestamp('pago_em');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('bonificacoes', (t) => {
    t.dropColumn('paga');
    t.dropColumn('pago_em');
  });
}
