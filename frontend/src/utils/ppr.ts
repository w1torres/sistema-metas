import type { Indicador, Role } from '../types';

/**
 * A Tabela de Múltiplos de PPR não é definida por cargo individual, e sim por 3
 * grupos — que hoje são o próprio Papel/Perfil do usuário (ver types.Role):
 * GERENTES, COORDENADORES_SUPERVISORES e COLABORADOR ("Demais Cargos").
 */
export const GRUPO_GERENTES = 'GERENTES';
export const GRUPO_COORDENADORES = 'COORDENADORES E SUPERVISORES';
export const GRUPO_DEMAIS = 'DEMAIS CARGOS';

export const PPR_GRUPOS = [GRUPO_GERENTES, GRUPO_COORDENADORES, GRUPO_DEMAIS] as const;

// ADMIN/MASTER não têm faixa de PPR — não são avaliados nesta tabela.
export function roleParaGrupoPPR(role: Role): string | undefined {
  if (role === 'GERENTES') return GRUPO_GERENTES;
  if (role === 'COORDENADORES_SUPERVISORES') return GRUPO_COORDENADORES;
  if (role === 'COLABORADOR') return GRUPO_DEMAIS;
  return undefined;
}

/**
 * Percentual do peso concluído de UM colaborador = soma do peso efetivo dos
 * indicadores concluídos dele. O peso de cada indicador já é a fatia (%) que
 * ele representa do total do colaborador (pesos de uma pessoa devem somar
 * 100) — não se divide pela soma real, senão alguém com poucos indicadores
 * cadastrados (ex.: 40 de peso total em vez de 100) aparece com percentual
 * inflado. Cada indicador concluído contribui com `peso * atendimento/100`
 * — ou seja, o resultado que o gestor marcou na Tabela de Atingimento (ver
 * `Indicador.atendimento`), não mais um valor binário 100%/0%. Indicadores
 * sem Tabela de Atingimento são aprovados com atendimento = 100 (ver
 * `indicatorStore.aprovarRH`), preservando o comportamento anterior para eles.
 * Resultado limitado a 100 como proteção caso os pesos cadastrados somem mais
 * que isso.
 */
export function calcularPercentualPonderado(indicadores: Indicador[]): number {
  const pesoEfetivo = indicadores
    .filter((i) => i.status === 'CONCLUIDO')
    .reduce((sum, i) => sum + i.peso * (i.atendimento / 100), 0);
  return Math.min(pesoEfetivo, 100);
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
