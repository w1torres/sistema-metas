import { create } from 'zustand';

interface CargoState {
  cargos: string[];
  findOrCreate: (nome: string) => string;
}

export const useCargoStore = create<CargoState>((set, get) => ({
  cargos: ['ASSISTENTE', 'ANALISTA', 'COORDENADOR', 'ESPECIALISTA', 'GERENTE', 'DIRETORIA'],

  findOrCreate: (nome) => {
    const normalized = nome.trim().toUpperCase();
    if (!normalized) return normalized;
    if (!get().cargos.includes(normalized)) {
      set((state) => ({ cargos: [...state.cargos, normalized] }));
    }
    return normalized;
  },
}));
