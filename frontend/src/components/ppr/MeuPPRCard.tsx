import { usePPRStore } from '../../store/pprStore';
import { calcularPercentualPonderado } from '../../utils/ppr';
import { formatPercent } from '../../utils/formatters';
import type { Indicador } from '../../types';

interface MeuPPRCardProps {
  cargo: string;
  indicadores: Indicador[];
}

export default function MeuPPRCard({ cargo, indicadores }: MeuPPRCardProps) {
  const faixaPara = usePPRStore((s) => s.faixaPara);

  if (indicadores.length === 0) return null;

  const percentual = calcularPercentualPonderado(indicadores);
  const faixa = faixaPara(cargo, percentual);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">Seu Múltiplo de PPR</p>
      <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-2">
        <div>
          <p className="text-xs text-secondary">Cargo</p>
          <p className="text-sm font-semibold text-ink">{cargo}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">% do Peso Concluído</p>
          <p className="text-lg font-bold text-ink">{formatPercent(percentual)}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Múltiplo Atingido</p>
          <p className="text-lg font-bold text-primary">{faixa ? `${faixa.multiplo}x` : '—'}</p>
        </div>
      </div>
      {!faixa && cargo === 'NAO_DEFINIDO' && (
        <p className="mt-2 text-xs text-secondary">
          Seu cargo ainda não foi definido pelo RH — por isso não é possível calcular seu múltiplo de PPR ainda.
        </p>
      )}
      {!faixa && cargo !== 'NAO_DEFINIDO' && (
        <p className="mt-2 text-xs text-secondary">
          Nenhuma faixa de PPR cadastrada ainda para o cargo {cargo}. Fale com o RH para configurar em Tabelas.
        </p>
      )}
      <p className="mt-2 text-xs text-secondary">
        Calculado somando o peso de cada indicador concluído, dividido pelo peso total dos seus indicadores.
      </p>
    </div>
  );
}
