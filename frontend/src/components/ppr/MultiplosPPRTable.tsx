import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { usePPRStore } from '../../store/pprStore';
import { formatNumeroPtBR, labelFaixa, PPR_GRUPOS } from '../../utils/ppr';
import Button from '../common/Button';
import type { PPRFaixa } from '../../types';

const GRUPO_LABELS: Record<string, string> = {
  GERENTES: 'Gerentes',
  'COORDENADORES E SUPERVISORES': 'Coordenadores e Supervisores',
  'DEMAIS CARGOS': 'Demais Cargos',
};

interface Linha {
  faixaMin: number;
  faixaMax: number;
  porGrupo: Record<string, PPRFaixa>;
}

function chaveLinha(linha: Linha): string {
  return `${linha.faixaMin}-${linha.faixaMax}`;
}

export default function MultiplosPPRTable() {
  const faixas = usePPRStore((s) => s.faixas);
  const atualizarBandasMultiplo = usePPRStore((s) => s.atualizarBandasMultiplo);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, string>>({});
  // Faixa (min/max) em edição, por linha — a mesma faixa vale pros 3 grupos
  // de cargo daquela linha (ver EdicaoFaixaMultiplo).
  const [rascunhoFaixa, setRascunhoFaixa] = useState<Record<string, { min: string; max: string }>>({});

  const linhas = useMemo(() => {
    const porFaixa = new Map<string, Linha>();
    faixas
      .filter((f) => (PPR_GRUPOS as readonly string[]).includes(f.cargo))
      .forEach((f) => {
        const key = `${f.faixaMin}-${f.faixaMax}`;
        const linha = porFaixa.get(key) ?? { faixaMin: f.faixaMin, faixaMax: f.faixaMax, porGrupo: {} };
        linha.porGrupo[f.cargo] = f;
        porFaixa.set(key, linha);
      });
    return Array.from(porFaixa.values()).sort((a, b) => b.faixaMin - a.faixaMin);
  }, [faixas]);

  function handleIniciar() {
    const inicial: Record<string, string> = {};
    const inicialFaixa: Record<string, { min: string; max: string }> = {};
    linhas.forEach((linha) => {
      inicialFaixa[chaveLinha(linha)] = { min: String(linha.faixaMin), max: String(linha.faixaMax) };
      PPR_GRUPOS.forEach((grupo) => {
        const f = linha.porGrupo[grupo];
        if (f) inicial[f.id] = String(f.multiplo);
      });
    });
    setRascunho(inicial);
    setRascunhoFaixa(inicialFaixa);
    setEditando(true);
  }

  function handleCancelar() {
    setEditando(false);
  }

  async function handleSalvar() {
    const edicoes: { id: string; faixaMin: number; faixaMax: number; multiplo: number }[] = [];

    for (const linha of linhas) {
      const faixaRascunho = rascunhoFaixa[chaveLinha(linha)];
      const faixaMin = Number(faixaRascunho?.min);
      const faixaMax = Number(faixaRascunho?.max);
      if (Number.isNaN(faixaMin) || Number.isNaN(faixaMax)) {
        toast.error('Faixa de atingimento inválida — use apenas números.');
        return;
      }
      if (faixaMax <= faixaMin) {
        toast.error(`A faixa máxima deve ser maior que a mínima (${formatNumeroPtBR(faixaMin)}%).`);
        return;
      }
      for (const grupo of PPR_GRUPOS) {
        const f = linha.porGrupo[grupo];
        if (!f) continue;
        const multiplo = Number(rascunho[f.id]);
        if (Number.isNaN(multiplo) || multiplo < 0) {
          toast.error('Múltiplo inválido — use apenas números positivos.');
          return;
        }
        edicoes.push({ id: f.id, faixaMin, faixaMax, multiplo });
      }
    }

    setSalvando(true);
    const resultado = await atualizarBandasMultiplo(edicoes);
    setSalvando(false);
    if (!resultado.ok) {
      toast.error(resultado.error);
      return;
    }

    toast.success('Tabela de múltiplos atualizada.');
    setEditando(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Tabela de Múltiplos de PPR</p>
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
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="bg-primary text-xs uppercase text-white">
              <th className="px-4 py-2">Atingido</th>
              {PPR_GRUPOS.map((grupo) => (
                <th key={grupo} className="px-4 py-2">
                  {GRUPO_LABELS[grupo]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, idx) => {
              const isMaior = idx === 0;
              const isMenor = idx === linhas.length - 1;
              const label = labelFaixa(linha.faixaMin, linha.faixaMax, isMaior, isMenor, linhas[idx - 1]?.faixaMin);
              const faixaKey = chaveLinha(linha);

              return (
                <tr
                  key={`${linha.faixaMin}-${linha.faixaMax}`}
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
                          value={rascunhoFaixa[faixaKey]?.min ?? ''}
                          onChange={(e) =>
                            setRascunhoFaixa((r) => ({ ...r, [faixaKey]: { min: e.target.value, max: r[faixaKey]?.max ?? '' } }))
                          }
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-secondary">a</span>
                        <input
                          type="number"
                          min={0}
                          max={999}
                          step="0.01"
                          value={rascunhoFaixa[faixaKey]?.max ?? ''}
                          onChange={(e) =>
                            setRascunhoFaixa((r) => ({ ...r, [faixaKey]: { min: r[faixaKey]?.min ?? '', max: e.target.value } }))
                          }
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-secondary">%</span>
                      </div>
                    ) : (
                      label
                    )}
                  </td>
                  {PPR_GRUPOS.map((grupo) => {
                    const f = linha.porGrupo[grupo];
                    if (!f) {
                      return (
                        <td key={grupo} className="px-4 py-2 text-secondary">
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={grupo} className="px-4 py-2">
                        {editando ? (
                          <input
                            type="number"
                            min={0}
                            step="0.05"
                            value={rascunho[f.id] ?? ''}
                            onChange={(e) => setRascunho((r) => ({ ...r, [f.id]: e.target.value }))}
                            className="w-20 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <span className={clsx('font-semibold', isMenor ? 'text-danger' : 'text-primary')}>
                            {formatNumeroPtBR(f.multiplo)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
