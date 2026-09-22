import * as repository from './repository.js';
import * as departamentosRepository from '../departamentos/repository.js';
import * as usersRepository from '../users/repository.js';
import { ApiError } from '../../utils/ApiError.js';
import { temAcessoAmplo } from '../../utils/roles.js';
import type { AuthUser } from '../../types/index.js';
import type { Bonificacao, BonificacaoParticipante, MinhaBonificacao } from './repository.js';

export interface BonificacaoComCalculo extends Bonificacao {
  valor_por_colaborador: number;
  participantes?: ParticipanteComCalculo[];
}

export interface ParticipanteComCalculo extends BonificacaoParticipante {
  valor_por_colaborador: number;
  valor_recebido: number;
}

export interface MinhaBonificacaoComCalculo extends MinhaBonificacao {
  valor_por_colaborador: number;
  valor_recebido: number;
}

function calcularValorPorColaborador(bonificacao: { valor_total: number; total_colaboradores: number }): number {
  if (bonificacao.total_colaboradores === 0) return 0;
  return bonificacao.valor_total / bonificacao.total_colaboradores;
}

function comCalculo(bonificacao: Bonificacao): BonificacaoComCalculo {
  return { ...bonificacao, valor_por_colaborador: calcularValorPorColaborador(bonificacao) };
}

function participantesComCalculo(
  participantes: BonificacaoParticipante[],
  valorPorColaborador: number,
): ParticipanteComCalculo[] {
  return participantes.map((p) => ({
    ...p,
    valor_por_colaborador: valorPorColaborador,
    // Ex.: valor por colaborador R$1.000 e nota 90 -> recebe R$900.
    valor_recebido: (valorPorColaborador * p.percentual_nota) / 100,
  }));
}

/**
 * MASTER/ADMIN sempre podem gerenciar (mesmo padrão de acesso amplo do
 * resto do sistema — ver utils/roles.ts). Um GERENTES só pode gerenciar
 * bonificação se o departamento dele for MARKETING — é o "gerente de
 * marketing" citado no pedido, resolvido pelo nome do departamento (não há
 * papel dedicado "GERENTE_MARKETING" no enum de Role).
 */
async function assertPodeGerenciar(user: AuthUser): Promise<void> {
  if (temAcessoAmplo(user.role)) return;
  if (user.role === 'GERENTES') {
    const marketing = await departamentosRepository.findByNome('MARKETING');
    if (marketing && marketing.id === user.departamentoId) return;
  }
  throw ApiError.forbidden('Acesso restrito ao MASTER/ADMIN ou ao gerente do departamento de Marketing');
}

const NOTA_PADRAO_NOVO_PARTICIPANTE = 100;

/**
 * Direito à bonificação = admitido até 31/12 do ano ANTERIOR ao mês de
 * referência (ex.: bonificação de 2026-09 exige data_admissao <=
 * 2025-12-31) — decisão confirmada com o usuário. 'YYYY-MM' -> 'YYYY-12-31'.
 */
function calcularDataLimiteAdmissao(mesReferencia: string): string {
  const ano = Number(mesReferencia.slice(0, 4));
  return `${ano - 1}-12-31`;
}

/**
 * Participantes não são escolhidos manualmente — são todo colaborador ativo
 * (exceto MASTER/ADMIN, contas de administração do sistema) admitido até a
 * data-limite. Preserva a nota de quem já era participante; só usa o padrão
 * pra quem está entrando agora (ver repository.sincronizarParticipantes).
 */
async function sincronizarParticipantesElegiveis(bonificacao: Bonificacao): Promise<void> {
  const dataLimite = calcularDataLimiteAdmissao(bonificacao.mes_referencia);
  const elegiveis = await usersRepository.findElegiveisParaBonificacao(dataLimite);
  await repository.sincronizarParticipantes(
    bonificacao.id,
    elegiveis.map((u) => u.id),
    NOTA_PADRAO_NOVO_PARTICIPANTE,
  );
}

