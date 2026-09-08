import Modal from '../common/Modal';
import type { IndicadorUpdate } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface HistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicadorNome: string;
  eventos: IndicadorUpdate[];
}

const TIPO_LABELS: Record<IndicadorUpdate['tipo_alteracao'], string> = {
  CRIACAO: 'Indicador criado',
  EDICAO: 'Indicador editado',
  CONCLUSAO: 'Alteração de conclusão',
  REATRIBUICAO: 'Responsável reatribuído',
  SOLICITACAO_CONCLUSAO: 'Colaborador solicitou conclusão',
  APROVACAO_GESTOR: 'Aprovado pelo gestor do departamento',
  APROVACAO_RH: 'Aprovado pelo RH (avaliação final)',
  REJEICAO: 'Solicitação rejeitada',
};

export default function HistoricoModal({ isOpen, onClose, indicadorNome, eventos }: HistoricoModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Histórico — ${indicadorNome}`}>
      {eventos.length === 0 ? (
        <p className="text-sm text-secondary">Nenhum evento registrado ainda.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {eventos.map((evento) => (
            <li key={evento.id} className="border-l-2 border-primary/30 pl-4">
              <p className="text-sm font-medium text-ink">{TIPO_LABELS[evento.tipo_alteracao]}</p>
              {evento.motivo && <p className="text-sm text-secondary">{evento.motivo}</p>}
              {evento.campo_alterado && (
                <p className="text-xs text-secondary">Campo: {evento.campo_alterado}</p>
              )}
              <p className="mt-1 text-xs text-secondary">
                {formatDateTime(evento.criado_em)} · por {evento.usuario_nome}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
