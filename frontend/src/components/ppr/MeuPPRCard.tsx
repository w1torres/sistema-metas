import { usePPRStore } from '../../store/pprStore';
import { calcularPercentualPonderado } from '../../utils/ppr';
import { formatPercent } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/constants';
import type { Indicador, Role } from '../../types';

interface MeuPPRCardProps {
  cargo: string;
  role: Role;
  indicadores: Indicador[];
}

export default function MeuPPRCard({ cargo, role, indicadores }: MeuPPRCardProps) {
  const faixaPara = usePPRStore((s) => s.faixaPara);

  if (indicadores.length === 0) return null;

  const percentual = calcularPercentualPonderado(indicadores);
  const faixa = faixaPara(role, percentual);

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
      {!faixa && (role === 'ADMIN' || role === 'MASTER') && (
        <p className="mt-2 text-xs text-secondary">Perfil {ROLE_LABELS[role]} não participa da Tabela de Múltiplos de PPR.</p>
      )}
      {!faixa && role !== 'ADMIN' && role !== 'MASTER' && (
        <p className="mt-2 text-xs text-secondary">
          Nenhuma faixa de PPR cadastrada ainda para {ROLE_LABELS[role]}. Fale com o RH para configurar em Tabelas.
        </p>
      )}
      <p className="mt-2 text-xs text-secondary">
        Calculado somando o peso de cada indicador concluído, dividido pelo peso total dos seus indicadores.
      </p>
    </div>
  );
}
