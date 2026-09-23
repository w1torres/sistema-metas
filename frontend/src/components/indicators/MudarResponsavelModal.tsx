import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, Textarea } from '../common/Input';
import type { Indicador } from '../../types';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

interface MudarResponsavelModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicador: Indicador | null;
}

export default function MudarResponsavelModal({ isOpen, onClose, indicador }: MudarResponsavelModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const reatribuir = useIndicatorStore((s) => s.reatribuir);
  const users = useUserStore((s) => s.users);

  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [notificar, setNotificar] = useState(true);

  if (!indicador) return null;

  const candidatos = users.filter(
    (u) =>
      u.ativo &&
      !!u.email && // sem email não tem acesso ao sistema ainda — não pode ser responsável
      u.id !== indicador.usuario_responsavel_id &&
      (u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.toLowerCase().includes(busca.toLowerCase())),
  );

  function handleClose() {
    setBusca('');
    setSelecionado(null);
    setMotivo('');
    setNotificar(true);
    onClose();
  }

  async function handleReatribuir() {
    if (!currentUser || !indicador) return;
    const novoResponsavel = users.find((u) => u.id === selecionado);
    if (!novoResponsavel) return;

    try {
      await reatribuir(indicador.id, novoResponsavel.id, motivo || undefined);
      toast.success(
        notificar
          ? `Indicador reatribuído para ${novoResponsavel.nome}. Notificação enviada (simulada).`
          : `Indicador reatribuído para ${novoResponsavel.nome}.`,
      );
      handleClose();
    } catch {
      toast.error('Não foi possível reatribuir o indicador.');
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reatribuir Indicador"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleReatribuir} disabled={!selecionado}>
            Reatribuir
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-secondary">Indicador</p>
          <p className="text-sm text-ink">{indicador.nome}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-secondary">Responsável Atual</p>
          <p className="text-sm text-ink">{indicador.responsavel}</p>
        </div>

        <Input label="Buscar colaborador" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou email..." />

        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
          {candidatos.length === 0 && <p className="p-2 text-sm text-secondary">Nenhum colaborador encontrado.</p>}
          {candidatos.map((u) => (
            <label
              key={u.id}
              className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm hover:bg-gray-50"
            >
              <input
                type="radio"
                name="novo-responsavel"
                checked={selecionado === u.id}
                onChange={() => setSelecionado(u.id)}
                className="h-4 w-4 text-primary focus:ring-primary"
              />
              {u.nome} <span className="text-secondary">({u.email})</span>
            </label>
          ))}
        </div>

        <Textarea
          label="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          placeholder="Ex: Saída do responsável, férias, mudança de área..."
        />

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={notificar}
            onChange={(e) => setNotificar(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          Notificar novo responsável
        </label>

        <p className="text-xs text-secondary">
          Aviso: o histórico do responsável anterior será mantido e registrado em auditoria.
        </p>
      </div>
    </Modal>
  );
}
