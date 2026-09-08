import { create } from 'zustand';
import type { Departamento } from '../types';
import mockData from '../data/mockData.json';

interface DepartmentState {
  departments: Departamento[];
  findOrCreateByName: (nome: string, descricao?: string) => Departamento;
}

function newId(): string {
  return `dept-${crypto.randomUUID().slice(0, 8)}`;
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: mockData.departments as Departamento[],

  findOrCreateByName: (nome, descricao = '') => {
    const normalized = nome.trim().toUpperCase();
    const existing = get().departments.find((d) => d.nome.toUpperCase() === normalized);
    if (existing) return existing;

    const novo: Departamento = { id: newId(), nome: nome.trim().toUpperCase(), descricao };
    set((state) => ({ departments: [...state.departments, novo] }));
    return novo;
  },
}));
