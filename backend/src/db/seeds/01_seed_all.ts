import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

// Um único seed cuidando de toda a árvore de dependências (departamentos →
// trilhas/pilares → cargos → users → indicadores → indicador_updates →
// ppr_faixas), espelhando frontend/src/data/mockData.json traduzido para o
// modelo v2.1 (roles MASTER/ADMIN/GERENTES/COORDENADORES_SUPERVISORES/
// COLABORADOR — 5 papéis, ver migration 20260101000003 — status em 2 etapas
// de aprovação). Um só arquivo evita ambiguidade de ordem de delete/insert
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

  // --- Usuários --------------------------------------------------------
  // Só admin + 1 conta de teste são seedados — os demais usuários (gerentes,
  // colaboradores etc.) e todos os indicadores são cadastrados pelo próprio
  // admin através da aplicação real (POST /api/users, /api/indicators), não
  // fixados aqui. Email placeholder @empresa.com (não o domínio corporativo
  // real) — por isso entram por senha, não Entra ID. Senha "senha123", só
  // pra dar pra logar localmente sem passar pelo fluxo de definição de senha
  // por email. A conta de teste existe só pra validar localmente como a
  // aplicação se comporta pra um papel sem acesso amplo (COLABORADOR) — sem
  // ela só dava pra testar logado como MASTER.
  await knex('users').insert({
    email: 'admin@empresa.com',
    cpf: '111.222.333-96',
    nome: 'Admin do Sistema',
    departamento_id: departamentoIdPorNome['TECNOLOGIA'],
    cargo_id: cargoIdPorNome['DIRETORIA'],
    role: 'MASTER',
    ativo: true,
    filial: 'FORMOSA-GO',
    data_admissao: '2015-03-01',
    data_nascimento: '1980-04-12',
    password_hash: await bcrypt.hash('senha123', 10),
    auth_provider: 'LOCAL',
  });
  await knex('users').insert({
    email: 'teste@empresa.com',
    cpf: '444.555.666-07',
    nome: 'Usuário de Teste',
    departamento_id: departamentoIdPorNome['VENDAS'],
    cargo_id: cargoIdPorNome['ASSISTENTE'],
    role: 'COLABORADOR',
    ativo: true,
    filial: 'FORMOSA-GO',
    data_admissao: '2022-06-01',
    data_nascimento: '1995-09-20',
    password_hash: await bcrypt.hash('senha123', 10),
    auth_provider: 'LOCAL',
  });

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
