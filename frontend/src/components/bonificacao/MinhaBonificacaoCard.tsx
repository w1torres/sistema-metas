import { useEffect, useState } from 'react';
import { useBonificacaoStore } from '../../store/bonificacaoStore';
import { formatCurrency, formatPercent } from '../../utils/formatters';

/** Card do colaborador em "Meus Indicadores" — mesmo estilo visual de MeuPPRCard. */
export default function MinhaBonificacaoCard() {
  const minhasBonificacoes = useBonificacaoStore((s) => s.minhasBonificacoes);
  const fetchMinhasBonificacoes = useBonificacaoStore((s) => s.fetchMinhasBonificacoes);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    fetchMinhasBonificacoes().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (minhasBonificacoes.length === 0) return null;

  // A nota da avaliação de desempenho é do colaborador, não do fornecedor —
  // é a mesma em todas as bonificações dele (ver backend), então aparece uma
  // única vez no card, não repetida por fornecedor.
  const notaAvaliacao = minhasBonificacoes[0].percentualNota;
  const totalRecebido = minhasBonificacoes.reduce((soma, b) => soma + b.valorRecebido, 0);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">Minha Bonificação</p>
      <p className="mt-1 text-xs text-secondary">
        Valor por colaborador = valor total da bonificação dividido pelo número de participantes; o valor recebido
        aplica sua nota de avaliação de desempenho sobre esse valor.
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-primary/10 pb-3">
        <div>
          <p className="text-xs text-secondary">Sua Nota de Desempenho</p>
          <p className="text-lg font-bold text-ink">{formatPercent(notaAvaliacao)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-secondary">Total Recebido</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(totalRecebido)}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className="mt-3 flex w-full items-center justify-between text-left text-sm font-medium text-primary"
        aria-expanded={expandido}
      >
        <span>
          {expandido ? 'Ocultar' : 'Ver'} valores por fornecedor ({minhasBonificacoes.length})
        </span>
        <span className={`transition-transform ${expandido ? 'rotate-180' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {expandido && (
        <div className="mt-3 flex flex-col gap-3">
          {minhasBonificacoes.map((b) => (
            <div key={b.id} className="flex flex-wrap items-end gap-x-8 gap-y-2 border-b border-primary/10 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-xs text-secondary">Fornecedor</p>
                <p className="text-sm font-semibold text-ink">{b.fornecedor}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">Valor Recebido</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(b.valorRecebido)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
