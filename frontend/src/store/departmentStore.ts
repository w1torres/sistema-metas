import { create } from 'zustand';
import type { Departamento } from '../types';
import { apiClient } from '../api/client';
import { mapDepartamento, type BackendDepartamento } from '../api/mappers';

interface DepartmentState {
  departments: Departamento[];
  loading: boolean;
  fetchDepartamentos: () => Promise<void>;
  findOrCreateByName: (nome: string, descricao?: string) => Promise<Departamento>;
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: [],
  loading: false,

  fetchDepartamentos: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendDepartamento[]>('/departamentos');
      set({ departments: data.map(mapDepartamento), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  findOrCreateByName: async (nome, descricao = '') => {
    const normalized = nome.trim().toUpperCase();
    const existing = get().departments.find((d) => d.nome.toUpperCase() === normalized);
    if (existing) return existing;

    const created = await apiClient.post<BackendDepartamento>('/departamentos', { nome: normalized, descricao });
    const novo = mapDepartamento(created);
    set((state) => ({ departments: [...state.departments, novo] }));
    return novo;
  },
}));
