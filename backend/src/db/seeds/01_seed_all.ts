import type { Knex } from 'knex';

// Um único seed cuidando de toda a árvore de dependências (departamentos →
// trilhas/pilares → cargos → users → indicadores → indicador_updates →
// ppr_faixas), espelhando frontend/src/data/mockData.json traduzido para o
// modelo v2.1 (roles MASTER/GESTOR/COLABORADOR, status em 2 etapas de
// aprovação). Um só arquivo evita ambiguidade de ordem de delete/insert
// entre seeds separados quando há FKs cruzadas.

export async function seed(knex: Knex): Promise<void> {
  // Ordem reversa às dependências (filhos antes dos pais).
  await knex('indicador_updates').del();
  await knex('attachments').del();
  await knex('indicadores').del();
  await knex('ppr_faixas').del();
  await knex('users').del();
  await knex('cargos').del();
  await knex('trilha_pilares').del();
  await knex('trilhas').del();
  await knex('departamentos').del();

  // --- Departamentos --------------------------------------------------
  const departamentosSeed = [
    { nome: 'RECURSOS HUMANOS', descricao: 'Gestão de pessoas e desenvolvimento' },
    { nome: 'ADMINISTRATIVO', descricao: 'Operações administrativas' },
    { nome: 'TECNOLOGIA', descricao: 'TI e infraestrutura' },
    { nome: 'VENDAS', descricao: 'Comercial e pós-venda' },
    { nome: 'FINANCEIRO', descricao: 'Controladoria e contabilidade' },
  ];
  const departamentoIdPorNome: Record<string, string> = {};
  for (const d of departamentosSeed) {
    const [row] = await knex('departamentos').insert(d).returning('id');
    departamentoIdPorNome[d.nome] = row.id;
  }

  // --- Trilhas + pilares (dados reais já validados no frontend) -------
  const trilhasSeed = [
    {
      nome: 'Trilha 1',
      descricao: 'Operacional',
      pilares: [
        { pilar: 'Produtividade / resultados (Números)', peso: 40, ordem: 1 },
        { pilar: 'Qualidade da produção - índices de retrabalhos', peso: 30, ordem: 2 },
        { pilar: 'Eficiência e Redução de Custos', peso: 20, ordem: 3 },
        { pilar: 'Desenvolvimento e Melhoria Contínua', peso: 10, ordem: 4 },
      ],
    },
    {
      nome: 'Trilha 2',
      descricao: 'Liderança',
      pilares: [
        { pilar: 'Resultado da Área', peso: 40, ordem: 1 },
        { pilar: 'Eficiência Operacional e Financeira', peso: 25, ordem: 2 },
        { pilar: 'Gestão de Pessoas e Desenvolvimento da Equipe', peso: 25, ordem: 3 },
        { pilar: 'Projetos Estratégicos e Melhoria Contínua', peso: 10, ordem: 4 },
      ],
    },
  ];
  const trilhaIdPorNome: Record<string, string> = {};
  for (const t of trilhasSeed) {
    const [row] = await knex('trilhas').insert({ nome: t.nome, descricao: t.descricao }).returning('id');
    trilhaIdPorNome[t.nome] = row.id;
    for (const p of t.pilares) {
      await knex('trilha_pilares').insert({ trilha_id: row.id, pilar: p.pilar, peso: p.peso, ordem: p.ordem });
    }
  }

  // --- Cargos -----------------------------------------------------------
  // Vínculo cargo -> trilha inferido pelo perfil (operacional vs liderança) —
  // não havia essa ligação explícita no protótipo frontend ainda.
  const cargosSeed = [
    { nome: 'ASSISTENTE', nivel: 'OPERACIONAL', trilha: 'Trilha 1', grupo_ppr: 'DEMAIS CARGOS' },
    { nome: 'ANALISTA', nivel: 'OPERACIONAL', trilha: 'Trilha 1', grupo_ppr: 'DEMAIS CARGOS' },
    { nome: 'ESPECIALISTA', nivel: 'OPERACIONAL', trilha: 'Trilha 1', grupo_ppr: 'DEMAIS CARGOS' },
    { nome: 'COORDENADOR', nivel: 'SUPERVISAO', trilha: 'Trilha 2', grupo_ppr: 'COORDENADORES E SUPERVISORES' },
    { nome: 'GERENTE', nivel: 'GESTAO', trilha: 'Trilha 2', grupo_ppr: 'GERENTES' },
    { nome: 'DIRETORIA', nivel: 'DIRETORIA', trilha: 'Trilha 2', grupo_ppr: 'GERENTES' },
  ];
  const cargoIdPorNome: Record<string, string> = {};
  for (const c of cargosSeed) {
    const [row] = await knex('cargos')
      .insert({ nome: c.nome, nivel: c.nivel, trilha_id: trilhaIdPorNome[c.trilha], grupo_ppr: c.grupo_ppr })
      .returning('id');
    cargoIdPorNome[c.nome] = row.id;
  }

  // --- Usuários -----------------------------------------------------------
  // Role: ADMIN/GERENTE_RH (v2.0) -> MASTER; GERENTE_DEPARTAMENTO -> GESTOR;
  // COLABORADOR sem mudança.
  const usersSeed = [
    { chave: 'user-000', email: 'admin@empresa.com', cpf: '111.222.333-96', matricula: 'ADM-001', nome: 'Admin do Sistema', departamento: 'TECNOLOGIA', cargo: 'DIRETORIA', role: 'MASTER', filial: 'FORMOSA-GO', data_admissao: '2015-03-01', data_nascimento: '1980-04-12', telefone: '(61) 3216-1000', celular: '(61) 98765-1000' },
    { chave: 'user-001', email: 'maria@empresa.com', cpf: '123.456.789-09', matricula: 'RH-001', nome: 'Maria Silva', departamento: 'RECURSOS HUMANOS', cargo: 'GERENTE', role: 'MASTER', filial: 'FORMOSA-GO', data_admissao: '2017-06-10', data_nascimento: '1985-09-23', telefone: '(61) 3216-1001', celular: '(61) 98765-1001' },
    { chave: 'user-002', email: 'marcia@empresa.com', cpf: '987.654.321-00', matricula: 'ADMIN-001', nome: 'Marcia Santos', departamento: 'ADMINISTRATIVO', cargo: 'ANALISTA', role: 'COLABORADOR', filial: 'FORMOSA-GO', data_admissao: '2019-02-18', data_nascimento: '1990-01-15', telefone: null, celular: '(62) 98765-1002' },
    { chave: 'user-003', email: 'joao@empresa.com', cpf: '456.789.123-64', matricula: 'ADMIN-002', nome: 'João Santos', departamento: 'ADMINISTRATIVO', cargo: 'ASSISTENTE', role: 'COLABORADOR', filial: 'FORMOSA-GO', data_admissao: '2020-08-03', data_nascimento: '1993-11-30', telefone: null, celular: '(62) 98765-1003' },
    { chave: 'user-006', email: 'roberto@empresa.com', cpf: '654.321.987-46', matricula: 'ADMIN-GTE-001', nome: 'Roberto Alves', departamento: 'ADMINISTRATIVO', cargo: 'COORDENADOR', role: 'GESTOR', filial: 'FORMOSA-GO', data_admissao: '2016-04-25', data_nascimento: '1982-07-08', telefone: '(62) 3216-1006', celular: '(62) 98765-1006' },
    { chave: 'user-007', email: 'fernando@empresa.com', cpf: '852.963.741-00', matricula: 'TI-GTE-001', nome: 'Fernando Lima', departamento: 'TECNOLOGIA', cargo: 'COORDENADOR', role: 'GESTOR', filial: 'BRASILIA-DF', data_admissao: '2018-01-12', data_nascimento: '1987-03-19', telefone: '(61) 3216-1007', celular: '(61) 98765-1007' },
    { chave: 'user-004', email: 'ana@empresa.com', cpf: '789.123.456-64', matricula: 'TI-001', nome: 'Ana Costa', departamento: 'TECNOLOGIA', cargo: 'ESPECIALISTA', role: 'COLABORADOR', filial: 'BRASILIA-DF', data_admissao: '2021-05-17', data_nascimento: '1995-06-02', telefone: null, celular: '(61) 98765-1004' },
    { chave: 'user-005', email: 'pedro@empresa.com', cpf: '321.654.987-91', matricula: 'VENDAS-001', nome: 'Pedro Oliveira', departamento: 'VENDAS', cargo: 'ANALISTA', role: 'COLABORADOR', filial: 'FORMOSA-GO', data_admissao: '2022-09-05', data_nascimento: '1992-12-27', telefone: null, celular: '(62) 98765-1005' },
  ] as const;
  const userIdPorChave: Record<string, string> = {};
  for (const u of usersSeed) {
    const [row] = await knex('users')
      .insert({
        email: u.email,
        cpf: u.cpf,
        matricula: u.matricula,
        nome: u.nome,
        departamento_id: departamentoIdPorNome[u.departamento],
        cargo_id: cargoIdPorNome[u.cargo],
        role: u.role,
        ativo: true,
        filial: u.filial,
        data_admissao: u.data_admissao,
        data_nascimento: u.data_nascimento,
        telefone: u.telefone,
        celular: u.celular,
      })
      .returning('id');
    userIdPorChave[u.chave] = row.id;
  }

  // Departamentos com gestor definido.
  await knex('departamentos').where('nome', 'ADMINISTRATIVO').update({ gerente_id: userIdPorChave['user-006'] });
  await knex('departamentos').where('nome', 'TECNOLOGIA').update({ gerente_id: userIdPorChave['user-007'] });

  // --- Indicadores --------------------------------------------------------
  interface IndicadorSeed {
    departamento: string;
    responsavel: string;
    nome: string;
    peso: number;
    status: string;
    atendimento: number;
    detalhamento: string;
    objetivo: string;
    data_inicio: string;
    data_fim: string;
    concluido_em: string | null;
    chave?: string;
    funcao?: string;
    pilar?: string;
    meta?: string;
    forma_medicao?: string;
    evidencia_obrigatoria?: string;
    tabela_atingimento?: Array<{ faixa: string; percentualPeso: number }>;
  }

  const indicadoresSeed: IndicadorSeed[] = [
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-002', nome: 'POLÍTICA DE COMPRAS COM O FORNECEDOR', peso: 20,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Desenvolver uma política de compras estratégica com critérios de qualidade, preço e prazos.',
      objetivo: 'Estabelecer diretrizes claras para seleção e relacionamento com fornecedores.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
    },
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-002', nome: 'REALIZAR 20 HORAS DE INTEGRAÇÃO COMPRADA', peso: 20,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Concluídas 2 horas de treinamento de 20 horas planejadas.',
      objetivo: 'Capacitar equipe em processos de integração de sistemas.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
    },
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-003', nome: 'REVISÃO DE PROCESSOS ADMINISTRATIVOS', peso: 30,
      status: 'CONCLUIDO', atendimento: 100,
      detalhamento: 'Revisão completa de todos os processos administrativos documentados.',
      objetivo: 'Identificar oportunidades de melhoria e otimização.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: '2026-09-05T16:45:00Z',
      chave: 'ind-003',
    },
    {
      departamento: 'TECNOLOGIA', responsavel: 'user-004', nome: 'IMPLEMENTAÇÃO DE SEGURANÇA DE DADOS', peso: 25,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Implementação de políticas de segurança, backups e disaster recovery.',
      objetivo: 'Garantir conformidade com LGPD e proteção de dados corporativos.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
    },
    {
      departamento: 'TECNOLOGIA', responsavel: 'user-004', nome: 'MIGRAÇÃO PARA CLOUD', peso: 35,
      status: 'ATRASADO', atendimento: 0,
      detalhamento: 'Migração da infraestrutura on-premise para Azure Cloud.',
      objetivo: 'Aumentar disponibilidade, escalabilidade e reduzir custos operacionais.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
      chave: 'ind-005',
    },
    {
      departamento: 'VENDAS', responsavel: 'user-005', nome: 'AUMENTO DE 20% NA CARTEIRA DE CLIENTES', peso: 40,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Prospecção ativa e fechamento de 15 novos clientes enterprise.',
      objetivo: 'Expandir base de clientes e aumentar receita de vendas.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
    },
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-002', nome: 'GARANTIR CANHOTOS ASSINADOS', peso: 40,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Cálculo: (Nº de Canhotos de Entrega devidamente assinados e arquivados no período ÷ Nº Total de Canhotos emitidos para o cliente no mesmo período) × 100. Unidade: %. Meta atingida = resultado ≥ 90%. Fonte de dados/critérios: canhotos de entrega assinados (via física ou digitalizada) do cliente; planilha de controle com o percentual apurado no período.',
      objetivo: 'Garantir que no mínimo 90% dos canhotos, dos clientes estejam devidamente assinados e arquivados no período.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
      funcao: 'Cargos Administrativos Gerais', pilar: 'Produtividade / resultados (Números)', meta: '≥90%',
      forma_medicao: '(Nº de Canhotos de Entrega devidamente assinados e arquivados no período ÷ Nº Total de Canhotos emitidos para o cliente no mesmo período) × 100. Unidade: %. Meta atingida = resultado ≥ 90%.',
      evidencia_obrigatoria: 'Canhotos de entrega assinados (via física ou digitalizada) do cliente; planilha de controle com o percentual apurado no período.',
      tabela_atingimento: [
        { faixa: '≥ 90,00%', percentualPeso: 100 },
        { faixa: '85,00% a 89,99%', percentualPeso: 90 },
        { faixa: '80,00% a 84,99%', percentualPeso: 80 },
        { faixa: '75,00% a 79,99%', percentualPeso: 70 },
        { faixa: '70,00% a 74,99%', percentualPeso: 60 },
      ],
    },
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-002', nome: 'AVALIAÇÃO DE DESEMPENHO', peso: 10,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Metodologia: nota final da Metodologia de Avaliação de Desempenho vigente, calibrada em comitê na etapa da reunião de Gente. O atingimento do peso segue a Tabela de Atingimento (Redutor). Fonte de dados/critérios: formulário de avaliação assinado; ata do comitê de calibração.',
      objetivo: 'Medir a performance técnica e comportamental no ciclo, com nota calibrada entre gestores.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
      funcao: 'Cargos Administrativos Gerais', pilar: 'Desenvolvimento e Melhoria Contínua', meta: '≥85%',
      forma_medicao: 'Nota final da Metodologia de Avaliação de Desempenho vigente, calibrada em comitê na etapa da reunião de Gente. O atingimento do peso segue a Tabela de Atingimento (Redutor).',
      evidencia_obrigatoria: 'Formulário de avaliação assinado; ata do comitê de calibração.',
      tabela_atingimento: [
        { faixa: '≥ 85,00%', percentualPeso: 100 },
        { faixa: '77,00% a 84,99%', percentualPeso: 90 },
        { faixa: '69,00% a 76,99%', percentualPeso: 80 },
        { faixa: '61,00% a 68,99%', percentualPeso: 70 },
        { faixa: '53,00% a 60,99%', percentualPeso: 60 },
      ],
    },
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-002', nome: 'ÍNDICE DE NOTAS FISCAIS COM ERROS/RETRABALHOS', peso: 30,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: "Cálculo: número de NF's com erros que exigiram correção ou cancelamento dividido pelo número total de NF's emitidas vezes 100.",
      objetivo: 'Reduzir erros na emissão de documentos fiscais, minimizando retrabalho e risco fiscal.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
      funcao: 'Cargos Administrativos Gerais', pilar: 'Qualidade da produção - índices de retrabalhos', meta: '≤10%',
      forma_medicao: "Número de NF's com erros que exigiram correção ou cancelamento dividido pelo número total de NF's emitidas vezes 100.",
      evidencia_obrigatoria: "Relatório de NF's canceladas extraídos do SAP.",
      tabela_atingimento: [
        { faixa: '≤ 10,00%', percentualPeso: 100 },
        { faixa: '10,01% a 20,99%', percentualPeso: 90 },
        { faixa: '21,00% a 30,99%', percentualPeso: 80 },
        { faixa: '31,00% a 39,99%', percentualPeso: 70 },
      ],
    },
    {
      departamento: 'ADMINISTRATIVO', responsavel: 'user-003', nome: 'ÍNDICE DE EMISSÃO DE NOTAS FISCAIS NO PRAZO', peso: 20,
      status: 'EM_ANDAMENTO', atendimento: 0,
      detalhamento: 'Cálculo: notas fiscais emitidas dentro do prazo definido pela área dividido pelo total de notas fiscais emitidas no período vezes 100.',
      objetivo: 'Garantir que as notas fiscais sejam emitidas dentro do prazo definido, evitando atraso no faturamento e no recebimento do cliente.',
      data_inicio: '2026-05-01', data_fim: '2027-04-30', concluido_em: null,
      funcao: 'Cargos Administrativos Gerais', pilar: 'Produtividade / resultados (Números)', meta: '≥95%',
      forma_medicao: '(Notas fiscais emitidas dentro do prazo definido pela área ÷ Total de notas fiscais emitidas no período) × 100.',
      evidencia_obrigatoria: "Relatório de NF's emitidas com data de emissão extraído do SAP.",
      tabela_atingimento: [
        { faixa: '≥ 100% da meta', percentualPeso: 100 },
        { faixa: '95% a 99,9% da meta', percentualPeso: 90 },
        { faixa: '85% a 94,9% da meta', percentualPeso: 75 },
        { faixa: '70% a 84,9% da meta', percentualPeso: 50 },
      ],
    },
  ];

  const indicadorIdPorChave: Record<string, string> = {};
  for (const ind of indicadoresSeed) {
    const [row] = await knex('indicadores')
      .insert({
        departamento_id: departamentoIdPorNome[ind.departamento],
        usuario_responsavel_id: userIdPorChave[ind.responsavel],
        nome: ind.nome,
        peso: ind.peso,
        status: ind.status,
        atendimento: ind.atendimento,
        detalhamento: ind.detalhamento,
        objetivo: ind.objetivo,
        data_inicio: ind.data_inicio,
        data_fim: ind.data_fim,
        concluido_em: ind.concluido_em,
        funcao: ind.funcao ?? null,
        pilar: ind.pilar ?? null,
        meta: ind.meta ?? null,
        forma_medicao: ind.forma_medicao ?? null,
        evidencia_obrigatoria: ind.evidencia_obrigatoria ?? null,
        tabela_atingimento: ind.tabela_atingimento ? JSON.stringify(ind.tabela_atingimento) : null,
      })
      .returning('id');
    if (ind.chave) indicadorIdPorChave[ind.chave] = row.id;
  }

  // --- Histórico de auditoria (indicador_updates) --------------------------
  await knex('indicador_updates').insert([
    {
      indicador_id: indicadorIdPorChave['ind-003'],
      usuario_alterou_id: userIdPorChave['user-003'],
      tipo_alteracao: 'CONCLUSAO',
      campo_alterado: 'status',
      valor_anterior: JSON.stringify('EM_ANDAMENTO'),
      valor_novo: JSON.stringify('CONCLUIDO'),
      motivo: 'Revisão finalizada com sucesso',
      criado_em: '2026-09-05T16:45:00Z',
    },
    {
      indicador_id: indicadorIdPorChave['ind-003'],
      usuario_alterou_id: userIdPorChave['user-003'],
      tipo_alteracao: 'CRIACAO',
      valor_novo: JSON.stringify(indicadorIdPorChave['ind-003']),
      motivo: 'Indicador criado',
      criado_em: '2026-01-20T10:15:00Z',
    },
    {
      indicador_id: indicadorIdPorChave['ind-005'],
      usuario_alterou_id: userIdPorChave['user-001'],
      tipo_alteracao: 'EDICAO',
      campo_alterado: 'status',
      valor_anterior: JSON.stringify('EM_ANDAMENTO'),
      valor_novo: JSON.stringify('ATRASADO'),
      motivo: 'Passou data de conclusão planejada',
      criado_em: '2026-10-01T10:00:00Z',
    },
  ]);

  // --- Tabela de Múltiplos de PPR (8 faixas x 3 grupos, já validada) -------
  const bandas = [
    { faixa_min: 95, faixa_max: 999, multiplos: { GERENTES: 3, 'COORDENADORES E SUPERVISORES': 2.5, 'DEMAIS CARGOS': 2 } },
    { faixa_min: 92.5, faixa_max: 94.99, multiplos: { GERENTES: 2.75, 'COORDENADORES E SUPERVISORES': 2.25, 'DEMAIS CARGOS': 1.75 } },
    { faixa_min: 90, faixa_max: 92.49, multiplos: { GERENTES: 2.5, 'COORDENADORES E SUPERVISORES': 2, 'DEMAIS CARGOS': 1.5 } },
    { faixa_min: 85, faixa_max: 89.99, multiplos: { GERENTES: 2.25, 'COORDENADORES E SUPERVISORES': 1.75, 'DEMAIS CARGOS': 1.25 } },
    { faixa_min: 80, faixa_max: 84.99, multiplos: { GERENTES: 2, 'COORDENADORES E SUPERVISORES': 1.5, 'DEMAIS CARGOS': 1 } },
    { faixa_min: 75, faixa_max: 79.99, multiplos: { GERENTES: 1.75, 'COORDENADORES E SUPERVISORES': 1.25, 'DEMAIS CARGOS': 0.75 } },
    { faixa_min: 70, faixa_max: 74.99, multiplos: { GERENTES: 1.5, 'COORDENADORES E SUPERVISORES': 1, 'DEMAIS CARGOS': 0.5 } },
    { faixa_min: 0, faixa_max: 69.99, multiplos: { GERENTES: 0, 'COORDENADORES E SUPERVISORES': 0, 'DEMAIS CARGOS': 0 } },
  ];
  for (const banda of bandas) {
    for (const [grupo, multiplo] of Object.entries(banda.multiplos)) {
      await knex('ppr_faixas').insert({
        grupo_cargo: grupo,
        faixa_min: banda.faixa_min,
        faixa_max: banda.faixa_max,
        multiplo,
      });
    }
  }
}
