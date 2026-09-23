import { create } from 'zustand';
import { apiClient, ApiClientError } from '../api/client';
import { mapAtingimentoFaixa, type AtingimentoFaixa, type BackendAtingimentoFaixa } from '../api/mappers';

export type { AtingimentoFaixa };

export interface EdicaoFaixaAtingimento {
  id: string;
  faixaMin: number;
  faixaMax: number;
  percentualPeso: number;
}

interface AtingimentoState {
  faixas: AtingimentoFaixa[];
  loading: boolean;
  fetchFaixas: () => Promise<void>;
  // Substitui de uma vez todas as faixas — evita falso positivo de
  // sobreposição ao editar várias linhas ao mesmo tempo (o backend valida
  // contra o conjunto novo completo, não contra o antigo).
  atualizarFaixas: (edicoes: EdicaoFaixaAtingimento[]) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const useAtingimentoStore = create<AtingimentoState>((set) => ({
  faixas: [],
  loading: false,

  fetchFaixas: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendAtingimentoFaixa[]>('/atingimento/faixas');
      set({ faixas: data.map(mapAtingimentoFaixa), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  atualizarFaixas: async (edicoes) => {
    try {
      const data = await apiClient.put<BackendAtingimentoFaixa[]>('/atingimento/faixas', {
        faixas: edicoes.map((e) => ({
          id: e.id,
          faixa_min: e.faixaMin,
          faixa_max: e.faixaMax,
          percentual_peso: e.percentualPeso,
        })),
      });
      set({ faixas: data.map(mapAtingimentoFaixa) });
      return { ok: true };
    } catch (err) {
      const error =
        err instanceof ApiClientError ? err.message : 'Não foi possível atualizar a tabela de percentual de atingimento.';
      return { ok: false, error };
    }
  },
}));
