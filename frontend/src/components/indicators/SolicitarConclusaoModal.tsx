import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Textarea } from '../common/Input';

interface SolicitarConclusaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicadorNome: string;
  onConfirmar: (nota: string) => void;
}

export default function SolicitarConclusaoModal({
  isOpen,
  onClose,
  indicadorNome,
  onConfirmar,
}: SolicitarConclusaoModalProps) {
  const [nota, setNota] = useState('');

  function handleClose() {
    setNota('');
    onClose();
  }

  function handleConfirmar() {
    onConfirmar(nota);
    setNota('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Solicitar Conclusão"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>Enviar para Aprovação</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink">{indicadorNome}</p>
        <Textarea
          label="O que foi feito para concluir este indicador?"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={4}
          placeholder="Descreva o que foi realizado — isso ajuda o gestor e o RH a avaliar sua solicitação."
        />
        <p className="text-xs text-secondary">
          Essa informação, os anexos e o histórico do indicador ficam visíveis para o gestor do departamento e para
          o RH durante a avaliação.
        </p>
      </div>
    </Modal>
  );
}
