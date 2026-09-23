import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/knex.js';
import * as usersRepository from '../src/modules/users/repository.js';

interface Fixtures {
  deptAdmId: string;
  deptTiId: string;
  deptMarketingId: string;
  masterEmail: string;
  gestorAdmEmail: string;
  gestorTiEmail: string;
  gestorMarketingEmail: string;
  colabAdmEmail: string;
  colabAdmId: string;
  colabTiId: string;
  indicadorId: string;
  corporativoEmail: string;
  comSenhaEmail: string;
  comSenhaId: string;
}

let fx: Fixtures;

async function login(email: string): Promise<{ token: string; role: string }> {
  const res = await request(app).post('/api/auth/login').send({ email });
  return { token: res.body.data.token, role: res.body.data.user.role };
}

beforeAll(async () => {
  await db.migrate.latest();

  // Limpa em ordem segura de FK antes de inserir os fixtures deste teste.
  await db('bonificacao_colaboradores').del();
  await db('bonificacoes').del();
  await db('indicador_updates').del();
  await db('attachments').del();
  await db('indicadores').del();
  await db('ppr_faixas').del();
  await db('users').del();
  await db('cargos').del();
  await db('trilha_pilares').del();
  await db('trilhas').del();
  await db('departamentos').del();

  const [deptAdm] = await db('departamentos').insert({ nome: 'ADMINISTRATIVO', descricao: 'Teste' }).returning('id');
  const [deptTi] = await db('departamentos').insert({ nome: 'TECNOLOGIA', descricao: 'Teste' }).returning('id');
  const [deptMarketing] = await db('departamentos').insert({ nome: 'MARKETING', descricao: 'Teste' }).returning('id');

  const [master] = await db('users')
    .insert({ email: 'master@teste.com', nome: 'Master Teste', departamento_id: deptAdm.id, role: 'MASTER' })
    .returning('id');
  const [gestorAdm] = await db('users')
    .insert({ email: 'gestor.adm@teste.com', nome: 'Gestor Adm', departamento_id: deptAdm.id, role: 'GERENTES' })
    .returning('id');
  const [gestorTi] = await db('users')
    .insert({ email: 'gestor.ti@teste.com', nome: 'Gestor TI', departamento_id: deptTi.id, role: 'GERENTES' })
    .returning('id');
  const [gestorMarketing] = await db('users')
    .insert({ email: 'gestor.marketing@teste.com', nome: 'Gestor Marketing', departamento_id: deptMarketing.id, role: 'GERENTES' })
    .returning('id');
  const [colabAdm] = await db('users')
    .insert({
      email: 'colab.adm@teste.com',
      nome: 'Colaborador Adm',
      departamento_id: deptAdm.id,
      role: 'COLABORADOR',
      cpf: '111.222.333-96',
      // Admitido em 2020: elegível pra bonificação de qualquer mês de 2026
      // (regra: admitido até 31/12 do ano anterior) — ver describe('Bonificação').
      data_admissao: '2020-01-01',
    })
    .returning('id');
  const [colabTi] = await db('users')
    .insert({
      email: 'colab.ti@teste.com',
      nome: 'Colaborador TI',
      departamento_id: deptTi.id,
      role: 'COLABORADOR',
      data_admissao: '2020-01-01',
    })
    .returning('id');

  const [indicador] = await db('indicadores')
    .insert({
      departamento_id: deptAdm.id,
      usuario_responsavel_id: colabAdm.id,
      nome: 'INDICADOR DE TESTE',
      peso: 50,
      status: 'EM_ANDAMENTO',
      objetivo: 'Objetivo de teste',
      data_inicio: '2026-01-01',
      data_fim: '2026-12-31',
    })
    .returning('id');

  // Email corporativo (domínio de CORPORATE_EMAIL_DOMAINS no setupEnv.ts) —
  // só entra via /auth/entra, nunca por senha.
  const [corporativo] = await db('users')
    .insert({
      email: 'colaborador@corp.teste.com',
      nome: 'Colaborador Corporativo',
      departamento_id: deptAdm.id,
      role: 'COLABORADOR',
    })
    .returning('id');

  // Email não-corporativo já com senha definida — simula quem já passou
  // pelo fluxo de /auth/definir-senha.
  const [comSenha] = await db('users')
    .insert({
      email: 'comsenha@teste.com',
      nome: 'Usuário Com Senha',
      departamento_id: deptAdm.id,
      role: 'COLABORADOR',
    })
    .returning('id');
  await usersRepository.setSenha(comSenha.id, await bcrypt.hash('senhaCorreta123', 10));

  fx = {
    deptAdmId: deptAdm.id,
    deptTiId: deptTi.id,
    deptMarketingId: deptMarketing.id,
    masterEmail: 'master@teste.com',
    gestorAdmEmail: 'gestor.adm@teste.com',
    gestorTiEmail: 'gestor.ti@teste.com',
    gestorMarketingEmail: 'gestor.marketing@teste.com',
    colabAdmEmail: 'colab.adm@teste.com',
    colabAdmId: colabAdm.id,
    colabTiId: colabTi.id,
    indicadorId: indicador.id,
    corporativoEmail: 'colaborador@corp.teste.com',
    comSenhaEmail: 'comsenha@teste.com',
    comSenhaId: comSenha.id,
  };
  void master;
  void gestorTi;
  void gestorMarketing;
});

