import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTrilhaStore } from '../../store/trilhaStore';
import Button from '../common/Button';
import type { Trilha } from '../../types';

interface TrilhaPilaresTableProps {
  trilha: Trilha;
}

export default function TrilhaPilaresTable({ trilha }: TrilhaPilaresTableProps) {
  const substituirPesosDaTrilha = useTrilhaStore((s) => s.substituirPesosDaTrilha);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, string>>({});

  function handleIniciar() {
    const inicial: Record<string, string> = {};
    trilha.pilares.forEach((p) => {
      inicial[p.pilar] = String(p.peso);
    });
    setRascunho(inicial);
    setEditando(true);
  }

  function handleCancelar() {
    setEditando(false);
  }

  async function handleSalvar() {
    const pesos = trilha.pilares.map((p) => ({ pilar: p.pilar, peso: Number(rascunho[p.pilar]) }));
    setSalvando(true);
    const resultado = await substituirPesosDaTrilha(trilha.id, pesos);
    setSalvando(false);
    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }
    toast.success('Pesos dos pilares atualizados.');
    setEditando(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          Pilares por {trilha.nome} — {trilha.descricao}
        </p>
        {editando ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancelar} disabled={salvando}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSalvar} loading={salvando}>
              Salvar
            </Button>
          </div>
        ) : (
          <button type="button" onClick={handleIniciar} className="text-xs font-medium text-primary hover:underline">
            Editar
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-secondary">
              <th className="px-4 py-2">Pilar</th>
              <th className="px-4 py-2">Peso</th>
            </tr>
          </thead>
          <tbody>
            {trilha.pilares.map((p) => (
              <tr key={p.pilar} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-ink">{p.pilar}</td>
                <td className="px-4 py-2 font-semibold text-primary">
                  {editando ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={rascunho[p.pilar] ?? ''}
                        onChange={(e) => setRascunho((r) => ({ ...r, [p.pilar]: e.target.value }))}
                        className="w-20 rounded-md border border-border px-2 py-1 text-sm font-normal text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-secondary">%</span>
                    </div>
                  ) : (
                    `${p.peso}%`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
