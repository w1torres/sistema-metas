import { useState } from 'react';
import toast from 'react-hot-toast';
import { usePPRStore } from '../../store/pprStore';
import Button from '../common/Button';
import type { PPRFaixa } from '../../types';

interface LinhaRascunho {
  faixaMin: string;
  faixaMax: string;
  multiplo: string;
}

interface CargoFaixasGroupProps {
  cargo: string;
  faixas: PPRFaixa[];
  isEditing: boolean;
  editDisabled: boolean;
  onIniciarEdicao: () => void;
  onFinalizarEdicao: () => void;
}

function toRascunho(faixas: PPRFaixa[]): LinhaRascunho[] {
  return faixas.map((f) => ({
    faixaMin: String(f.faixaMin),
    faixaMax: String(f.faixaMax),
    multiplo: String(f.multiplo),
  }));
}

const inputClass = 'w-20 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary';

export default function CargoFaixasGroup({
  cargo,
  faixas,
  isEditing,
  editDisabled,
  onIniciarEdicao,
  onFinalizarEdicao,
}: CargoFaixasGroupProps) {
  const substituirFaixasDoCargo = usePPRStore((s) => s.substituirFaixasDoCargo);
  const [rascunho, setRascunho] = useState<LinhaRascunho[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  function handleIniciar() {
    setRascunho(toRascunho(faixas));
    setErro(null);
    onIniciarEdicao();
  }

  function handleCancelar() {
    setErro(null);
    onFinalizarEdicao();
  }

  function handleAdicionarLinha() {
    setRascunho((r) => [...r, { faixaMin: '', faixaMax: '', multiplo: '' }]);
  }

  function handleRemoverLinha(idx: number) {
    setRascunho((r) => r.filter((_, i) => i !== idx));
  }

  function handleAlterarLinha(idx: number, campo: keyof LinhaRascunho, valor: string) {
    setRascunho((r) => r.map((linha, i) => (i === idx ? { ...linha, [campo]: valor } : linha)));
  }

  function handleSalvar() {
    const parsed = rascunho.map((l) => ({
      faixaMin: Number(l.faixaMin),
      faixaMax: Number(l.faixaMax),
      multiplo: Number(l.multiplo),
    }));

    const resultado = substituirFaixasDoCargo(cargo, parsed);
    if (!resultado.ok) {
      setErro(resultado.error);
      return;
    }
    toast.success(
      parsed.length === 0 ? `Cargo ${cargo} removido da Tabela PPR.` : `Faixas de ${cargo} atualizadas.`,
    );
    setErro(null);
    onFinalizarEdicao();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">{cargo}</p>
        {!isEditing && (
          <button
            type="button"
            onClick={handleIniciar}
            disabled={editDisabled}
            className="text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-secondary disabled:no-underline"
          >
            Editar
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-secondary">
              <th className="px-4 py-2">Faixa Mínima (%)</th>
              <th className="px-4 py-2">Faixa Máxima (%)</th>
              <th className="px-4 py-2">Múltiplo</th>
              {isEditing && <th className="px-4 py-2">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {isEditing
              ? rascunho.map((linha, idx) => (
                  <tr key={idx} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={linha.faixaMin}
                        onChange={(e) => handleAlterarLinha(idx, 'faixaMin', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={linha.faixaMax}
                        onChange={(e) => handleAlterarLinha(idx, 'faixaMax', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.05"
                        value={linha.multiplo}
                        onChange={(e) => handleAlterarLinha(idx, 'multiplo', e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemoverLinha(idx)}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))
              : faixas.map((faixa) => (
                  <tr key={faixa.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-ink">{faixa.faixaMin}%</td>
                    <td className="px-4 py-2 text-ink">{faixa.faixaMax >= 999 ? '100%+' : `${faixa.faixaMax}%`}</td>
                    <td className="px-4 py-2 font-semibold text-primary">{faixa.multiplo}x</td>
                  </tr>
                ))}
            {isEditing && rascunho.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-xs text-secondary">
                  Nenhuma faixa — clique em "Concluir" para remover este cargo, ou "+ Nova faixa" para adicionar uma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <div className="flex items-center justify-between">
            <Button variant="secondary" size="sm" onClick={handleAdicionarLinha}>
              + Nova faixa
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancelar}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSalvar}>
                Concluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
