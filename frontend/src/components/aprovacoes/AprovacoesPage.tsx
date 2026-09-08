import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import HistoricoModal from '../indicators/HistoricoModal';
import RejeitarModal from './RejeitarModal';
import Button from '../common/Button';
import { formatDate, formatFileSize } from '../../utils/formatters';
import type { Indicador } from '../../types';

type Etapa = 'GESTOR' | 'RH';

interface FilaItemProps {
  indicador: Indicador;
  nota: string | null;
  mostrarDepartamento: boolean;
  onAprovar: () => void;
  onRejeitar: () => void;
  onVerHistorico: () => void;
}

function FilaItem({ indicador, nota, mostrarDepartamento, onAprovar, onRejeitar, onVerHistorico }: FilaItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{indicador.nome}</p>
          <p className="text-xs text-secondary">
            {indicador.responsavel}
            {mostrarDepartamento ? ` · ${indicador.departamento}` : ''} · Peso: {indicador.peso}% · Prazo:{' '}
            {formatDate(indicador.data_fim)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={onAprovar}>
            Aprovar
          </Button>
          <Button variant="danger" size="sm" onClick={onRejeitar}>
            Rejeitar
          </Button>
        </div>
      </div>

      {nota && (
        <p className="rounded-md bg-gray-50 p-2 text-xs text-secondary">
          <span className="font-medium text-ink">Observação do colaborador: </span>
          {nota}
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

      <div>
        <Button variant="ghost" size="sm" onClick={onVerHistorico}>
          Ver Histórico
        </Button>
      </div>
    </div>
  );
}

export default function AprovacoesPage() {
  const user = useAuthStore((s) => s.user);
  const indicators = useIndicatorStore((s) => s.indicators);
  const { aprovarGestor, rejeitarGestor, aprovarRH, rejeitarRH, notaConclusaoAtual, historyFor } = useIndicatorStore();
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [rejeitando, setRejeitando] = useState<{ indicador: Indicador; etapa: Etapa } | null>(null);

  if (!user) return null;

  const isRHouAdmin = user.role === 'GERENTE_RH' || user.role === 'ADMIN';
  const isGestorDepartamento = user.role === 'GERENTE_DEPARTAMENTO';

  const pendentesGestor = indicators.filter(
    (i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR' && (isRHouAdmin || i.departamento_id === user.departamento_id),
  );
  const pendentesRH = isRHouAdmin ? indicators.filter((i) => i.status === 'AGUARDANDO_APROVACAO_RH') : [];

  const currentUser = user;
  const indicadorHistorico = indicators.find((i) => i.id === historicoId) ?? null;

  const handleAprovarGestor = (indicador: Indicador) => {
    aprovarGestor(indicador.id, currentUser.id, currentUser.nome);
    toast.success(`Conclusão de "${indicador.nome}" aprovada — enviada para avaliação final do RH.`);
  };

  const handleAprovarRH = (indicador: Indicador) => {
    aprovarRH(indicador.id, currentUser.id, currentUser.nome);
    toast.success(`"${indicador.nome}" concluído! O peso já conta para o colaborador.`);
  };

  const handleConfirmarRejeicao = (motivo: string) => {
    if (!rejeitando) return;
    const { indicador, etapa } = rejeitando;
    const motivoFinal =
      motivo.trim() || (etapa === 'GESTOR' ? 'Rejeitado pelo gestor do departamento' : 'Rejeitado pelo RH na avaliação final');

    if (etapa === 'GESTOR') {
      rejeitarGestor(indicador.id, currentUser.id, currentUser.nome, motivoFinal);
    } else {
      rejeitarRH(indicador.id, currentUser.id, currentUser.nome, motivoFinal);
    }
    toast.success('Solicitação rejeitada — o colaborador foi notificado.');
    setRejeitando(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Aprovações</h1>
        <p className="text-sm text-secondary">
          {isGestorDepartamento
            ? 'Indicadores do seu departamento que colaboradores marcaram como concluídos, aguardando sua avaliação.'
            : 'Fluxo de conclusão: o gestor do departamento avalia primeiro, depois o RH dá a avaliação final — só então o peso conta para o colaborador.'}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">
          Aguardando avaliação do gestor {pendentesGestor.length > 0 && `(${pendentesGestor.length})`}
        </h2>
        {pendentesGestor.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-white p-6 text-center text-sm text-secondary">
            Nenhuma solicitação pendente.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendentesGestor.map((indicador) => (
              <FilaItem
                key={indicador.id}
                indicador={indicador}
                nota={notaConclusaoAtual(indicador.id)}
                mostrarDepartamento={isRHouAdmin}
                onAprovar={() => handleAprovarGestor(indicador)}
                onRejeitar={() => setRejeitando({ indicador, etapa: 'GESTOR' })}
                onVerHistorico={() => setHistoricoId(indicador.id)}
              />
            ))}
          </div>
        )}
      </div>

      {isRHouAdmin && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">
            Aguardando avaliação final do RH {pendentesRH.length > 0 && `(${pendentesRH.length})`}
          </h2>
          {pendentesRH.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-white p-6 text-center text-sm text-secondary">
              Nenhuma solicitação pendente.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendentesRH.map((indicador) => (
                <FilaItem
                  key={indicador.id}
                  indicador={indicador}
                  nota={notaConclusaoAtual(indicador.id)}
                  mostrarDepartamento
                  onAprovar={() => handleAprovarRH(indicador)}
                  onRejeitar={() => setRejeitando({ indicador, etapa: 'RH' })}
                  onVerHistorico={() => setHistoricoId(indicador.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <HistoricoModal
        isOpen={!!indicadorHistorico}
        onClose={() => setHistoricoId(null)}
        indicadorNome={indicadorHistorico?.nome ?? ''}
        eventos={indicadorHistorico ? historyFor(indicadorHistorico.id) : []}
      />

      <RejeitarModal
        isOpen={!!rejeitando}
        onClose={() => setRejeitando(null)}
        indicadorNome={rejeitando?.indicador.nome ?? ''}
        onConfirmar={handleConfirmarRejeicao}
      />
    </div>
  );
}
