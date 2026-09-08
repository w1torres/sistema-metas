import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { usePPRStore } from '../../store/pprStore';
import { useCargoStore } from '../../store/cargoStore';
import type { PPRFaixa } from '../../types';

interface FaixaPPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  faixa: PPRFaixa | null;
  cargoInicial?: string;
}

interface FormState {
  cargo: string;
  novoCargo: string;
  faixaMin: string;
  faixaMax: string;
  multiplo: string;
}

function toFormState(faixa: PPRFaixa | null, cargoInicial?: string): FormState {
  if (!faixa) {
    return { cargo: cargoInicial ?? '', novoCargo: '', faixaMin: '', faixaMax: '', multiplo: '' };
  }
  return {
    cargo: faixa.cargo,
    novoCargo: '',
    faixaMin: String(faixa.faixaMin),
    faixaMax: String(faixa.faixaMax),
    multiplo: String(faixa.multiplo),
  };
}

export default function FaixaPPRModal({ isOpen, onClose, faixa, cargoInicial }: FaixaPPRModalProps) {
  const cargos = useCargoStore((s) => s.cargos);
  const findOrCreateCargo = useCargoStore((s) => s.findOrCreate);
  const addFaixa = usePPRStore((s) => s.addFaixa);
  const updateFaixa = usePPRStore((s) => s.updateFaixa);

  const [form, setForm] = useState<FormState>(toFormState(faixa, cargoInicial));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toFormState(faixa, cargoInicial));
    setError(null);
  }, [faixa, cargoInicial, isOpen]);

  function handleSubmit() {
    const cargoFinal = form.novoCargo.trim() ? findOrCreateCargo(form.novoCargo.trim()) : form.cargo;
    if (!cargoFinal) {
      setError('Selecione ou informe um cargo');
      return;
    }

    const input = {
      cargo: cargoFinal,
      faixaMin: Number(form.faixaMin),
      faixaMax: Number(form.faixaMax),
      multiplo: Number(form.multiplo),
    };

    const result = faixa ? updateFaixa(faixa.id, input) : addFaixa(input);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    toast.success(faixa ? 'Faixa atualizada.' : 'Faixa cadastrada.');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={faixa ? 'Editar Faixa de PPR' : 'Nova Faixa de PPR'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Cargo"
          value={form.cargo}
          onChange={(value) => setForm((f) => ({ ...f, cargo: value, novoCargo: value ? '' : f.novoCargo }))}
          placeholder="Selecione..."
          options={cargos.map((c) => ({ value: c, label: c }))}
        />
        <Input
          label="Ou cadastrar novo cargo"
          value={form.novoCargo}
          onChange={(e) => setForm((f) => ({ ...f, novoCargo: e.target.value, cargo: e.target.value ? '' : f.cargo }))}
          placeholder="Ex: SUPERVISOR"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Faixa Mínima (%)"
            type="number"
            min={0}
            required
            value={form.faixaMin}
            onChange={(e) => setForm((f) => ({ ...f, faixaMin: e.target.value }))}
          />
          <Input
            label="Faixa Máxima (%)"
            type="number"
            min={0}
            required
            value={form.faixaMax}
            onChange={(e) => setForm((f) => ({ ...f, faixaMax: e.target.value }))}
          />
        </div>

        <Input
          label="Múltiplo do PPR"
          type="number"
          min={0}
          step="0.05"
          required
          value={form.multiplo}
          onChange={(e) => setForm((f) => ({ ...f, multiplo: e.target.value }))}
          placeholder="Ex: 1.5"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <p className="text-xs text-secondary">
          Colaboradores com percentual ponderado dentro desta faixa recebem este múltiplo no cálculo do PPR.
        </p>
      </div>
    </Modal>
  );
}
