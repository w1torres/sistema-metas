import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Textarea } from '../common/Input';

interface RejeitarModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicadorNome: string;
  onConfirmar: (motivo: string) => void;
}

export default function RejeitarModal({ isOpen, onClose, indicadorNome, onConfirmar }: RejeitarModalProps) {
  const [motivo, setMotivo] = useState('');

  function handleClose() {
    setMotivo('');
    onClose();
  }

  function handleConfirmar() {
    onConfirmar(motivo);
    setMotivo('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rejeitar Solicitação"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmar}>
            Rejeitar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink">{indicadorNome}</p>
        <Textarea
          label="Motivo da rejeição"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={4}
          placeholder="Explique por que a solicitação está sendo rejeitada — o colaborador verá esta mensagem."
        />
        <p className="text-xs text-secondary">
          O indicador volta para o colaborador como "Em Andamento" e ele poderá corrigir e reenviar.
        </p>
      </div>
    </Modal>
  );
}
