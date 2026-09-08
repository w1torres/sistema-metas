import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PPRFaixa } from '../types';

interface NovaFaixaInput {
  cargo: string;
  faixaMin: number;
  faixaMax: number;
  multiplo: number;
}

interface PPRState {
  faixas: PPRFaixa[];
  addFaixa: (input: NovaFaixaInput) => { ok: true } | { ok: false; error: string };
  updateFaixa: (id: string, input: NovaFaixaInput) => { ok: true } | { ok: false; error: string };
  deleteFaixa: (id: string) => void;
  faixaPara: (cargo: string, percentual: number) => PPRFaixa | undefined;
}

function newId(): string {
  return `ppr-${crypto.randomUUID().slice(0, 8)}`;
}

function validar(input: NovaFaixaInput, faixasExistentes: PPRFaixa[], ignorarId?: string): string | null {
  if (!input.cargo.trim()) return 'Cargo é obrigatório';
  if (input.faixaMin < 0 || input.faixaMin > 999) return 'Faixa mínima inválida';
  if (input.faixaMax <= input.faixaMin) return 'Faixa máxima deve ser maior que a mínima';
  if (input.multiplo < 0) return 'Múltiplo não pode ser negativo';

  const cargo = input.cargo.trim().toUpperCase();
  const sobrepoe = faixasExistentes.some(
    (f) =>
      f.id !== ignorarId &&
      f.cargo === cargo &&
      input.faixaMin < f.faixaMax &&
      input.faixaMax > f.faixaMin,
  );
  if (sobrepoe) return 'Já existe uma faixa cadastrada para este cargo que se sobrepõe a este intervalo';

  return null;
}

const SEED_FAIXAS: PPRFaixa[] = [
  { id: 'ppr-seed-01', cargo: 'ASSISTENTE', faixaMin: 0, faixaMax: 49, multiplo: 0 },
  { id: 'ppr-seed-02', cargo: 'ASSISTENTE', faixaMin: 50, faixaMax: 69, multiplo: 0.5 },
  { id: 'ppr-seed-03', cargo: 'ASSISTENTE', faixaMin: 70, faixaMax: 89, multiplo: 1 },
  { id: 'ppr-seed-04', cargo: 'ASSISTENTE', faixaMin: 90, faixaMax: 999, multiplo: 1.5 },

  { id: 'ppr-seed-05', cargo: 'ANALISTA', faixaMin: 0, faixaMax: 49, multiplo: 0 },
  { id: 'ppr-seed-06', cargo: 'ANALISTA', faixaMin: 50, faixaMax: 69, multiplo: 0.75 },
  { id: 'ppr-seed-07', cargo: 'ANALISTA', faixaMin: 70, faixaMax: 89, multiplo: 1.25 },
  { id: 'ppr-seed-08', cargo: 'ANALISTA', faixaMin: 90, faixaMax: 999, multiplo: 1.75 },

  { id: 'ppr-seed-09', cargo: 'ESPECIALISTA', faixaMin: 0, faixaMax: 49, multiplo: 0 },
  { id: 'ppr-seed-10', cargo: 'ESPECIALISTA', faixaMin: 50, faixaMax: 69, multiplo: 1 },
  { id: 'ppr-seed-11', cargo: 'ESPECIALISTA', faixaMin: 70, faixaMax: 89, multiplo: 1.75 },
  { id: 'ppr-seed-12', cargo: 'ESPECIALISTA', faixaMin: 90, faixaMax: 999, multiplo: 2.5 },

  { id: 'ppr-seed-13', cargo: 'COORDENADOR', faixaMin: 0, faixaMax: 49, multiplo: 0 },
  { id: 'ppr-seed-14', cargo: 'COORDENADOR', faixaMin: 50, faixaMax: 69, multiplo: 1 },
  { id: 'ppr-seed-15', cargo: 'COORDENADOR', faixaMin: 70, faixaMax: 89, multiplo: 1.75 },
  { id: 'ppr-seed-16', cargo: 'COORDENADOR', faixaMin: 90, faixaMax: 999, multiplo: 2.5 },

  { id: 'ppr-seed-17', cargo: 'GERENTE', faixaMin: 0, faixaMax: 49, multiplo: 0 },
  { id: 'ppr-seed-18', cargo: 'GERENTE', faixaMin: 50, faixaMax: 69, multiplo: 1.25 },
  { id: 'ppr-seed-19', cargo: 'GERENTE', faixaMin: 70, faixaMax: 89, multiplo: 2 },
  { id: 'ppr-seed-20', cargo: 'GERENTE', faixaMin: 90, faixaMax: 999, multiplo: 3 },

  { id: 'ppr-seed-21', cargo: 'DIRETORIA', faixaMin: 0, faixaMax: 49, multiplo: 0 },
  { id: 'ppr-seed-22', cargo: 'DIRETORIA', faixaMin: 50, faixaMax: 69, multiplo: 1.5 },
  { id: 'ppr-seed-23', cargo: 'DIRETORIA', faixaMin: 70, faixaMax: 89, multiplo: 2.5 },
  { id: 'ppr-seed-24', cargo: 'DIRETORIA', faixaMin: 90, faixaMax: 999, multiplo: 4 },
];

export const usePPRStore = create<PPRState>()(
  persist(
    (set, get) => ({
      faixas: SEED_FAIXAS,

      addFaixa: (input) => {
        const erro = validar(input, get().faixas);
        if (erro) return { ok: false, error: erro };

        const nova: PPRFaixa = { id: newId(), ...input, cargo: input.cargo.trim().toUpperCase() };
        set((state) => ({ faixas: [...state.faixas, nova] }));
        return { ok: true };
      },

      updateFaixa: (id, input) => {
        const erro = validar(input, get().faixas, id);
        if (erro) return { ok: false, error: erro };

        set((state) => ({
          faixas: state.faixas.map((f) => (f.id === id ? { ...f, ...input, cargo: input.cargo.trim().toUpperCase() } : f)),
        }));
        return { ok: true };
      },

      deleteFaixa: (id) => {
        set((state) => ({ faixas: state.faixas.filter((f) => f.id !== id) }));
      },

      faixaPara: (cargo, percentual) => {
        const cargoNorm = cargo.trim().toUpperCase();
        const faixasCargo = get()
          .faixas.filter((f) => f.cargo === cargoNorm)
          .sort((a, b) => a.faixaMin - b.faixaMin);
        if (faixasCargo.length === 0) return undefined;

        const exata = faixasCargo.find((f) => percentual >= f.faixaMin && percentual <= f.faixaMax);
        if (exata) return exata;

        const ultima = faixasCargo[faixasCargo.length - 1];
        return percentual > ultima.faixaMax ? ultima : undefined;
      },
    }),
    { name: 'metas-ppr' },
  ),
);
