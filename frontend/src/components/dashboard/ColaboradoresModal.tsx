import Modal from '../common/Modal';
import ColaboradorCard from './ColaboradorCard';

export interface ColaboradorResumo {
  id: string;
  nome: string;
  cargo: string;
  total: number;
  pendentes: number;
  emAprovacao: number;
  concluidos: number;
}

interface ColaboradoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  departamentoNome: string;
  colaboradores: ColaboradorResumo[];
  onVerIndicadores: (nome: string) => void;
}

export default function ColaboradoresModal({
  isOpen,
  onClose,
  departamentoNome,
  colaboradores,
  onVerIndicadores,
}: ColaboradoresModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Colaboradores — ${departamentoNome}`} maxWidthClassName="max-w-2xl">
      {colaboradores.length === 0 ? (
        <p className="text-sm text-secondary">Nenhum colaborador com indicadores neste departamento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {colaboradores.map((c) => (
            <ColaboradorCard
              key={c.id}
              nome={c.nome}
              cargo={c.cargo}
              total={c.total}
              pendentes={c.pendentes}
              emAprovacao={c.emAprovacao}
              concluidos={c.concluidos}
              onVerIndicadores={() => onVerIndicadores(c.nome)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
