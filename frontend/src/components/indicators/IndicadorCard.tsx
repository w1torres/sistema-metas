import { useState } from 'react';
import type { Indicador } from '../../types';
import Badge from '../common/Badge';
import Button from '../common/Button';
import IndicadorDetalhesModal from './IndicadorDetalhesModal';
import SolicitarConclusaoModal from './SolicitarConclusaoModal';
import { formatDate, formatFileSize, formatPercent } from '../../utils/formatters';
import { getSafraForDate } from '../../utils/safra';
import { formatMes, listarMesesDoPeriodo, mesAtual } from '../../utils/meses';

interface IndicadorCardProps {
  indicador: Indicador;
  notaConclusao?: string | null;
  observacaoAprovacao?: string | null;
  percentualGestorAtingido?: number | null;
  onAbrirSolicitacao: () => void;
  onCancelarSolicitacao: () => void;
  onDesfazerConclusao: () => void;
  onAnexar: () => void;
  onHistorico: () => void;
  onSolicitarMes?: (mes: string, nota: string) => void;
}

const STATUS_MES_STYLE: Record<string, string> = {
  PENDENTE: 'bg-gray-100 text-secondary',
  AGUARDANDO_GESTOR: 'bg-cyan-100 text-cyan-800',
  APROVADO: 'bg-success/15 text-success',
};

export default function IndicadorCard({
  indicador,
  notaConclusao,
  observacaoAprovacao,
  percentualGestorAtingido,
  onAbrirSolicitacao,
  onCancelarSolicitacao,
  onDesfazerConclusao,
  onAnexar,
  onHistorico,
  onSolicitarMes,
}: IndicadorCardProps) {
  const { status } = indicador;
  const isConcluido = status === 'CONCLUIDO';
  const isPendente = status === 'AGUARDANDO_APROVACAO_GESTOR' || status === 'AGUARDANDO_APROVACAO_RH';
  const isMensal = indicador.periodicidade === 'MENSAL';
  const safra = getSafraForDate(indicador.data_inicio);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [mesSolicitando, setMesSolicitando] = useState<string | null>(null);
  const temDetalhes = Boolean(
    indicador.pilar ||
      indicador.meta ||
      indicador.formaMedicao ||
      indicador.evidenciaObrigatoria ||
      indicador.tabelaAtingimento?.length,
  );

  const meses = isMensal ? listarMesesDoPeriodo(indicador.data_inicio, indicador.data_fim) : [];
  const mesCorrente = mesAtual();

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

      {/* Só a descrição (objetivo) — "detalhamento" pode trazer texto técnico
          concatenado no import (Tabela de Atingimento, Observação/Sinalização),
          que fica só em "Ver mais informações" (IndicadorDetalhesModal). */}
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

      {isConcluido && observacaoAprovacao && (
        <p className="rounded-md bg-success/10 p-2 text-xs text-secondary">
          <span className="font-medium text-ink">Observação da aprovação: </span>
          {observacaoAprovacao}
        </p>
      )}

      {status === 'AGUARDANDO_APROVACAO_GESTOR' && (
        <p className="text-xs text-cyan-800">⏳ Aguardando avaliação do gestor do departamento.</p>
      )}
      {status === 'AGUARDANDO_APROVACAO_RH' && (
        <p className="text-xs text-primary">
          ⏳ Aprovado pelo gestor
          {percentualGestorAtingido != null && (
            <> com {formatPercent(percentualGestorAtingido)} de atingimento</>
          )}{' '}
          — aguardando avaliação final do RH.
        </p>
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

      {isMensal && !isConcluido && (
        <div className="rounded-md border border-border p-2">
          <p className="mb-1.5 text-xs font-semibold uppercase text-secondary">Registro Mensal</p>
          <div className="flex flex-wrap gap-1.5">
            {meses.map((mes) => {
              const registro = indicador.registrosMensais?.find((r) => r.mes === mes);
              const statusMes = registro?.status ?? 'PENDENTE';
              const podeEnviar = statusMes === 'PENDENTE' && mes <= mesCorrente && onSolicitarMes;
              return (
                <button
                  key={mes}
                  type="button"
                  disabled={!podeEnviar}
                  onClick={podeEnviar ? () => setMesSolicitando(mes) : undefined}
                  title={
                    statusMes === 'APROVADO'
                      ? 'Aprovado pelo gestor'
                      : statusMes === 'AGUARDANDO_GESTOR'
                        ? 'Aguardando avaliação do gestor'
                        : podeEnviar
                          ? 'Clique para enviar este mês'
                          : 'Ainda não chegou este mês'
                  }
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_MES_STYLE[statusMes]} ${
                    podeEnviar ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  }`}
                >
                  {formatMes(mes)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        {isMensal ? (
          isConcluido ? (
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
            <span className="mr-auto text-sm text-secondary">Envie cada mês individualmente acima</span>
          )
        ) : status === 'EM_ANDAMENTO' || status === 'ATRASADO' ? (
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

        {!isMensal && status === 'AGUARDANDO_APROVACAO_GESTOR' && (
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

      {onSolicitarMes && (
        <SolicitarConclusaoModal
          isOpen={!!mesSolicitando}
          onClose={() => setMesSolicitando(null)}
          indicadorNome={mesSolicitando ? `${indicador.nome} — ${formatMes(mesSolicitando)}` : ''}
          onConfirmar={(nota) => {
            if (mesSolicitando) onSolicitarMes(mesSolicitando, nota);
            setMesSolicitando(null);
          }}
        />
      )}

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
