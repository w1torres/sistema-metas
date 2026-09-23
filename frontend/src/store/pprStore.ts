import { create } from 'zustand';
import type { PPRFaixa, Role } from '../types';
import { apiClient, ApiClientError } from '../api/client';
import { mapPPRFaixa, type BackendPPRFaixa } from '../api/mappers';
import { roleParaGrupoPPR } from '../utils/ppr';

export interface EdicaoFaixaMultiplo {
  id: string;
  faixaMin: number;
  faixaMax: number;
  multiplo: number;
}

interface PPRState {
  faixas: PPRFaixa[];
  loading: boolean;
  fetchFaixas: () => Promise<void>;
  // Edita faixa (min/max) e múltiplo de várias linhas de uma vez — a "linha"
  // da Tabela de Múltiplos vale pros 3 grupos de cargo ao mesmo tempo (mesma
  // faixa), então o front sempre manda todas juntas (ver
  // MultiplosPPRTable.tsx). Sobreposição é validada no backend contra o
  // conjunto novo completo por grupo.
  atualizarBandasMultiplo: (edicoes: EdicaoFaixaMultiplo[]) => Promise<{ ok: true } | { ok: false; error: string }>;
  faixaPara: (role: Role, cargo: string | undefined, percentual: number) => PPRFaixa | undefined;
}

export const usePPRStore = create<PPRState>((set, get) => ({
  faixas: [],
  loading: false,

  fetchFaixas: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendPPRFaixa[]>('/ppr/faixas');
      set({ faixas: data.map(mapPPRFaixa), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  atualizarBandasMultiplo: async (edicoes) => {
    try {
      const data = await apiClient.put<BackendPPRFaixa[]>('/ppr/faixas', {
        faixas: edicoes.map((e) => ({
          id: e.id,
          faixa_min: e.faixaMin,
          faixa_max: e.faixaMax,
          multiplo: e.multiplo,
        })),
      });
      set({ faixas: data.map(mapPPRFaixa) });
      return { ok: true };
    } catch (err) {
      const error = err instanceof ApiClientError ? err.message : 'Não foi possível atualizar a tabela de múltiplos.';
      return { ok: false, error };
    }
  },

  faixaPara: (role, cargo, percentual) => {
    const grupo = roleParaGrupoPPR(role, cargo);
    if (!grupo) return undefined;
    const faixasCargo = get()
      .faixas.filter((f) => f.cargo === grupo)
      .sort((a, b) => a.faixaMin - b.faixaMin);
    if (faixasCargo.length === 0) return undefined;

    const exata = faixasCargo.find((f) => percentual >= f.faixaMin && percentual <= f.faixaMax);
    if (exata) return exata;

    const ultima = faixasCargo[faixasCargo.length - 1];
    return percentual > ultima.faixaMax ? ultima : undefined;
  },
}));