afterAll(async () => {
  await db.destroy();
});

describe('Autenticação', () => {
  it('faz login com e-mail cadastrado e devolve o role correto', async () => {
    const { token, role } = await login(fx.masterEmail);
    expect(token).toBeTruthy();
    expect(role).toBe('MASTER');
  });

  it('rejeita e-mail não cadastrado', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ninguem@teste.com' });
    expect(res.status).toBe(401);
  });
});

describe('Dashboard por role', () => {
  it('GESTOR só vê o próprio departamento', async () => {
    const { token } = await login(fx.gestorAdmEmail);
    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.resumo_departamento.departamento).toBe('ADMINISTRATIVO');
    expect(res.body.data.resumo_geral).toBeUndefined();
  });

  it('MASTER vê todos os departamentos', async () => {
    const { token } = await login(fx.masterEmail);
    const res = await request(app).get('/api/dashboard/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.resumo_geral).toBeDefined();
    expect(res.body.data.por_departamento.length).toBeGreaterThanOrEqual(1);
  });
});

describe('RBAC entre departamentos', () => {
  it('GESTOR de outro departamento não acessa indicador alheio', async () => {
    const { token } = await login(fx.gestorTiEmail);
    const res = await request(app).get(`/api/indicators/${fx.indicadorId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe('Fluxo de aprovação em 2 etapas', () => {
  it('colaborador solicita -> gestor aprova -> master aprova, com observação em auditoria', async () => {
    const colab = await login(fx.colabAdmEmail);
    const gestor = await login(fx.gestorAdmEmail);
    const master = await login(fx.masterEmail);

    const solicitar = await request(app)
      .patch(`/api/indicators/${fx.indicadorId}/complete`)
      .set('Authorization', `Bearer ${colab.token}`)
      .send({ nota: 'Concluí a tarefa' });
    expect(solicitar.status).toBe(200);
    expect(solicitar.body.data.status).toBe('AGUARDANDO_APROVACAO');
    // Embutido na resposta — o frontend usa isso pra mostrar a nota do
    // colaborador direto no card, sem buscar o histórico completo.
    expect(solicitar.body.data.nota_conclusao_atual).toBe('Concluí a tarefa');

    const aprovaGestor = await request(app)
      .patch(`/api/indicators/${fx.indicadorId}/approve`)
      .set('Authorization', `Bearer ${gestor.token}`)
      .send({ aprovado: true, observacao: 'Confere com a evidência anexada' });
    expect(aprovaGestor.status).toBe(200);
    expect(aprovaGestor.body.data.status).toBe('AGUARDANDO_RH');
    expect(aprovaGestor.body.data.observacao_gestor).toBe('Confere com a evidência anexada');

    const aprovaMaster = await request(app)
      .patch(`/api/indicators/${fx.indicadorId}/approve`)
      .set('Authorization', `Bearer ${master.token}`)
      .send({ aprovado: true, observacao: 'Validado conforme critérios' });
    expect(aprovaMaster.status).toBe(200);
    expect(aprovaMaster.body.data.status).toBe('CONCLUIDO');
    expect(aprovaMaster.body.data.concluido_em).toBeTruthy();

    const historico = await request(app)
      .get(`/api/indicators/${fx.indicadorId}/history`)
      .set('Authorization', `Bearer ${master.token}`);
    const aprovacaoFinal = historico.body.data.find((h: { tipo_alteracao: string }) => h.tipo_alteracao === 'APROVACAO_RH');
    expect(aprovacaoFinal.observacao).toBe('Validado conforme critérios');
  });
});

describe('Edição direta de status', () => {
  it('MASTER pode marcar EM_ANDAMENTO/ATRASADO/PAUSADO na edição livre, mas não CONCLUIDO', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const criar = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({
        usuario_responsavel_id: fx.colabAdmId,
        nome: 'Indicador Status Manual',
        peso: 10,
        data_inicio: '2026-01-01',
        data_fim: '2026-12-31',
      });
    const id = criar.body.data.id;

    const marcarAtrasado = await request(app)
      .put(`/api/indicators/${id}`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ status: 'ATRASADO' });
    expect(marcarAtrasado.status).toBe(200);
    expect(marcarAtrasado.body.data.status).toBe('ATRASADO');

    const tentaConcluir = await request(app)
      .put(`/api/indicators/${id}`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ status: 'CONCLUIDO' });
    expect(tentaConcluir.status).toBe(400);
  });
});

describe('Anexos', () => {
  it('anexa um arquivo, lista, baixa e remove', async () => {
    const { token: masterToken } = await login(fx.masterEmail);

    const upload = await request(app)
      .post(`/api/indicators/${fx.indicadorId}/attachments`)
      .set('Authorization', `Bearer ${masterToken}`)
      .attach('file', Buffer.from('conteúdo de teste'), { filename: 'comprovante.txt', contentType: 'text/plain' });
    expect(upload.status).toBe(201);
    // bigint no Postgres — sem a conversão em repository.ts, viria como string.
    expect(typeof upload.body.data.tamanho_bytes).toBe('number');
    const attachmentId = upload.body.data.id;

    const listar = await request(app)
      .get(`/api/indicators/${fx.indicadorId}/attachments`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(listar.body.data.some((a: { id: string }) => a.id === attachmentId)).toBe(true);

    // Embutido na resposta do próprio indicador (json_agg) — ver repository.ts.
    const indicador = await request(app)
      .get(`/api/indicators/${fx.indicadorId}`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(indicador.body.data.anexos.some((a: { id: string }) => a.id === attachmentId)).toBe(true);

    const baixar = await request(app)
      .get(`/api/indicators/${fx.indicadorId}/attachments/${attachmentId}/download`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(baixar.status).toBe(200);
    expect(baixar.text).toBe('conteúdo de teste');

    const remover = await request(app)
      .delete(`/api/indicators/${fx.indicadorId}/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(remover.status).toBe(204);
  });
});

describe('Criação de indicador', () => {
  it('MASTER cria sem informar departamento_id — usa o departamento do responsável (nunca null)', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const res = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({
        usuario_responsavel_id: fx.colabAdmId,
        nome: 'Indicador Sem Departamento Explícito',
        peso: 25,
        data_inicio: '2026-01-01',
        data_fim: '2026-12-31',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.departamento_id).toBe(fx.deptAdmId);
  });

  it('MASTER cria informando um departamento_id diferente do responsável', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const res = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({
        usuario_responsavel_id: fx.colabAdmId,
        departamento_id: fx.deptTiId,
        nome: 'Indicador Cross-Departamento',
        peso: 25,
        data_inicio: '2026-01-01',
        data_fim: '2026-12-31',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.departamento_id).toBe(fx.deptTiId);
  });

  it('gestor de departamento sempre cria no próprio departamento, mesmo enviando outro', async () => {
    const { token: gestorToken } = await login(fx.gestorAdmEmail);
    const res = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({
        usuario_responsavel_id: fx.colabAdmId,
        departamento_id: fx.deptTiId,
        nome: 'Indicador Gestor Ignora Departamento Enviado',
        peso: 25,
        data_inicio: '2026-01-01',
        data_fim: '2026-12-31',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.departamento_id).toBe(fx.deptAdmId);
  });
});

describe('Import de planilha', () => {
  it('importa linha válida e reporta erro detalhado na linha inválida', async () => {
    const { token } = await login(fx.gestorAdmEmail);
    const csv = [
      'Nome,Peso,Responsável (CPF),Objetivo,Detalhamento,Data Início,Data Fim,Pilar,Função,Meta,Forma de Medição,Evidência Obrigatória',
      'IMPORT OK,15,111.222.333-96,Objetivo,,01/06/2026,31/12/2026,,,,,',
      'IMPORT SEM CPF,10,999.999.999-99,Objetivo,,01/06/2026,31/12/2026,,,,,',
    ].join('\n');

    const res = await request(app)
      .post('/api/indicators/import')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv, 'utf8'), { filename: 'import.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.sucesso).toBe(1);
    expect(res.body.data.erros).toBe(1);
    expect(res.body.data.detalhes[0].erro).toMatch(/não encontrado/);
  });
});

describe('Login por senha', () => {
  it('loga com email não-corporativo e senha correta', async () => {
    const res = await request(app)
      .post('/api/auth/login-senha')
      .send({ email: fx.comSenhaEmail, senha: 'senhaCorreta123' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(fx.comSenhaEmail);
  });

  it('rejeita senha errada', async () => {
    const res = await request(app)
      .post('/api/auth/login-senha')
      .send({ email: fx.comSenhaEmail, senha: 'senhaErrada' });
    expect(res.status).toBe(401);
  });

  it('rejeita login por senha pra email corporativo', async () => {
    const res = await request(app)
      .post('/api/auth/login-senha')
      .send({ email: fx.corporativoEmail, senha: 'qualquer' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Microsoft/);
  });
});

describe('Login Entra ID (modo local)', () => {
  it('loga email corporativo sem validar token de verdade', async () => {
    const res = await request(app).post('/api/auth/entra').send({ email: fx.corporativoEmail });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(fx.corporativoEmail);
  });

  it('rejeita email não-corporativo no login Entra ID', async () => {
    const res = await request(app).post('/api/auth/entra').send({ email: fx.comSenhaEmail });
    expect(res.status).toBe(403);
  });
});

describe('Definição de senha via token', () => {
  it('define a senha com um token válido e loga em seguida', async () => {
    const tokenBruto = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
    await usersRepository.setTokenDefinicaoSenha(fx.comSenhaId, tokenHash, new Date(Date.now() + 60 * 60 * 1000));

    const res = await request(app)
      .post('/api/auth/definir-senha')
      .send({ token: tokenBruto, novaSenha: 'novaSenha456' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();

    const loginComNovaSenha = await request(app)
      .post('/api/auth/login-senha')
      .send({ email: fx.comSenhaEmail, senha: 'novaSenha456' });
    expect(loginComNovaSenha.status).toBe(200);
  });

  it('rejeita token expirado', async () => {
    const tokenBruto = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenBruto).digest('hex');
    await usersRepository.setTokenDefinicaoSenha(fx.comSenhaId, tokenHash, new Date(Date.now() - 1000));

    const res = await request(app)
      .post('/api/auth/definir-senha')
      .send({ token: tokenBruto, novaSenha: 'outraSenha789' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/expirado/);
  });

  it('rejeita token inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/definir-senha')
      .send({ token: 'token-que-nao-existe', novaSenha: 'qualquerSenha123' });
    expect(res.status).toBe(400);
  });
});

describe('Exclusão de usuário', () => {
  it('MASTER exclui um usuário sem indicadores', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const [descartavel] = await db('users')
      .insert({ email: 'descartavel@teste.com', nome: 'Descartável', departamento_id: fx.deptAdmId, role: 'COLABORADOR' })
      .returning('id');

    const res = await request(app)
      .delete(`/api/users/${descartavel.id}`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(res.status).toBe(204);

    const aindaExiste = await db('users').where('id', descartavel.id).first();
    expect(aindaExiste).toBeUndefined();
  });

  it('recusa excluir usuário responsável por indicador (FK) com mensagem amigável', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const res = await request(app)
      .delete(`/api/users/${(await db('users').where('email', fx.colabAdmEmail).first()).id}`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/responsável por indicadores/);
  });

  it('recusa excluir a própria conta', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const master = await db('users').where('email', fx.masterEmail).first();
    const res = await request(app)
      .delete(`/api/users/${master.id}`)
      .set('Authorization', `Bearer ${masterToken}`);
    expect(res.status).toBe(400);
  });
});

describe('Bonificação', () => {
  it('ao criar, popula automaticamente os colaboradores elegíveis (ativos, admitidos até 31/12 do ano anterior, exceto MASTER/ADMIN) com nota padrão 100', async () => {
    const { token: masterToken } = await login(fx.masterEmail);

    const create = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ fornecedor: 'Fornecedor Teste', valor_total: 1000, mes_referencia: '2026-09' });
    expect(create.status).toBe(201);
    const bonificacaoId = create.body.data.id;

    // colabAdm/colabTi foram admitidos em 2020 (elegíveis pra qualquer
    // bonificação de 2026); master/gestores não têm data_admissao setada
    // (inelegíveis por dado incompleto) e MASTER é excluído por role de
    // qualquer forma — ver findElegiveisParaBonificacao.
    const participantes = create.body.data.participantes as Array<{
      usuario_id: string;
      percentual_nota: number;
      valor_por_colaborador: number;
      valor_recebido: number;
    }>;
    expect(participantes).toHaveLength(2);
    const colabAdmParticipante = participantes.find((p) => p.usuario_id === fx.colabAdmId)!;
    const colabTiParticipante = participantes.find((p) => p.usuario_id === fx.colabTiId)!;
    // valor_total 1000 / 2 colaboradores = 500 por colaborador; nota padrão 100 -> recebe tudo.
    expect(colabAdmParticipante.percentual_nota).toBe(100);
    expect(colabAdmParticipante.valor_por_colaborador).toBe(500);
    expect(colabAdmParticipante.valor_recebido).toBe(500);
    expect(colabTiParticipante.valor_recebido).toBe(500);

    // Ajusta a nota de colabTi pra 50 -> recebe metade.
    const atualizarNota = await request(app)
      .patch(`/api/bonificacoes/${bonificacaoId}/participantes/${fx.colabTiId}`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ percentual_nota: 50 });
    expect(atualizarNota.status).toBe(200);
    const colabTiAtualizado = atualizarNota.body.data.find((p: { usuario_id: string }) => p.usuario_id === fx.colabTiId);
    expect(colabTiAtualizado.valor_recebido).toBe(250);

    const { token: colabTiToken } = await login('colab.ti@teste.com');
    const minhas = await request(app)
      .get('/api/bonificacoes/minhas')
      .set('Authorization', `Bearer ${colabTiToken}`);
    expect(minhas.status).toBe(200);
    expect(minhas.body.data).toHaveLength(1);
    expect(minhas.body.data[0].valor_recebido).toBe(250);
  });

  it('não inclui um colaborador admitido depois da data-limite (31/12 do ano anterior)', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const [recente] = await db('users')
      .insert({
        email: 'colab.recente@teste.com',
        nome: 'Colaborador Recente',
        departamento_id: fx.deptAdmId,
        role: 'COLABORADOR',
        // Admitido em janeiro/2026 — pra uma bonificação de 2026, a
        // data-limite é 2025-12-31, então este colaborador NÃO é elegível.
        data_admissao: '2026-01-15',
      })
      .returning('id');

    const create = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ fornecedor: 'Fornecedor Admissao Recente', valor_total: 900, mes_referencia: '2026-09' });

    const usuarioIds = (create.body.data.participantes as Array<{ usuario_id: string }>).map((p) => p.usuario_id);
    expect(usuarioIds).not.toContain(recente.id);
  });

  it('gerente de um departamento comum não pode gerenciar bonificação', async () => {
    const { token: gestorAdmToken } = await login(fx.gestorAdmEmail);
    const res = await request(app)
      .get('/api/bonificacoes')
      .set('Authorization', `Bearer ${gestorAdmToken}`);
    expect(res.status).toBe(403);
  });

  it('gerente do departamento de Marketing pode gerenciar bonificação', async () => {
    const { token: gestorMarketingToken } = await login(fx.gestorMarketingEmail);
    const create = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${gestorMarketingToken}`)
      .send({ fornecedor: 'Fornecedor Marketing', valor_total: 300, mes_referencia: '2026-09' });
    expect(create.status).toBe(201);
  });

  it('colaborador sem acesso amplo não consegue listar todas as bonificações', async () => {
    const { token: colabToken } = await login(fx.colabAdmEmail);
    const res = await request(app)
      .get('/api/bonificacoes')
      .set('Authorization', `Bearer ${colabToken}`);
    expect(res.status).toBe(403);
  });

  it('importa a nota da avaliação por CPF (com zero à esquerda perdido) e reporta erros por linha', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    await db('users').where({ id: fx.colabAdmId }).update({ cpf: '027.933.971-21' });

    const create = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ fornecedor: 'Fornecedor Import Nota', valor_total: 1000, mes_referencia: '2026-09' });
    const bonificacaoId = create.body.data.id;

    const res = await request(app)
      .post('/api/bonificacoes/notas/importar')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({
        notas: [
          { cpf: '2793397121', percentual_nota: 90 }, // Excel perdeu o zero à esquerda
          { cpf: '999.999.999-99', percentual_nota: 80 },
          { cpf: '027.933.971-21', percentual_nota: 150 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.atualizados).toBe(1);
    expect(res.body.data.erros).toHaveLength(2);

    const detalhe = await request(app)
      .get(`/api/bonificacoes/${bonificacaoId}`)
      .set('Authorization', `Bearer ${masterToken}`);
    const participante = detalhe.body.data.participantes.find(
      (p: { usuario_id: string }) => p.usuario_id === fx.colabAdmId,
    );
    expect(participante.percentual_nota).toBe(90);
  });

  it('editar a nota de um colaborador em uma bonificação reflete em todas as outras (nota é única, não por fornecedor)', async () => {
    const { token: masterToken } = await login(fx.masterEmail);

    const criarFornecedorA = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ fornecedor: 'Fornecedor Nota Única A', valor_total: 1000, mes_referencia: '2026-09' });
    const bonificacaoAId = criarFornecedorA.body.data.id;

    const criarFornecedorB = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ fornecedor: 'Fornecedor Nota Única B', valor_total: 2000, mes_referencia: '2026-09' });
    const bonificacaoBId = criarFornecedorB.body.data.id;

    const atualizarNota = await request(app)
      .patch(`/api/bonificacoes/${bonificacaoAId}/participantes/${fx.colabAdmId}`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ percentual_nota: 70 });
    expect(atualizarNota.status).toBe(200);

    const detalheB = await request(app)
      .get(`/api/bonificacoes/${bonificacaoBId}`)
      .set('Authorization', `Bearer ${masterToken}`);
    const participanteB = detalheB.body.data.participantes.find(
      (p: { usuario_id: string }) => p.usuario_id === fx.colabAdmId,
    );
    expect(participanteB.percentual_nota).toBe(70);
  });

  it('marca e desmarca a bonificação como paga', async () => {
    const { token: masterToken } = await login(fx.masterEmail);
    const create = await request(app)
      .post('/api/bonificacoes')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ fornecedor: 'Fornecedor Pagamento', valor_total: 500, mes_referencia: '2026-09' });
    const bonificacaoId = create.body.data.id;
    expect(create.body.data.paga).toBe(false);
    expect(create.body.data.pago_em).toBeNull();

    const marcarPaga = await request(app)
      .patch(`/api/bonificacoes/${bonificacaoId}/pagamento`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ paga: true });
    expect(marcarPaga.status).toBe(200);
    expect(marcarPaga.body.data.paga).toBe(true);
    expect(marcarPaga.body.data.pago_em).not.toBeNull();

    const desmarcarPaga = await request(app)
      .patch(`/api/bonificacoes/${bonificacaoId}/pagamento`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ paga: false });
    expect(desmarcarPaga.status).toBe(200);
    expect(desmarcarPaga.body.data.paga).toBe(false);
    expect(desmarcarPaga.body.data.pago_em).toBeNull();
  });
});

describe('Tabela de Múltiplos de PPR (bandas)', () => {
  it('edita faixa (min/max) e múltiplo de várias linhas de uma vez, e recusa sobreposição', async () => {
    const { token: masterToken } = await login(fx.masterEmail);

    const [g1] = await db('ppr_faixas')
      .insert({ grupo_cargo: 'GERENTES', faixa_min: 90, faixa_max: 100, multiplo: 2 })
      .returning('id');
    const [g2] = await db('ppr_faixas')
      .insert({ grupo_cargo: 'GERENTES', faixa_min: 0, faixa_max: 89.99, multiplo: 1 })
      .returning('id');

    const editar = await request(app)
      .put('/api/ppr/faixas')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({
        faixas: [
          { id: g1.id, faixa_min: 95, faixa_max: 999, multiplo: 3 },
          { id: g2.id, faixa_min: 0, faixa_max: 94.99, multiplo: 1.5 },
        ],
      });
    expect(editar.status).toBe(200);
    const atualizado = editar.body.data.find((f: { id: string }) => f.id === g1.id);
    expect(atualizado.faixa_min).toBe(95);
    expect(atualizado.multiplo).toBe(3);

    const sobrepondo = await request(app)
      .put('/api/ppr/faixas')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({
        faixas: [
          { id: g1.id, faixa_min: 90, faixa_max: 999, multiplo: 3 },
          { id: g2.id, faixa_min: 0, faixa_max: 94.99, multiplo: 1.5 },
        ],
      });
    expect(sobrepondo.status).toBe(400);
    expect(sobrepondo.body.error).toMatch(/sobrep/);
  });

  it('gerente (sem acesso amplo) não pode editar as bandas', async () => {
    const { token: gestorToken } = await login(fx.gestorAdmEmail);
    const res = await request(app)
      .put('/api/ppr/faixas')
      .set('Authorization', `Bearer ${gestorToken}`)
      .send({ faixas: [] });
    expect(res.status).toBe(403);
  });
});

describe('Pilares por Trilha (pesos)', () => {
  it('atualiza os pesos quando a soma é 100%, e recusa quando não é', async () => {
    const { token: masterToken } = await login(fx.masterEmail);

    const [trilha] = await db('trilhas').insert({ nome: 'Trilha Teste', descricao: 'Teste' }).returning('id');
    await db('trilha_pilares').insert([
      { trilha_id: trilha.id, pilar: 'Pilar A', peso: 60, ordem: 1 },
      { trilha_id: trilha.id, pilar: 'Pilar B', peso: 40, ordem: 2 },
    ]);

    const invalida = await request(app)
      .put(`/api/trilhas/${trilha.id}/pilares`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ pilares: [{ pilar: 'Pilar A', peso: 60 }, { pilar: 'Pilar B', peso: 50 }] });
    expect(invalida.status).toBe(400);
    expect(invalida.body.error).toMatch(/soma/);

    const valida = await request(app)
      .put(`/api/trilhas/${trilha.id}/pilares`)
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ pilares: [{ pilar: 'Pilar A', peso: 70 }, { pilar: 'Pilar B', peso: 30 }] });
    expect(valida.status).toBe(200);
    const pilarA = valida.body.data.pilares.find((p: { pilar: string }) => p.pilar === 'Pilar A');
    expect(pilarA.peso).toBe(70);
  });
});

describe('Tabela de Percentual de Atingimento dos Indicadores', () => {
  it('lista as faixas seed e permite editar todas de uma vez', async () => {
    const { token: masterToken } = await login(fx.masterEmail);

    const listar = await request(app).get('/api/atingimento/faixas').set('Authorization', `Bearer ${masterToken}`);
    expect(listar.status).toBe(200);
    expect(listar.body.data.length).toBeGreaterThanOrEqual(5);

    const edicoes = listar.body.data.map((f: { id: string; faixa_min: number; faixa_max: number }) => ({
      id: f.id,
      faixa_min: f.faixa_min,
      faixa_max: f.faixa_max,
      percentual_peso: f.faixa_min >= 100 ? 100 : 50,
    }));
    const editar = await request(app)
      .put('/api/atingimento/faixas')
      .set('Authorization', `Bearer ${masterToken}`)
      .send({ faixas: edicoes });
    expect(editar.status).toBe(200);
    expect(editar.body.data.find((f: { faixa_min: number }) => f.faixa_min < 100)?.percentual_peso).toBe(50);
  });

  it('colaborador comum só consegue ler, não editar', async () => {
    const { token: colabToken } = await login(fx.colabAdmEmail);
    const ler = await request(app).get('/api/atingimento/faixas').set('Authorization', `Bearer ${colabToken}`);
    expect(ler.status).toBe(200);

    const editar = await request(app)
      .put('/api/atingimento/faixas')
      .set('Authorization', `Bearer ${colabToken}`)
      .send({ faixas: [] });
    expect(editar.status).toBe(403);
  });
});
