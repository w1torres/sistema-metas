import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { usePPRStore } from '../../store/pprStore';
import FaixaPPRModal from './FaixaPPRModal';
import Button from '../common/Button';
import type { PPRFaixa } from '../../types';

export default function PPRPage() {
  const faixas = usePPRStore((s) => s.faixas);
  const deleteFaixa = usePPRStore((s) => s.deleteFaixa);

  const [editando, setEditando] = useState<PPRFaixa | null>(null);
  const [criando, setCriando] = useState(false);
  const [cargoParaNovaFaixa, setCargoParaNovaFaixa] = useState<string | undefined>(undefined);

  const porCargo = useMemo(() => {
    const grupos = new Map<string, PPRFaixa[]>();
    faixas.forEach((f) => {
      const lista = grupos.get(f.cargo) ?? [];
      lista.push(f);
      grupos.set(f.cargo, lista);
    });
    return Array.from(grupos.entries())
      .map(([cargo, lista]) => ({ cargo, faixas: lista.sort((a, b) => a.faixaMin - b.faixaMin) }))
      .sort((a, b) => a.cargo.localeCompare(b.cargo));
  }, [faixas]);

  function handleDelete(faixa: PPRFaixa) {
    if (!window.confirm(`Remover a faixa ${faixa.faixaMin}%–${faixa.faixaMax}% de ${faixa.cargo}?`)) return;
    deleteFaixa(faixa.id);
    toast.success('Faixa removida.');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tabela PPR</h1>
          <p className="text-sm text-secondary">
            Múltiplos pagos por cargo, de acordo com o percentual do peso concluído pelo colaborador (soma do peso
            dos indicadores concluídos, dividido pelo peso total).
          </p>
        </div>
        <Button
          onClick={() => {
            setCargoParaNovaFaixa(undefined);
            setCriando(true);
          }}
        >
          + Nova Faixa
        </Button>
      </div>

      {porCargo.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhuma faixa cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {porCargo.map((grupo) => (
            <div key={grupo.cargo} className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-ink">{grupo.cargo}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCargoParaNovaFaixa(grupo.cargo);
                    setCriando(true);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Adicionar faixa para este cargo
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-secondary">
                      <th className="px-4 py-2">Faixa de Atingimento</th>
                      <th className="px-4 py-2">Múltiplo</th>
                      <th className="px-4 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.faixas.map((faixa) => (
                      <tr key={faixa.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 text-ink">
                          {faixa.faixaMin}% – {faixa.faixaMax >= 999 ? '100%+' : `${faixa.faixaMax}%`}
                        </td>
                        <td className="px-4 py-2 font-semibold text-primary">{faixa.multiplo}x</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setEditando(faixa)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(faixa)}
                              className="text-xs font-medium text-danger hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <FaixaPPRModal isOpen={!!editando} onClose={() => setEditando(null)} faixa={editando} />
      <FaixaPPRModal
        isOpen={criando}
        onClose={() => setCriando(false)}
        faixa={null}
        cargoInicial={cargoParaNovaFaixa}
      />
    </div>
  );
}
