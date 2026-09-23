import * as repository from './repository.js';
import * as usersRepository from '../users/repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { isGestorDepartamento, temAcessoAmplo } from '../../utils/roles.js';
import type { AuthUser, Indicador, IndicadorStatus } from '../../types/index.js';
import type { IndicadorFilters } from './repository.js';

function canView(user: AuthUser, indicador: Indicador): boolean {
  if (temAcessoAmplo(user.role)) return true;
  if (isGestorDepartamento(user.role)) return indicador.departamento_id === user.departamentoId;
  return indicador.usuario_responsavel_id === user.id;
}

function canManage(user: AuthUser, indicador: Indicador): boolean {
  if (temAcessoAmplo(user.role)) return true;
  if (isGestorDepartamento(user.role)) return indicador.departamento_id === user.departamentoId;
  return false;
}

async function requireVisible(user: AuthUser, id: string): Promise<Indicador> {
  const indicador = await repository.findById(id);
  if (!indicador) throw ApiError.notFound('Indicador não encontrado');
  if (!canView(user, indicador)) throw ApiError.forbidden();
  return indicador;
}

export async function listIndicadores(
  user: AuthUser,
  filters: Omit<IndicadorFilters, 'departamentoId'>,
): Promise<Indicador[]> {
  if (user.role === 'COLABORADOR') {
    return repository.findMany({ ...filters, usuarioResponsavelId: user.id });
  }
  if (isGestorDepartamento(user.role)) {
    return repository.findMany({ ...filters, departamentoId: user.departamentoId });
  }
  return repository.findMany(filters);
}

export async function listMinhas(user: AuthUser): Promise<Indicador[]> {
  return repository.findMany({ usuarioResponsavelId: user.id });
}

export async function getIndicador(user: AuthUser, id: string): Promise<Indicador> {
  return requireVisible(user, id);
}

interface CreateInput {
  departamento_id: string;
  usuario_responsavel_id: string;
  nome: string;
  peso: number;
  objetivo?: string | null;
  detalhamento?: string | null;
  data_inicio: string;
  data_fim: string;
  funcao?: string | null;
  pilar?: string | null;
  meta?: string | null;
  forma_medicao?: string | null;
  evidencia_obrigatoria?: string | null;
  tabela_atingimento?: Indicador['tabela_atingimento'];
}

export async function createIndicador(user: AuthUser, input: CreateInput): Promise<Indicador> {
  if (user.role === 'COLABORADOR') throw ApiError.forbidden();

  const responsavel = await usersRepository.findById(input.usuario_responsavel_id);
  if (!responsavel) throw ApiError.badRequest('Responsável não encontrado');

  if (isGestorDepartamento(user.role) && responsavel.departamento_id !== user.departamentoId) {
    throw ApiError.forbidden('Responsável fora do seu departamento');
  }

  // Gestor de departamento (GERENTES/COORDENADORES_SUPERVISORES) só cria no
  // próprio departamento. MASTER/ADMIN podem informar um departamento
  // diferente do responsável (ex.: indicador cross-departamento), mas se não
  // informarem nada, cai no departamento do responsável — nunca null (a
  // coluna é NOT NULL; sem este fallback, um POST sem departamento_id
  // quebrava com erro 500 de constraint em vez de criar o indicador).
  const departamentoId = isGestorDepartamento(user.role)
    ? user.departamentoId
    : input.departamento_id || responsavel.departamento_id;

  // Recusa duplicata (mesmo responsável + nome + período) em vez de criar de
  // novo — protege contra reimportar a mesma planilha ou um clique duplicado
  // que já tinha sido aceito (ver ImportPlanilhaModal.tsx no frontend).
  const duplicado = await repository.findDuplicado(
    input.usuario_responsavel_id,
    input.nome,
    input.data_inicio,
    input.data_fim,
  );
  if (duplicado) {
    throw ApiError.conflict(`Já existe um indicador "${input.nome}" para este responsável neste período`);
  }

  const criado = await repository.create({ ...input, departamento_id: departamentoId });
  await repository.pushHistory({
    indicador_id: criado.id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'CRIACAO',
    valor_novo: criado.id,
    motivo: 'Indicador criado',
  });
  return criado;
}

type UpdateInput = Partial<
  Pick<
    Indicador,
    | 'nome'
    | 'peso'
    | 'status'
    | 'objetivo'
    | 'detalhamento'
    | 'data_inicio'
    | 'data_fim'
    | 'funcao'
    | 'pilar'
    | 'meta'
    | 'forma_medicao'
    | 'evidencia_obrigatoria'
    | 'tabela_atingimento'
  >
>;

// Só estes 3 podem ser setados "na mão" pela edição livre — os demais
// (AGUARDANDO_APROVACAO, AGUARDANDO_RH, CONCLUIDO) só são alcançados pelas
// transições próprias (solicitarConclusao/aprovar/etc.), nunca por edição
// direta, senão pula a auditoria e as regras de cada etapa.
const STATUS_EDITAVEIS_LIVREMENTE: IndicadorStatus[] = ['EM_ANDAMENTO', 'ATRASADO', 'PAUSADO'];

