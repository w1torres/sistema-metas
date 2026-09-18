import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input } from '../common/Input';
import { useBonificacaoStore } from '../../store/bonificacaoStore';
import type { Bonificacao } from '../../types';

interface BonificacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonificacao: Bonificacao | null;
}

function mesAtualISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function BonificacaoModal({ isOpen, onClose, bonificacao }: BonificacaoModalProps) {
  const isEditing = !!bonificacao;
  const createBonificacao = useBonificacaoStore((s) => s.createBonificacao);
  const updateBonificacao = useBonificacaoStore((s) => s.updateBonificacao);

  const [fornecedor, setFornecedor] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [mesReferencia, setMesReferencia] = useState(mesAtualISO());
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setFornecedor(bonificacao?.fornecedor ?? '');
    setValorTotal(bonificacao ? String(bonificacao.valorTotal) : '');
    setMesReferencia(bonificacao?.mesReferencia ?? mesAtualISO());
    setErros({});
  }, [isOpen, bonificacao]);

  async function handleSubmit() {
    const valor = Number(valorTotal.replace(',', '.'));
    const nextErros: Record<string, string> = {};
    if (!fornecedor.trim()) nextErros.fornecedor = 'Informe o fornecedor';
    if (!valorTotal || Number.isNaN(valor) || valor <= 0) nextErros.valorTotal = 'Informe um valor total válido';
    if (!/^\d{4}-\d{2}$/.test(mesReferencia)) nextErros.mesReferencia = 'Informe o mês de referência';

    if (Object.keys(nextErros).length > 0) {
      setErros(nextErros);
      return;
    }

    setSalvando(true);
    try {
      if (isEditing) {
        await updateBonificacao(bonificacao.id, { fornecedor, valorTotal: valor, mesReferencia });
        toast.success('Bonificação atualizada.');
      } else {
        await createBonificacao({ fornecedor, valorTotal: valor, mesReferencia });
        toast.success('Bonificação cadastrada. Agora adicione os colaboradores participantes.');
      }
      onClose();
    } catch {
      toast.error('Não foi possível salvar a bonificação.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Bonificação' : 'Nova Bonificação'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={salvando}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Fornecedor"
          required
          value={fornecedor}
          onChange={(e) => setFornecedor(e.target.value)}
          error={erros.fornecedor}
        />
        <Input
          label="Valor Total (R$)"
          required
          inputMode="decimal"
          value={valorTotal}
          onChange={(e) => setValorTotal(e.target.value)}
          error={erros.valorTotal}
        />
        <Input
          label="Mês de Referência"
          type="month"
          required
          value={mesReferencia}
          onChange={(e) => setMesReferencia(e.target.value)}
          error={erros.mesReferencia}
        />
      </div>
    </Modal>
  );
}