async function comParticipantes(bonificacao: Bonificacao): Promise<BonificacaoComCalculo> {
  const valorPorColaborador = calcularValorPorColaborador(bonificacao);
  const participantes = await repository.findParticipantes(bonificacao.id);
  return {
    ...comCalculo(bonificacao),
    participantes: participantesComCalculo(participantes, valorPorColaborador),
  };
}

// A tela de gestão precisa ver de cara quem já está vinculado (nome, nota,
// valor a receber) sem um clique extra — por isso a listagem (e a resposta
// de criar/editar) já traz os participantes com o cálculo pronto, não só o
// resumo da bonificação.
export async function listBonificacoes(user: AuthUser): Promise<BonificacaoComCalculo[]> {
  await assertPodeGerenciar(user);
  const bonificacoes = await repository.findAll();
  return Promise.all(bonificacoes.map(comParticipantes));
}

export async function getBonificacao(
  user: AuthUser,
  id: string,
): Promise<{ bonificacao: BonificacaoComCalculo; participantes: ParticipanteComCalculo[] }> {
  await assertPodeGerenciar(user);
  const bonificacao = await repository.findById(id);
  if (!bonificacao) throw ApiError.notFound('Bonificação não encontrada');
  const completa = await comParticipantes(bonificacao);
  return { bonificacao: completa, participantes: completa.participantes! };
}

export interface CreateBonificacaoInput {
  fornecedor: string;
  valor_total: number;
  mes_referencia: string;
}

export async function createBonificacao(user: AuthUser, input: CreateBonificacaoInput): Promise<BonificacaoComCalculo> {
  await assertPodeGerenciar(user);
  const bonificacao = await repository.create({ ...input, criado_por: user.id });
  await sincronizarParticipantesElegiveis(bonificacao);
  return comParticipantes((await repository.findById(bonificacao.id))!);
}

export async function updateBonificacao(
  user: AuthUser,
  id: string,
  input: Partial<CreateBonificacaoInput>,
): Promise<BonificacaoComCalculo> {
  await assertPodeGerenciar(user);
  const existente = await repository.findById(id);
  if (!existente) throw ApiError.notFound('Bonificação não encontrada');
  const atualizada = await repository.update(id, input);
  // Mudou o mês de referência -> o ano-limite de admissão pode ter mudado,
  // então recalcula quem é elegível (preserva a nota de quem continua).
  if (input.mes_referencia && input.mes_referencia !== existente.mes_referencia) {
    await sincronizarParticipantesElegiveis(atualizada!);
  }
  return comParticipantes((await repository.findById(id))!);
}

export async function removeBonificacao(user: AuthUser, id: string): Promise<void> {
  await assertPodeGerenciar(user);
  const existente = await repository.findById(id);
  if (!existente) throw ApiError.notFound('Bonificação não encontrada');
  await repository.remove(id);
}

export async function setPaga(user: AuthUser, id: string, paga: boolean): Promise<BonificacaoComCalculo> {
  await assertPodeGerenciar(user);
  const existente = await repository.findById(id);
  if (!existente) throw ApiError.notFound('Bonificação não encontrada');
  const atualizada = await repository.setPaga(id, paga);
  return comParticipantes(atualizada!);
}

/**
 * Recalcula os participantes elegíveis "na mão" — útil pra bonificações
 * criadas antes desta regra existir, ou depois que um colaborador novo é
 * cadastrado/tem a data de admissão corrigida. Não aceita lista manual (ver
 * ADR): elegibilidade é sempre derivada de data_admissao + role, nunca
 * escolhida pelo usuário.
 */
