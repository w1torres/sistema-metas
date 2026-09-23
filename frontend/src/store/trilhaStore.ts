import { create } from 'zustand';
import type { Trilha } from '../types';
import { apiClient, ApiClientError } from '../api/client';
import { mapTrilha, type BackendTrilha } from '../api/mappers';

interface TrilhaState {
  trilhas: Trilha[];
  loading: boolean;
  fetchTrilhas: () => Promise<void>;
  // Substitui de uma vez os pesos de TODOS os pilares de uma trilha — evita
  // salvar um pilar por vez, o que deixaria a soma inconsistente (deve ser
  // sempre 100) entre um save e o próximo. O backend valida a soma.
  substituirPesosDaTrilha: (
    trilhaId: string,
    pesos: { pilar: string; peso: number }[],
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const useTrilhaStore = create<TrilhaState>((set) => ({
  trilhas: [],
  loading: false,

  fetchTrilhas: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendTrilha[]>('/trilhas');
      set({ trilhas: data.map(mapTrilha), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  substituirPesosDaTrilha: async (trilhaId, pesos) => {
    try {
      const atualizada = await apiClient.put<BackendTrilha>(`/trilhas/${trilhaId}/pilares`, { pilares: pesos });
      const mapeada = mapTrilha(atualizada);
      set((state) => ({ trilhas: state.trilhas.map((t) => (t.id === trilhaId ? mapeada : t)) }));
      return { ok: true };
    } catch (err) {
      const error = err instanceof ApiClientError ? err.message : 'Não foi possível atualizar os pesos.';
      return { ok: false, error };
    }
  },
}));
