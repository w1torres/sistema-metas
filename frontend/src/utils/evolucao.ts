import type { Indicador } from '../types';
import { formatMes, listarMesesDoPeriodo } from './meses';

export interface SerieIndicadorEvolucao {
  id: string;
  nome: string;
}

export interface PontoEvolucaoPorIndicador {
  mes: string;
  [indicadorId: string]: number | null | string;
}

export interface EvolucaoPorIndicadorResultado {
  pontos: PontoEvolucaoPorIndicador[];
  series: SerieIndicadorEvolucao[];
}

/**
 * Evolução de CADA indicador ao longo do tempo (uma linha por indicador, eixo
 * X compartilhado em meses). Aqui a linha é % de PROGRESSO/CONCLUSÃO do
 * indicador, não a nota de qualidade (`atendimento`) — essa continua visível
 * à parte, no selo "Atingimento: X%" do card e no resumo ponderado do
 * colaborador.
 * - MENSAL: % de meses aprovados pelo gestor até aquele mês, sobre o total de
 *   meses do período — progresso real, mês a mês (ver `registrosMensais`).
 * - ANUAL (ou sem periodicidade definida): função degrau, já que o ciclo é
 *   colaborador -> gestor -> RH de uma vez só, sem granularidade menor — 0%
 *   enquanto não concluído, salta para 100% no mês da conclusão (o indicador
 *   está feito, independente da nota de atingimento marcada pelo gestor).
 * Fora do período do indicador (antes de `data_inicio` ou depois de
 * `data_fim`), o valor é `null` para a linha não aparecer nesses meses.
 */
export function construirEvolucaoPorIndicador(indicadores: Indicador[]): EvolucaoPorIndicadorResultado {
  const todosMeses = new Set<string>();
  indicadores.forEach((i) => {
    listarMesesDoPeriodo(i.data_inicio, i.data_fim).forEach((m) => todosMeses.add(m));
  });
  const mesesOrdenados = Array.from(todosMeses).sort();

  const pontos: PontoEvolucaoPorIndicador[] = mesesOrdenados.map((mes) => ({ mes: formatMes(mes) }));

  indicadores.forEach((indicador) => {
    const mesesDoIndicador = listarMesesDoPeriodo(indicador.data_inicio, indicador.data_fim);
    const mesesDoIndicadorSet = new Set(mesesDoIndicador);
    const isMensal = indicador.periodicidade === 'MENSAL';
    const totalMesesIndicador = mesesDoIndicador.length;
    const mesConclusao =
      indicador.status === 'CONCLUIDO' && indicador.concluido_em ? indicador.concluido_em.slice(0, 7) : null;

    mesesOrdenados.forEach((mes, idx) => {
      if (!mesesDoIndicadorSet.has(mes)) {
        pontos[idx][indicador.id] = null;
        return;
      }
      if (isMensal) {
        const aprovadosAteAqui = (indicador.registrosMensais ?? []).filter(
          (r) => r.status === 'APROVADO' && r.mes <= mes,
        ).length;
        pontos[idx][indicador.id] =
          totalMesesIndicador > 0 ? Math.round((aprovadosAteAqui / totalMesesIndicador) * 100) : 0;
      } else {
        pontos[idx][indicador.id] = mesConclusao && mes >= mesConclusao ? 100 : 0;
      }
    });
  });

  return {
    pontos,
    series: indicadores.map((i) => ({ id: i.id, nome: i.nome })),
  };
}