export async function sincronizarParticipantes(user: AuthUser, id: string): Promise<ParticipanteComCalculo[]> {
  await assertPodeGerenciar(user);
  const bonificacao = await repository.findById(id);
  if (!bonificacao) throw ApiError.notFound('Bonificação não encontrada');

  await sincronizarParticipantesElegiveis(bonificacao);
  const resultado = await getBonificacao(user, id);
  return resultado.participantes;
}

/**
 * A nota da avaliação de desempenho é do colaborador (uma avaliação só),
 * não do fornecedor — editar aqui (a partir de UMA bonificação) atualiza a
 * nota em TODAS as bonificações em que ele participa, igual ao import por
 * CPF (ver importarNotas). Nunca fica "90 na Corteva e 80 na UPL" pro mesmo
 * colaborador na mesma avaliação.
 */
export async function atualizarNotaParticipante(
  user: AuthUser,
  id: string,
  usuarioId: string,
  percentualNota: number,
): Promise<ParticipanteComCalculo[]> {
  await assertPodeGerenciar(user);
  const bonificacao = await repository.findById(id);
  if (!bonificacao) throw ApiError.notFound('Bonificação não encontrada');

  const participantes = await repository.findParticipantes(id);
  if (!participantes.some((p) => p.usuario_id === usuarioId)) {
    throw ApiError.notFound('Colaborador não é participante desta bonificação');
  }

  await repository.updateNotaPorUsuario(usuarioId, percentualNota);

  const resultado = await getBonificacao(user, id);
  return resultado.participantes;
}

export interface ImportNotaErro {
  linha: number;
  cpf: string;
  motivo: string;
}

/**
 * Importa a nota da avaliação de desempenho por CPF. A nota é do colaborador
 * (uma avaliação só), então vale para todas as bonificações em que ele
 * participa. Cada linha é tratada isoladamente — uma inválida só entra em
 * `erros`, não derruba o import inteiro.
 */
export async function importarNotas(
  user: AuthUser,
  notas: { cpf: string; percentual_nota: number }[],
): Promise<{ atualizados: number; erros: ImportNotaErro[] }> {
  await assertPodeGerenciar(user);
  const erros: ImportNotaErro[] = [];
  let atualizados = 0;

  for (const [idx, item] of notas.entries()) {
    const linha = idx + 2; // +1 cabeçalho, +1 base 1
    // Excel guarda CPF como número e derruba zeros à esquerda — completa até 11 dígitos.
    const digitos = item.cpf.replace(/\D/g, '');
    const cpf = digitos && digitos.length < 11 ? digitos.padStart(11, '0') : digitos;
    if (!cpf) {
      erros.push({ linha, cpf: item.cpf, motivo: 'CPF é obrigatório' });
      continue;
    }
    if (Number.isNaN(item.percentual_nota) || item.percentual_nota < 0 || item.percentual_nota > 100) {
      erros.push({ linha, cpf: item.cpf, motivo: 'Nota deve estar entre 0 e 100' });
      continue;
    }
    const usuario = await usersRepository.findByCpf(cpf);
    if (!usuario) {
      erros.push({ linha, cpf: item.cpf, motivo: 'CPF não encontrado nos usuários cadastrados' });
      continue;
    }
    const linhasAtualizadas = await repository.updateNotaPorUsuario(usuario.id, item.percentual_nota);
    if (linhasAtualizadas === 0) {
      erros.push({ linha, cpf: item.cpf, motivo: `${usuario.nome} não participa de nenhuma bonificação` });
      continue;
    }
    atualizados += 1;
  }

  return { atualizados, erros };
}

export async function listMinhasBonificacoes(user: AuthUser): Promise<MinhaBonificacaoComCalculo[]> {
  const minhas = await repository.findMinhas(user.id);
  return minhas.map((bonificacao) => {
    const valorPorColaborador = calcularValorPorColaborador(bonificacao);
    return {
      ...bonificacao,
      valor_por_colaborador: valorPorColaborador,
      valor_recebido: (valorPorColaborador * bonificacao.percentual_nota) / 100,
    };
  });
}
