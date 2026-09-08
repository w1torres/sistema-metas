import type { Indicador } from '../types';

/**
 * Percentual do peso concluído de UM colaborador = soma do peso dos indicadores
 * concluídos dele. O peso de cada indicador já é a fatia (%) que ele representa
 * do total do colaborador (pesos de uma pessoa devem somar 100) — não se divide
 * pela soma real, senão alguém com poucos indicadores cadastrados (ex.: 40 de
 * peso total em vez de 100) aparece com percentual inflado. Cada indicador
 * contribui de forma binária: 100% do seu peso se concluído, 0 caso contrário.
 * Resultado limitado a 100 como proteção caso os pesos cadastrados somem mais
 * que isso.
 */
export function calcularPercentualPonderado(indicadores: Indicador[]): number {
  const pesoConcluido = indicadores
    .filter((i) => i.status === 'CONCLUIDO')
    .reduce((sum, i) => sum + i.peso, 0);
  return Math.min(pesoConcluido, 100);
}

/**
 * Para agregados com VÁRIOS colaboradores (departamento, geral): a média do
 * percentual de cada colaborador, não a soma bruta de todos os pesos — somar
 * pesos de pessoas diferentes não tem significado (cada um deveria somar 100
 * dentro do próprio conjunto de indicadores).
 */
export function calcularMediaPorColaborador(indicadores: Indicador[]): number {
  const porResponsavel = new Map<string, Indicador[]>();
  indicadores.forEach((i) => {
    const lista = porResponsavel.get(i.usuario_responsavel_id) ?? [];
    lista.push(i);
    porResponsavel.set(i.usuario_responsavel_id, lista);
  });

  const percentuais = Array.from(porResponsavel.values()).map(calcularPercentualPonderado);
  if (percentuais.length === 0) return 0;
  return percentuais.reduce((sum, p) => sum + p, 0) / percentuais.length;
}
