import { useEffect } from 'react';
import { useBonificacaoStore } from '../../store/bonificacaoStore';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMesReferencia(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split('-');
  const nome = MESES[Number(mes) - 1] ?? mes;
  return `${nome}/${ano}`;
}

/** Card do colaborador em "Meus Indicadores" — mesmo estilo visual de MeuPPRCard. */
export default function MinhaBonificacaoCard() {
  const minhasBonificacoes = useBonificacaoStore((s) => s.minhasBonificacoes);
  const fetchMinhasBonificacoes = useBonificacaoStore((s) => s.fetchMinhasBonificacoes);

  useEffect(() => {
    fetchMinhasBonificacoes().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (minhasBonificacoes.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">Minha Bonificação</p>
      <div className="mt-2 flex flex-col gap-3">
        {minhasBonificacoes.map((b) => (
          <div key={b.id} className="flex flex-wrap items-end gap-x-8 gap-y-2 border-b border-primary/10 pb-3 last:border-0 last:pb-0">
            <div>
              <p className="text-xs text-secondary">Fornecedor</p>
              <p className="text-sm font-semibold text-ink">{b.fornecedor}</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Referência</p>
              <p className="text-sm font-semibold text-ink">{formatMesReferencia(b.mesReferencia)}</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Sua Nota de Desempenho</p>
              <p className="text-lg font-bold text-ink">{formatPercent(b.percentualNota)}</p>
            </div>
            <div>
              <p className="text-xs text-secondary">Valor Recebido</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(b.valorRecebido)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-secondary">
        Valor por colaborador = valor total da bonificação dividido pelo número de participantes; o valor recebido
        aplica sua nota de avaliação de desempenho sobre esse valor.
      </p>
    </div>
  );
}
