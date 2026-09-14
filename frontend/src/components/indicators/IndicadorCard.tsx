import { useState } from 'react';
import type { Indicador } from '../../types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import IndicadorDetalhesModal from './IndicadorDetalhesModal';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { getSafraForDate } from '../../utils/safra';

interface IndicadorCardProps {
  indicador: Indicador;
  notaConclusao?: string | null;
  onAbrirSolicitacao: () => void;
  onCancelarSolicitacao: () => void;
  onDesfazerConclusao: () => void;
  onAnexar: () => void;
  onHistorico: () => void;
}

export default function IndicadorCard({
  indicador,
  notaConclusao,
  onAbrirSolicitacao,
  onCancelarSolicitacao,
  onDesfazerConclusao,
  onAnexar,
  onHistorico,
}: IndicadorCardProps) {
  const { status } = indicador;
  const isConcluido = status === 'CONCLUIDO';
  const isPendente = status === 'AGUARDANDO_APROVACAO_GESTOR' || status === 'AGUARDANDO_APROVACAO_RH';
  const safra = getSafraForDate(indicador.data_inicio);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const temDetalhes = Boolean(
    indicador.pilar ||
      indicador.meta ||
      indicador.formaMedicao ||
      indicador.evidenciaObrigatoria ||
      indicador.tabelaAtingimento?.length,
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div
        className={temDetalhes ? 'flex items-start justify-between gap-2 cursor-pointer' : 'flex items-start justify-between gap-2'}
        role={temDetalhes ? 'button' : undefined}
        tabIndex={temDetalhes ? 0 : undefined}
        onClick={temDetalhes ? () => setDetalhesAbertos(true) : undefined}
        onKeyDown={
          temDetalhes
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDetalhesAbertos(true);
                }
              }
            : undefined
        }
        title={temDetalhes ? 'Ver mais informações do indicador' : undefined}
      >
        <h3 className={temDetalhes ? 'text-sm font-semibold text-ink hover:underline' : 'text-sm font-semibold text-ink'}>
          {indicador.nome}
        </h3>
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

      {indicador.detalhamento && <p className="text-xs text-secondary">{indicador.detalhamento}</p>}

      {isConcluido && indicador.concluido_em && (
        <p className="text-xs text-success">✓ Concluído em {formatDate(indicador.concluido_em)}</p>
      )}

      {status === 'AGUARDANDO_APROVACAO_GESTOR' && (
        <p className="text-xs text-cyan-800">⏳ Aguardando avaliação do gestor do departamento.</p>
      )}
      {status === 'AGUARDANDO_APROVACAO_RH' && (
        <p className="text-xs text-primary">⏳ Aprovado pelo gestor — aguardando avaliação final do RH.</p>
      )}
      {isPendente && notaConclusao && (
        <p className="rounded-md bg-gray-50 p-2 text-xs text-secondary">
          <span className="font-medium text-ink">Sua observação: </span>
          {notaConclusao}
        </p>
      )}

      {indicador.anexos.length > 0 && (
        <ul className="flex flex-col gap-1">
          {indicador.anexos.map((anexo) => (
            <li key={anexo.id} className="flex items-center gap-1.5 text-xs text-secondary">
              📎 {anexo.nome_arquivo} <span className="text-secondary/70">({formatFileSize(anexo.tamanho_bytes)})</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {status === 'EM_ANDAMENTO' || status === 'ATRASADO' ? (
          <label className="mr-auto flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={false}
              onChange={onAbrirSolicitacao}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Marcar como Concluído
          </label>
        ) : isConcluido ? (
          <label className="mr-auto flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked
              onChange={onDesfazerConclusao}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Remover marca
          </label>
        ) : (
          <span className="mr-auto text-sm text-secondary">Aguardando aprovação</span>
        )}

        {status === 'AGUARDANDO_APROVACAO_GESTOR' && (
          <button type="button" onClick={onCancelarSolicitacao} className="text-xs font-medium text-danger hover:underline">
            Cancelar solicitação
          </button>
        )}

        <Button variant="secondary" size="sm" onClick={onAnexar}>
          + Anexar Documento
        </Button>

        <Button variant="ghost" size="sm" onClick={onHistorico}>
          Ver Histórico
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
