import { useState } from 'react';
import type { Indicador } from '../../types';
import IndicadorRow from './IndicadorRow';
import { initials, formatPercent } from '../../utils/formatters';
import { calcularPercentualPonderado } from '../../utils/ppr';

interface ColaboradorIndicadoresGroupProps {
  responsavel: string;
  departamento: string;
  indicadores: Indicador[];
  defaultExpanded?: boolean;
  onEditar: (indicador: Indicador) => void;
  onMudarResponsavel: (indicador: Indicador) => void;
  onHistorico: (indicador: Indicador) => void;
}

export default function ColaboradorIndicadoresGroup({
  responsavel,
  departamento,
  indicadores,
  defaultExpanded = true,
  onEditar,
  onMudarResponsavel,
  onHistorico,
}: ColaboradorIndicadoresGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const percentualPeso = Math.round(calcularPercentualPonderado(indicadores));
  const concluidos = indicadores.filter((i) => i.status === 'CONCLUIDO').length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary" aria-hidden="true">
            {expanded ? '▾' : '▸'}
          </span>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {initials(responsavel)}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{responsavel}</p>
            <p className="text-xs text-secondary">{departamento}</p>
          </div>
        </div>
        <p className="text-xs text-secondary">
          {indicadores.length} indicador{indicadores.length > 1 ? 'es' : ''} · {concluidos} concluído
          {concluidos !== 1 ? 's' : ''} · {formatPercent(percentualPeso)} do peso concluído
        </p>
      </button>

      {expanded && (
        <div className="divide-y divide-border">
          {indicadores.map((indicador) => (
            <IndicadorRow
              key={indicador.id}
              indicador={indicador}
              onEditar={() => onEditar(indicador)}
              onMudarResponsavel={() => onMudarResponsavel(indicador)}
              onHistorico={() => onHistorico(indicador)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
