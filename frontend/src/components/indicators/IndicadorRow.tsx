import type { Indicador } from '../../types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatDate } from '../../utils/formatters';

interface IndicadorRowProps {
  indicador: Indicador;
  onEditar: () => void;
  onMudarResponsavel: () => void;
  onHistorico: () => void;
}

export default function IndicadorRow({ indicador, onEditar, onMudarResponsavel, onHistorico }: IndicadorRowProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={indicador.nome}>
          {indicador.nome}
        </p>
        <p className="text-xs text-secondary">
          Peso: {indicador.peso}% · Prazo: {formatDate(indicador.data_fim)}
        </p>
      </div>

      <div className="shrink-0">
        <Badge status={indicador.status} />
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        <Button variant="ghost" size="sm" onClick={onEditar}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onMudarResponsavel}>
          Reatribuir
        </Button>
        <Button variant="ghost" size="sm" onClick={onHistorico}>
          Histórico
        </Button>
      </div>
    </div>
  );
}
