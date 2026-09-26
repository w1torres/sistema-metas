import { useState } from 'react';
import type { Indicador } from '../../types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import IndicadorDetalhesModal from './IndicadorDetalhesModal';
import { formatDate, formatPercent } from '../../utils/formatters';
import { getSafraForDate } from '../../utils/safra';

interface IndicadorAdminCardProps {
  indicador: Indicador;
  onEditar: () => void;
  onMudarResponsavel: () => void;
  onHistorico: () => void;
}

export default function IndicadorAdminCard({
  indicador,
  onEditar,
  onMudarResponsavel,
  onHistorico,
}: IndicadorAdminCardProps) {
  const safra = getSafraForDate(indicador.data_inicio);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const isConcluido = indicador.status === 'CONCLUIDO';
  const temDetalhes = Boolean(
    indicador.pilar ||
      indicador.meta ||
      indicador.formaMedicao ||
      indicador.evidenciaObrigatoria ||
      indicador.tabelaAtingimento?.length,
  );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        {temDetalhes ? (
          <button
            type="button"
            onClick={() => setDetalhesAbertos(true)}
            title="Ver mais informações do indicador"
            className="text-left text-sm font-semibold text-ink hover:underline"
          >
            {indicador.nome}
          </button>
        ) : (
          <h3 className="text-sm font-semibold text-ink">{indicador.nome}</h3>
        )}
        <Badge status={indicador.status} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-ink">{safra.label}</span>
        <span>
          Peso: <span className="font-medium text-ink">{indicador.peso}%</span>
        </span>
        <span>
          Prazo: <span className="font-medium text-ink">{formatDate(indicador.data_fim)}</span>
        </span>
      </div>

      {indicador.objetivo && <p className="text-xs text-secondary">{indicador.objetivo}</p>}

      {isConcluido && (
        <div className="flex flex-wrap items-center gap-2">
          {indicador.concluido_em && (
            <p className="text-xs text-success">✓ Concluído em {formatDate(indicador.concluido_em)}</p>
          )}
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
            Atingimento: {formatPercent(indicador.atendimento)}
          </span>
        </div>
      )}

      <div className="mt-auto flex flex-wrap justify-end gap-1.5 border-t border-border pt-2">
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

      {temDetalhes && (
        <IndicadorDetalhesModal
          isOpen={detalhesAbertos}
          onClose={() => setDetalhesAbertos(false)}
          indicador={indicador}
        />
      )}
    </div>
  );
}