export async function updateIndicador(user: AuthUser, id: string, fields: UpdateInput): Promise<Indicador> {
  const indicador = await requireVisible(user, id);
  if (!canManage(user, indicador)) throw ApiError.forbidden();

  if (fields.status && !STATUS_EDITAVEIS_LIVREMENTE.includes(fields.status)) {
    throw ApiError.badRequest(
      `Status "${fields.status}" só pode ser alcançado pelo fluxo de aprovação, não por edição direta`,
    );
  }

  const atualizado = await repository.update(id, fields);
  if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

  await repository.pushHistory({
    indicador_id: id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'EDICAO',
    campo_alterado: Object.keys(fields).join(', '),
    valor_novo: fields,
  });
  return atualizado;
}

export async function deleteIndicador(user: AuthUser, id: string): Promise<void> {
  await requireVisible(user, id); // 404 antes de 403 quando não existe
  await repository.remove(id);
}

export async function reatribuirIndicador(
  user: AuthUser,
  id: string,
  novoResponsavelId: string,
  motivo?: string,
): Promise<Indicador> {
  const indicador = await requireVisible(user, id);
  if (!canManage(user, indicador)) throw ApiError.forbidden();

  const novoResponsavel = await usersRepository.findById(novoResponsavelId);
  if (!novoResponsavel) throw ApiError.badRequest('Novo responsável não encontrado');
  if (isGestorDepartamento(user.role) && novoResponsavel.departamento_id !== user.departamentoId) {
    throw ApiError.forbidden('Novo responsável fora do seu departamento');
  }

  const atualizado = await repository.reatribuir(id, novoResponsavelId);
  if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

  await repository.pushHistory({
    indicador_id: id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'REATRIBUICAO',
    campo_alterado: 'usuario_responsavel_id',
    valor_anterior: indicador.responsavel,
    valor_novo: novoResponsavel.nome,
    motivo: motivo ?? null,
  });
  return atualizado;
}

function requireStatus(indicador: Indicador, esperados: IndicadorStatus[]) {
  if (!esperados.includes(indicador.status)) {
    throw ApiError.conflict(`Indicador precisa estar em ${esperados.join(' ou ')} (está em ${indicador.status})`);
  }
}

// Colaborador marca o checkbox: não conclui direto, entra na fila do gestor
// do departamento (1º nível de aprovação).
export async function solicitarConclusao(user: AuthUser, id: string, nota?: string): Promise<Indicador> {
  const indicador = await requireVisible(user, id);
  if (indicador.usuario_responsavel_id !== user.id) throw ApiError.forbidden();
  requireStatus(indicador, ['EM_ANDAMENTO', 'ATRASADO']);

  const atualizado = await repository.updateStatus(id, 'AGUARDANDO_APROVACAO');
  if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

  await repository.pushHistory({
    indicador_id: id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'SOLICITACAO_CONCLUSAO',
    campo_alterado: 'status',
    valor_anterior: indicador.status,
    valor_novo: 'AGUARDANDO_APROVACAO',
    motivo: nota?.trim() ? nota.trim() : 'Colaborador solicitou conclusão (sem observações)',
  });
  // Recarrega — a nota que acabou de entrar em indicador_updates é embutida
  // no indicador via subquery (ver repository.ts), então só aparece depois
  // do pushHistory (`atualizado` acima foi buscado antes da nota existir).
  return (await repository.findById(id))!;
}

export async function cancelarSolicitacao(user: AuthUser, id: string): Promise<Indicador> {
  const indicador = await requireVisible(user, id);
  if (indicador.usuario_responsavel_id !== user.id) throw ApiError.forbidden();
  requireStatus(indicador, ['AGUARDANDO_APROVACAO']);

  const atualizado = await repository.updateStatus(id, 'EM_ANDAMENTO');
  if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

  await repository.pushHistory({
    indicador_id: id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'EDICAO',
    campo_alterado: 'status',
    valor_anterior: indicador.status,
    valor_novo: 'EM_ANDAMENTO',
    motivo: 'Solicitação de conclusão cancelada pelo colaborador',
  });
  return atualizado;
}

export async function desfazerConclusao(user: AuthUser, id: string): Promise<Indicador> {
  const indicador = await requireVisible(user, id);
  if (indicador.usuario_responsavel_id !== user.id) throw ApiError.forbidden();
  requireStatus(indicador, ['CONCLUIDO']);

  const atualizado = await repository.updateStatus(id, 'EM_ANDAMENTO', { atendimento: 0, concluido_em: null });
  if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

  await repository.pushHistory({
    indicador_id: id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'EDICAO',
    campo_alterado: 'status',
    valor_anterior: indicador.status,
    valor_novo: 'EM_ANDAMENTO',
    motivo: 'Marca de conclusão removida',
  });
  return atualizado;
}

