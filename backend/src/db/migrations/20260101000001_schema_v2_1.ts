import type { Knex } from 'knex';

// Schema v2.1 direto (roles MASTER/GESTOR/COLABORADOR, status/aprovação em 2
// etapas, tabela de múltiplos de PPR por grupo de cargo) — ver "Desvios
// deliberados da spec literal" no plano: não existe uma v2.0 em produção
// para migrar de verdade, então esta migration já cria o estado final.

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('departamentos', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('nome', 255).notNullable().unique();
    t.text('descricao');
    t.uuid('gerente_id'); // FK adicionada depois que "users" existir
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('trilhas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('nome', 255).notNullable().unique();
    t.text('descricao');
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('trilha_pilares', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('trilha_id').notNullable().references('id').inTable('trilhas').onDelete('CASCADE');
    t.string('pilar', 255).notNullable();
    t.decimal('peso', 5, 2).notNullable();
    t.integer('ordem');
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.unique(['trilha_id', 'pilar']);
    t.check('peso > 0 AND peso <= 100', [], 'chk_trilha_pilares_peso');
  });
  await knex.schema.alterTable('trilha_pilares', (t) => t.index('trilha_id'));

  await knex.schema.createTable('cargos', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('nome', 255).notNullable().unique();
    t.text('descricao');
    t.string('nivel', 50); // OPERACIONAL, SUPERVISAO, GESTAO, DIRETORIA
    t.uuid('trilha_id').references('id').inTable('trilhas').onDelete('SET NULL');
    // Desvio da spec: a Tabela de Múltiplos de PPR (ppr_faixas) é por GRUPO
    // de cargo (GERENTES / COORDENADORES E SUPERVISORES / DEMAIS CARGOS), não
    // por cargo individual — este campo resolve a qual grupo um cargo real
    // pertence. Espelha cargoParaGrupoPPR() do frontend.
    t.string('grupo_ppr', 50);
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });
  await knex.schema.alterTable('cargos', (t) => t.index('trilha_id'));

  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('email', 255).notNullable().unique();
    t.string('nome', 255).notNullable();
    t.string('cpf', 14).unique();
    t.string('matricula', 50).unique();
    t.uuid('departamento_id').notNullable().references('id').inTable('departamentos');
    t.uuid('cargo_id').references('id').inTable('cargos').onDelete('SET NULL');
    t.string('role', 50).notNullable().defaultTo('COLABORADOR');
    // Reservado para quando o login por Microsoft Entra ID (MSAL) for
    // implementado em produção — não usado pelo login dev-mode desta etapa.
    t.string('microsoft_graph_id', 255).unique();
    t.text('avatar_url');
    t.boolean('ativo').notNullable().defaultTo(true);
    t.timestamp('ativo_em').defaultTo(knex.fn.now());
    t.timestamp('desativado_em');
    t.timestamp('ultimo_login');
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
    t.check(`role IN ('MASTER', 'GESTOR', 'COLABORADOR')`, [], 'chk_users_role');
  });
  await knex.schema.alterTable('users', (t) => {
    t.index('departamento_id');
    t.index('cargo_id');
    t.index('role');
    t.index('ativo');
  });

  await knex.schema.alterTable('departamentos', (t) => {
    t.foreign('gerente_id', 'fk_departamentos_gerente_id').references('id').inTable('users').onDelete('SET NULL');
  });

  await knex.schema.createTable('indicadores', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('departamento_id').notNullable().references('id').inTable('departamentos');
    t.uuid('usuario_responsavel_id').notNullable().references('id').inTable('users');
    t.string('nome', 255).notNullable();
    t.decimal('peso', 5, 2).notNullable();
    t.string('status', 50).notNullable().defaultTo('EM_ANDAMENTO');
    t.decimal('atendimento', 5, 2).notNullable().defaultTo(0);
    t.text('detalhamento');
    t.text('objetivo');
    t.date('data_inicio').notNullable();
    t.date('data_fim').notNullable();
    t.timestamp('concluido_em');
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());

    // Catálogo de PPR/Trilha (opcional — preenchido para indicadores que vêm
    // de um catálogo por função/pilar; ver ind-007..010 do mockData.json).
    t.string('funcao', 255);
    t.string('pilar', 255);
    t.text('meta');
    t.text('forma_medicao');
    t.text('evidencia_obrigatoria');
    // Desvio da spec: tabela de atingimento (redutor) por indicador, já
    // modelada no frontend como FaixaAtingimento[] — a spec original não
    // tinha essa coluna.
    t.jsonb('tabela_atingimento');

    t.check('peso >= 0 AND peso <= 100', [], 'chk_indicadores_peso');
    t.check('atendimento >= 0 AND atendimento <= 100', [], 'chk_indicadores_atendimento');
    t.check('data_fim >= data_inicio', [], 'chk_indicador_datas');
    t.check(
      `status IN ('EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'AGUARDANDO_RH', 'CONCLUIDO', 'ATRASADO', 'PAUSADO')`,
      [],
      'chk_indicadores_status',
    );
  });
  await knex.schema.alterTable('indicadores', (t) => {
    t.index('usuario_responsavel_id');
    t.index('departamento_id');
    t.index('status');
    t.index('data_fim');
    t.index(['status', 'departamento_id']);
    t.index(['usuario_responsavel_id', 'status']);
  });

  await knex.schema.createTable('indicador_updates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('indicador_id').notNullable().references('id').inTable('indicadores').onDelete('CASCADE');
    t.uuid('usuario_alterou_id').notNullable().references('id').inTable('users');
    t.string('tipo_alteracao', 50).notNullable();
    t.string('campo_alterado', 255);
    t.jsonb('valor_anterior');
    t.jsonb('valor_novo');
    t.text('motivo');
    // Comentário do aprovador/rejeitador em cada etapa de aprovação (NOVO na
    // v2.1) — ver PATCH /api/indicators/:id/approve.
    t.string('observacao', 500);
    t.timestamp('criado_em').defaultTo(knex.fn.now());

    t.check(
      `tipo_alteracao IN ('CRIACAO', 'EDICAO', 'CONCLUSAO', 'REATRIBUICAO', 'SOLICITACAO_CONCLUSAO', 'APROVACAO_GESTOR', 'APROVACAO_RH', 'REJEICAO')`,
      [],
      'chk_indicador_updates_tipo',
    );
  });
  await knex.schema.alterTable('indicador_updates', (t) => {
    t.index('indicador_id');
    t.index('usuario_alterou_id');
    t.index('tipo_alteracao');
    t.index('criado_em');
  });

  await knex.schema.createTable('attachments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('indicador_id').notNullable().references('id').inTable('indicadores').onDelete('CASCADE');
    t.uuid('usuario_id').notNullable().references('id').inTable('users');
    t.string('nome_arquivo', 255).notNullable();
    // Desvio da spec: renomeado de url_s3 para url — storage local nesta
    // etapa (STORAGE_TYPE=local), url_s3 seria enganoso.
    t.text('url').notNullable();
    t.string('tipo_mime', 100);
    t.bigInteger('tamanho_bytes');
    t.text('descricao');
    t.timestamp('criado_em').defaultTo(knex.fn.now());
  });
  await knex.schema.alterTable('attachments', (t) => {
    t.index('indicador_id');
    t.index('usuario_id');
  });

  await knex.schema.createTable('ppr_faixas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // Desvio da spec: liga ao GRUPO de cargo (GERENTES / COORDENADORES E
    // SUPERVISORES / DEMAIS CARGOS), não a um cargo_id individual — mesma
    // Tabela de Múltiplos de PPR já validada no frontend (MultiplosPPRTable).
    t.string('grupo_cargo', 50).notNullable();
    t.decimal('faixa_min', 5, 2).notNullable();
    t.decimal('faixa_max', 5, 2).notNullable();
    t.decimal('multiplo', 5, 2).notNullable();
    t.timestamp('criado_em').defaultTo(knex.fn.now());
    t.timestamp('atualizado_em').defaultTo(knex.fn.now());
    t.check('faixa_max >= faixa_min AND multiplo >= 0', [], 'chk_ppr_faixas');
  });
  await knex.schema.alterTable('ppr_faixas', (t) => t.index('grupo_cargo'));
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ppr_faixas');
  await knex.schema.dropTableIfExists('attachments');
  await knex.schema.dropTableIfExists('indicador_updates');
  await knex.schema.dropTableIfExists('indicadores');
  await knex.schema.alterTable('departamentos', (t) => t.dropForeign('gerente_id', 'fk_departamentos_gerente_id'));
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('cargos');
  await knex.schema.dropTableIfExists('trilha_pilares');
  await knex.schema.dropTableIfExists('trilhas');
  await knex.schema.dropTableIfExists('departamentos');
}
