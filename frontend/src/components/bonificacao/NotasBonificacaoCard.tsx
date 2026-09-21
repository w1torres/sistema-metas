import { useEffect, useMemo } from 'react';
import Button from '../common/Button';
import { useBonificacaoStore } from '../../store/bonificacaoStore';
import { downloadCSV, toCSV } from '../../utils/csv';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { resumirBonificacaoPorColaborador } from '../../utils/bonificacao';

interface NotasBonificacaoCardProps {
  titulo: string;
  exportavel?: boolean;
}

/** Nota da avaliação de desempenho e total de bonificação a receber por colaborador — usado na Visão Geral e nos Relatórios (só MASTER/ADMIN chegam nessas telas). */
export default function NotasBonificacaoCard({ titulo, exportavel = false }: NotasBonificacaoCardProps) {
  const bonificacoes = useBonificacaoStore((s) => s.bonificacoes);
  const fetchBonificacoes = useBonificacaoStore((s) => s.fetchBonificacoes);

  useEffect(() => {
    fetchBonificacoes().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumo = useMemo(() => resumirBonificacaoPorColaborador(bonificacoes), [bonificacoes]);
  if (resumo.length === 0) return null;

  const notaGeral = resumo.reduce((a, r) => a + r.notaMedia, 0) / resumo.length;
  const totalGeral = resumo.reduce((a, r) => a + r.totalRecebido, 0);

  function exportar() {
    downloadCSV(
      'relatorio_avaliacao_bonificacao.csv',
      toCSV(
        ['Colaborador', 'Nota da Avaliação', 'Bonificação a Receber'],
        resumo.map((r) => [r.nome, `${Math.round(r.notaMedia)}%`, r.totalRecebido.toFixed(2)]),
      ),
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">{titulo}</h2>
          <p className="text-xs text-secondary">
            {resumo.length} colaboradores · nota média {formatPercent(notaGeral)} · total a receber{' '}
            {formatCurrency(totalGeral)}
          </p>
        </div>
        {exportavel && (
          <Button variant="secondary" size="sm" onClick={exportar}>
            Exportar CSV
          </Button>
        )}
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-secondary">
              <th className="py-2 pr-4">Colaborador</th>
              <th className="py-2 pr-4">Nota da Avaliação</th>
              <th className="py-2 text-right">Bonificação a Receber</th>
            </tr>
          </thead>
          <tbody>
            {resumo.map((r) => (
              <tr key={r.usuarioId} className="border-b border-border last:border-0">
                <td className="py-2 pr-4 font-medium text-ink">{r.nome}</td>
                <td className="py-2 pr-4">{formatPercent(r.notaMedia)}</td>
                <td className="py-2 text-right font-semibold text-primary">{formatCurrency(r.totalRecebido)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
