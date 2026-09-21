import type { Bonificacao } from '../types';

export interface ResumoBonificacaoColaborador {
  usuarioId: string;
  nome: string;
  notaMedia: number;
  totalRecebido: number;
}

// Nota da avaliação é uma só por colaborador (o import vale pra todas as
// bonificações dele), mas cada participação guarda a sua — então a visão
// consolidada mostra a média e o total a receber somando todos os fornecedores.
export function resumirBonificacaoPorColaborador(bonificacoes: Bonificacao[]): ResumoBonificacaoColaborador[] {
  const porUsuario = new Map<string, { nome: string; notas: number[]; total: number }>();
  for (const b of bonificacoes) {
    for (const p of b.participantes ?? []) {
      const atual = porUsuario.get(p.usuarioId) ?? { nome: p.usuarioNome, notas: [], total: 0 };
      atual.notas.push(p.percentualNota);
      atual.total += p.valorRecebido;
      porUsuario.set(p.usuarioId, atual);
    }
  }
  return Array.from(porUsuario.entries())
    .map(([usuarioId, v]) => ({
      usuarioId,
      nome: v.nome,
      notaMedia: v.notas.reduce((a, n) => a + n, 0) / v.notas.length,
      totalRecebido: v.total,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}
