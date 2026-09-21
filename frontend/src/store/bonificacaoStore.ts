import { create } from 'zustand';
import type { Bonificacao, BonificacaoParticipante, MinhaBonificacao } from '../types';
import { apiClient } from '../api/client';
import {
  mapBonificacao,
  mapBonificacaoParticipante,
  mapMinhaBonificacao,
  type BackendBonificacao,
  type BackendBonificacaoParticipante,
  type BackendMinhaBonificacao,
} from '../api/mappers';

export interface BonificacaoInput {
  fornecedor: string;
  valorTotal: number;
  mesReferencia: string;
}

function paraPayload(input: Partial<BonificacaoInput>) {
  const payload: Record<string, unknown> = {};
  if (input.fornecedor !== undefined) payload.fornecedor = input.fornecedor;
  if (input.valorTotal !== undefined) payload.valor_total = input.valorTotal;
  if (input.mesReferencia !== undefined) payload.mes_referencia = input.mesReferencia;
  return payload;
}

interface BonificacaoState {
  bonificacoes: Bonificacao[];
  minhasBonificacoes: MinhaBonificacao[];
  loading: boolean;
  fetchBonificacoes: () => Promise<void>;
  fetchMinhasBonificacoes: () => Promise<void>;
  createBonificacao: (input: BonificacaoInput) => Promise<Bonificacao>;
  updateBonificacao: (id: string, input: Partial<BonificacaoInput>) => Promise<Bonificacao>;
  removeBonificacao: (id: string) => Promise<void>;
  setPaga: (id: string, paga: boolean) => Promise<Bonificacao>;
  atualizarNotaParticipante: (
    id: string,
    usuarioId: string,
    percentualNota: number,
  ) => Promise<BonificacaoParticipante[]>;
}

function atualizarBonificacaoNoEstado(
  bonificacoes: Bonificacao[],
  id: string,
  atualizada: Bonificacao,
): Bonificacao[] {
  return bonificacoes.map((b) => (b.id === id ? atualizada : b));
}

export const useBonificacaoStore = create<BonificacaoState>((set) => ({
  bonificacoes: [],
  minhasBonificacoes: [],
  loading: false,

  fetchBonificacoes: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendBonificacao[]>('/bonificacoes');
      set({ bonificacoes: data.map(mapBonificacao), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchMinhasBonificacoes: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendMinhaBonificacao[]>('/bonificacoes/minhas');
      set({ minhasBonificacoes: data.map(mapMinhaBonificacao), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  createBonificacao: async (input) => {
    // A criação já popula os participantes elegíveis automaticamente (ver
    // backend) — a resposta já vem com `participantes` prontos.
    const criada = await apiClient.post<BackendBonificacao>('/bonificacoes', paraPayload(input));
    const nova = mapBonificacao(criada);
    set((state) => ({ bonificacoes: [nova, ...state.bonificacoes] }));
    return nova;
  },

  updateBonificacao: async (id, input) => {
    const atualizada = await apiClient.patch<BackendBonificacao>(`/bonificacoes/${id}`, paraPayload(input));
    const mapeada = mapBonificacao(atualizada);
    set((state) => ({ bonificacoes: atualizarBonificacaoNoEstado(state.bonificacoes, id, mapeada) }));
    return mapeada;
  },

  removeBonificacao: async (id) => {
    await apiClient.delete(`/bonificacoes/${id}`);
    set((state) => ({ bonificacoes: state.bonificacoes.filter((b) => b.id !== id) }));
  },

  setPaga: async (id, paga) => {
    const atualizada = await apiClient.patch<BackendBonificacao>(`/bonificacoes/${id}/pagamento`, { paga });
    const mapeada = mapBonificacao(atualizada);
    set((state) => ({ bonificacoes: atualizarBonificacaoNoEstado(state.bonificacoes, id, mapeada) }));
    return mapeada;
  },

  atualizarNotaParticipante: async (id, usuarioId, percentualNota) => {
    const data = await apiClient.patch<BackendBonificacaoParticipante[]>(
      `/bonificacoes/${id}/participantes/${usuarioId}`,
      { percentual_nota: percentualNota },
    );
    const participantes = data.map(mapBonificacaoParticipante);
    set((state) => ({
      bonificacoes: state.bonificacoes.map((b) => (b.id === id ? { ...b, participantes } : b)),
    }));
    return participantes;
  },
}));
