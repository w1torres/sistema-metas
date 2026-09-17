import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { BackendCargo } from '../api/mappers';

interface CargoState {
  // Nomes só, pra manter compatibilidade com os <Select> existentes — o
  // backend modela cargo como entidade própria (id + nome), mas o resto do
  // frontend trata "cargo" como texto direto no usuário.
  cargos: string[];
  cargoIdPorNome: Record<string, string>;
  loading: boolean;
  fetchCargos: () => Promise<void>;
  // Retorna o NOME normalizado (não o id) — compatibilidade com callers que
  // já esperavam isso do store mock. Use getIdByName pra resolver o cargo_id
  // exigido pelo backend ao criar/editar usuário.
  findOrCreate: (nome: string) => Promise<string>;
  getIdByName: (nome: string) => string | undefined;
}

export const useCargoStore = create<CargoState>((set, get) => ({
  cargos: [],
  cargoIdPorNome: {},
  loading: false,

  fetchCargos: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendCargo[]>('/cargos');
      const cargoIdPorNome: Record<string, string> = {};
      data.forEach((c) => {
        cargoIdPorNome[c.nome.toUpperCase()] = c.id;
      });
      set({ cargos: data.map((c) => c.nome), cargoIdPorNome, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  findOrCreate: async (nome) => {
    const normalized = nome.trim().toUpperCase();
    if (!normalized) return normalized;
    if (get().cargoIdPorNome[normalized]) return normalized;

    const created = await apiClient.post<BackendCargo>('/cargos', { nome: normalized });
    set((state) => ({
      cargos: [...state.cargos, created.nome],
      cargoIdPorNome: { ...state.cargoIdPorNome, [created.nome.toUpperCase()]: created.id },
    }));
    return normalized;
  },

  getIdByName: (nome) => get().cargoIdPorNome[nome.trim().toUpperCase()],
}));
