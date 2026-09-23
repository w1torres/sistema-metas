import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAtingimentoStore } from '../../store/atingimentoStore';
import { formatNumeroPtBR, labelFaixa } from '../../utils/ppr';
import Button from '../common/Button';

interface RascunhoLinha {
  min: string;
  max: string;
  peso: string;
}

export default function TabelaAtingimentoTable() {
  const faixas = useAtingimentoStore((s) => s.faixas);
  const atualizarFaixas = useAtingimentoStore((s) => s.atualizarFaixas);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, RascunhoLinha>>({});

  const linhas = useMemo(() => [...faixas].sort((a, b) => b.faixaMin - a.faixaMin), [faixas]);

  function handleIniciar() {
    const inicial: Record<string, RascunhoLinha> = {};
    linhas.forEach((f) => {
      inicial[f.id] = { min: String(f.faixaMin), max: String(f.faixaMax), peso: String(f.percentualPeso) };
    });
    setRascunho(inicial);
    setEditando(true);
  }

  function handleCancelar() {
    setEditando(false);
  }

  function atualizarCampo(id: string, campo: keyof RascunhoLinha, valor: string) {
    setRascunho((prev) => ({
      ...prev,
      [id]: { min: prev[id]?.min ?? '', max: prev[id]?.max ?? '', peso: prev[id]?.peso ?? '', [campo]: valor },
    }));
  }

  async function handleSalvar() {
    const edicoes = linhas.map((f) => {
      const r = rascunho[f.id];
      return { id: f.id, faixaMin: Number(r?.min), faixaMax: Number(r?.max), percentualPeso: Number(r?.peso) };
    });
    if (edicoes.some((e) => Number.isNaN(e.faixaMin) || Number.isNaN(e.faixaMax) || Number.isNaN(e.percentualPeso))) {
      toast.error('Preencha todos os campos com números válidos.');
      return;
    }

    setSalvando(true);
    const resultado = await atualizarFaixas(edicoes);
    setSalvando(false);
    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }

    toast.success('Tabela de percentual de atingimento atualizada.');
    setEditando(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Tabela de Percentual de Atingimento</p>
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
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="bg-primary text-xs uppercase text-white">
              <th className="px-4 py-2">% da Meta Atingida</th>
              <th className="px-4 py-2">% do Peso do Indicador</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((f, idx) => {
              const isMaior = idx === 0;
              const isMenor = idx === linhas.length - 1;
              const label = labelFaixa(f.faixaMin, f.faixaMax, isMaior, isMenor, linhas[idx - 1]?.faixaMin);
              const r = rascunho[f.id];

              return (
                <tr
                  key={f.id}
                  className={clsx(
                    'border-b border-border last:border-0',
                    isMenor ? 'bg-danger/10' : idx % 2 === 1 ? 'bg-gray-50' : 'bg-white',
                  )}
                >
                  <td className={clsx('px-4 py-2 font-medium', isMenor ? 'text-danger' : 'text-ink')}>
                    {editando ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step="0.01"
                          value={r?.min ?? ''}
                          onChange={(e) => atualizarCampo(f.id, 'min', e.target.value)}
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-secondary">a</span>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step="0.01"
                          value={r?.max ?? ''}
                          onChange={(e) => atualizarCampo(f.id, 'max', e.target.value)}
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-secondary">%</span>
                      </div>
                    ) : (
                      label
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editando ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="1"
                          value={r?.peso ?? ''}
                          onChange={(e) => atualizarCampo(f.id, 'peso', e.target.value)}
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-secondary">%</span>
                      </div>
                    ) : (
                      <span className={clsx('font-semibold', isMenor ? 'text-danger' : 'text-primary')}>
                        {formatNumeroPtBR(f.percentualPeso)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
