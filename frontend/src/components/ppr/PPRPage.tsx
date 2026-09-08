import { useMemo, useState } from 'react';
import { usePPRStore } from '../../store/pprStore';
import CargoFaixasGroup from './CargoFaixasGroup';
import FaixaPPRModal from './FaixaPPRModal';
import Button from '../common/Button';
import type { PPRFaixa } from '../../types';

export default function PPRPage() {
  const faixas = usePPRStore((s) => s.faixas);
  const [criando, setCriando] = useState(false);
  const [editandoCargo, setEditandoCargo] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tabela PPR</h1>
          <p className="text-sm text-secondary">
            Múltiplos pagos por cargo, de acordo com o percentual do peso concluído pelo colaborador (soma do peso
            dos indicadores concluídos, dividido pelo peso total). Clique em "Editar" para ajustar todas as faixas
            de um cargo de uma vez.
          </p>
        </div>
        <Button onClick={() => setCriando(true)}>+ Nova Faixa</Button>
      </div>

      {porCargo.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhuma faixa cadastrada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {porCargo.map((grupo) => (
            <CargoFaixasGroup
              key={grupo.cargo}
              cargo={grupo.cargo}
              faixas={grupo.faixas}
              isEditing={editandoCargo === grupo.cargo}
              editDisabled={editandoCargo !== null && editandoCargo !== grupo.cargo}
              onIniciarEdicao={() => setEditandoCargo(grupo.cargo)}
              onFinalizarEdicao={() => setEditandoCargo(null)}
            />
          ))}
        </div>
      )}

      <FaixaPPRModal isOpen={criando} onClose={() => setCriando(false)} faixa={null} />
    </div>
  );
}