// Fluxo de aprovação em 2 etapas: GERENTES/COORDENADORES_SUPERVISORES aprovam
// o 1º nível (AGUARDANDO_APROVACAO -> AGUARDANDO_RH) e só MASTER confirma o
// 2º nível (AGUARDANDO_RH -> CONCLUIDO) — ADMIN não participa desta etapa
// final, por decisão de escopo (só MASTER aprova PPR/RH). Uma rejeição em
// qualquer etapa devolve para EM_ANDAMENTO. `observacao` é sempre gravada em
// auditoria, aprovando ou rejeitando.
export async function aprovar(
  user: AuthUser,
  id: string,
  aprovado: boolean,
  observacao?: string,
): Promise<Indicador> {
  const indicador = await requireVisible(user, id);

  if (isGestorDepartamento(user.role)) {
    if (indicador.departamento_id !== user.departamentoId) throw ApiError.forbidden();
    requireStatus(indicador, ['AGUARDANDO_APROVACAO']);

    const novoStatus: IndicadorStatus = aprovado ? 'AGUARDANDO_RH' : 'EM_ANDAMENTO';
    const atualizado = await repository.updateStatus(id, novoStatus);
    if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

    await repository.pushHistory({
      indicador_id: id,
      usuario_alterou_id: user.id,
      tipo_alteracao: aprovado ? 'APROVACAO_GESTOR' : 'REJEICAO',
      campo_alterado: 'status',
      valor_anterior: indicador.status,
      valor_novo: novoStatus,
      motivo: aprovado ? 'Aprovado pelo gestor do departamento' : 'Rejeitado pelo gestor do departamento',
      observacao: observacao?.trim() || null,
    });
    return (await repository.findById(id))!;
  }

  if (user.role === 'MASTER') {
    requireStatus(indicador, ['AGUARDANDO_RH']);

    const novoStatus: IndicadorStatus = aprovado ? 'CONCLUIDO' : 'EM_ANDAMENTO';
    const extra = aprovado ? { atendimento: 100, concluido_em: new Date().toISOString() } : {};
    const atualizado = await repository.updateStatus(id, novoStatus, extra);
    if (!atualizado) throw ApiError.notFound('Indicador não encontrado');

    await repository.pushHistory({
      indicador_id: id,
      usuario_alterou_id: user.id,
      tipo_alteracao: aprovado ? 'APROVACAO_RH' : 'REJEICAO',
      campo_alterado: 'status',
      valor_anterior: indicador.status,
      valor_novo: novoStatus,
      motivo: aprovado ? 'Aprovado pelo MASTER — indicador concluído' : 'Rejeitado pelo MASTER',
      observacao: observacao?.trim() || null,
    });
    return (await repository.findById(id))!;
  }

  throw ApiError.forbidden();
}

export async function historyFor(user: AuthUser, id: string) {
  await requireVisible(user, id);
  return repository.historyFor(id);
}

export async function notaConclusaoAtual(user: AuthUser, id: string) {
  await requireVisible(user, id);
  return repository.notaConclusaoAtual(id);
}

// --- Anexos ---------------------------------------------------------------

export async function addAttachment(
  user: AuthUser,
  id: string,
  file: { originalname: string; path: string; mimetype: string; size: number },
) {
  const indicador = await requireVisible(user, id);
  if (!canManage(user, indicador) && indicador.usuario_responsavel_id !== user.id) throw ApiError.forbidden();

  const attachment = await repository.addAttachment({
    indicador_id: id,
    usuario_id: user.id,
    nome_arquivo: file.originalname,
    url: file.path,
    tipo_mime: file.mimetype,
    tamanho_bytes: file.size,
  });

  await repository.pushHistory({
    indicador_id: id,
    usuario_alterou_id: user.id,
    tipo_alteracao: 'EDICAO',
    campo_alterado: 'anexos',
    valor_novo: attachment.nome_arquivo,
    motivo: 'Documento anexado',
  });
  return attachment;
}

export async function listAttachments(user: AuthUser, id: string) {
  await requireVisible(user, id);
  return repository.listAttachments(id);
}

export async function removeAttachment(user: AuthUser, id: string, attachmentId: string): Promise<void> {
  const indicador = await requireVisible(user, id);
  const attachment = await repository.findAttachment(attachmentId);
  if (!attachment || attachment.indicador_id !== id) throw ApiError.notFound('Anexo não encontrado');
  if (!canManage(user, indicador) && attachment.usuario_id !== user.id) throw ApiError.forbidden();
  await repository.removeAttachment(attachmentId);
}

// Mesma regra de visibilidade do indicador — quem pode ver o indicador pode
// baixar o anexo dele. Retorna o caminho em disco (armazenamento local, ver
// middleware/upload.ts) pro controller servir o arquivo.
export async function getAttachmentFile(
  user: AuthUser,
  id: string,
  attachmentId: string,
): Promise<{ path: string; nomeArquivo: string; tipoMime: string | null }> {
  await requireVisible(user, id);
  const attachment = await repository.findAttachment(attachmentId);
  if (!attachment || attachment.indicador_id !== id) throw ApiError.notFound('Anexo não encontrado');
  return { path: attachment.url, nomeArquivo: attachment.nome_arquivo, tipoMime: attachment.tipo_mime };
}
