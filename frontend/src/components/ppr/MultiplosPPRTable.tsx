import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { usePPRStore } from '../../store/pprStore';
import { PPR_GRUPOS } from '../../utils/ppr';
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

function formatNumeroPtBR(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

function labelFaixa(linha: Linha, isMaior: boolean, isMenor: boolean, faixaMinDaProxima?: number): string {
  if (isMaior) return `Igual ou acima de ${formatNumeroPtBR(linha.faixaMin)}%`;
  if (isMenor) return `Abaixo de ${formatNumeroPtBR(faixaMinDaProxima ?? linha.faixaMax)}%`;
  return `De ${formatNumeroPtBR(linha.faixaMin)}% a ${formatNumeroPtBR(linha.faixaMax)}%`;
}

export default function MultiplosPPRTable() {
  const faixas = usePPRStore((s) => s.faixas);
  const updateFaixa = usePPRStore((s) => s.updateFaixa);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, string>>({});

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
    linhas.forEach((linha) => {
      PPR_GRUPOS.forEach((grupo) => {
        const f = linha.porGrupo[grupo];
        if (f) inicial[f.id] = String(f.multiplo);
      });
    });
    setRascunho(inicial);
    setEditando(true);
  }

  function handleCancelar() {
    setEditando(false);
  }

  function handleSalvar() {
    const idsParaAtualizar: { faixa: PPRFaixa; multiplo: number }[] = [];

    for (const linha of linhas) {
      for (const grupo of PPR_GRUPOS) {
        const f = linha.porGrupo[grupo];
        if (!f) continue;
        const valor = Number(rascunho[f.id]);
        if (Number.isNaN(valor) || valor < 0) {
          toast.error('Múltiplo inválido — use apenas números positivos.');
          return;
        }
        if (valor !== f.multiplo) idsParaAtualizar.push({ faixa: f, multiplo: valor });
      }
    }

    idsParaAtualizar.forEach(({ faixa, multiplo }) => {
      updateFaixa(faixa.id, { cargo: faixa.cargo, faixaMin: faixa.faixaMin, faixaMax: faixa.faixaMax, multiplo });
    });

    toast.success('Tabela de múltiplos atualizada.');
    setEditando(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">Tabela de Múltiplos de PPR</p>
        {editando ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancelar}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSalvar}>
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
              const label = labelFaixa(linha, isMaior, isMenor, linhas[idx - 1]?.faixaMin);

              return (
                <tr
                  key={`${linha.faixaMin}-${linha.faixaMax}`}
                  className={clsx(
                    'border-b border-border last:border-0',
                    isMenor ? 'bg-danger/10' : idx % 2 === 1 ? 'bg-gray-50' : 'bg-white',
                  )}
                >
                  <td className={clsx('px-4 py-2 font-medium', isMenor ? 'text-danger' : 'text-ink')}>{label}</td>
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
