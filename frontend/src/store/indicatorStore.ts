import { create } from 'zustand';
import type {
  Attachment,
  Indicador,
  IndicadorFilters,
  IndicadorUpdate,
  RegistroMensal,
} from '../types';
import { apiClient } from '../api/client';
import {
  mapAttachment,
  mapIndicador,
  mapIndicadorUpdate,
  type BackendAttachment,
  type BackendIndicador,
  type BackendIndicadorUpdate,
} from '../api/mappers';
import { useAuthStore } from './authStore';

interface IndicatorState {
  indicators: Indicador[];
  loading: boolean;
  filters: IndicadorFilters;
  // Histórico por indicador, carregado sob demanda (ver fetchHistorico) —
  // nunca teve fetch de todos de uma vez, seria pesado sem necessidade.
  historicoCache: Record<string, IndicadorUpdate[]>;

  setFilters: (filters: Partial<IndicadorFilters>) => void;
  resetFilters: () => void;

  fetchIndicadores: () => Promise<void>;
  fetchHistorico: (indicadorId: string) => Promise<void>;

  solicitarConclusao: (id: string, nota?: string) => Promise<void>;
  cancelarSolicitacao: (id: string) => Promise<void>;
  aprovarGestor: (id: string, observacao?: string) => Promise<void>;
  rejeitarGestor: (id: string, motivo: string) => Promise<void>;
  aprovarRH: (id: string, observacao?: string) => Promise<void>;
  rejeitarRH: (id: string, motivo: string) => Promise<void>;
  desfazerConclusao: (id: string) => Promise<void>;

  // Indicador MENSAL: nunca ficou alcançável pela tela de criação/import (o
  // campo `periodicidade` nunca é setado em lugar nenhum), então o backend
  // nunca chegou a ganhar suporte a isso — fica só local mesmo, sem persistir
  // de verdade. Mantido pra não quebrar o código que já existe em volta
  // (AprovacoesPage, IndicadorCard), caso um dia isso seja retomado.
  solicitarMes: (id: string, mes: string, userId: string, userNome: string, nota?: string) => void;
  aprovarMes: (id: string, mes: string, userId: string, userNome: string, observacao?: string) => void;
  rejeitarMes: (id: string, mes: string, userId: string, userNome: string, motivo: string) => void;
  validarPeriodoFinal: (id: string, userId: string, userNome: string, observacao?: string) => void;

  updateIndicador: (
    id: string,
    updates: Partial<Pick<Indicador, 'nome' | 'peso' | 'status' | 'objetivo' | 'detalhamento' | 'data_inicio' | 'data_fim'>>,
  ) => Promise<void>;
  reatribuir: (id: string, novoResponsavelId: string, motivo?: string) => Promise<void>;
  addAnexo: (id: string, file: File, descricao?: string) => Promise<void>;
  removeAnexo: (id: string, anexoId: string) => Promise<void>;
  createIndicador: (
    data: Pick<Indicador, 'nome' | 'peso' | 'departamento_id' | 'usuario_responsavel_id' | 'objetivo' | 'data_inicio' | 'data_fim'> &
      Partial<Pick<Indicador, 'detalhamento' | 'pilar' | 'meta' | 'formaMedicao' | 'evidenciaObrigatoria'>>,
  ) => Promise<Indicador>;
  deleteIndicador: (id: string) => Promise<void>;
  historyFor: (indicadorId: string) => IndicadorUpdate[];
  notaConclusaoAtual: (indicadorId: string) => string | null;
  observacaoGestor: (indicadorId: string) => string | null;
  observacaoRH: (indicadorId: string) => string | null;
  // Sem coluna própria no backend — a "Tabela de Atingimento" por indicador
  // nunca ganhou UI de criação/edição, então esse valor nunca existe na
  // prática. Mantido só pra não quebrar quem já lê esse selector.
  percentualGestorAtingido: (indicadorId: string) => number | null;
}

const defaultFilters: IndicadorFilters = { departamento: null, status: null, search: '' };

function newLocalId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function substituirIndicador(indicators: Indicador[], atualizado: Indicador): Indicador[] {
  return indicators.map((ind) => (ind.id === atualizado.id ? atualizado : ind));
}

// Prepende no cache local de histórico (mesmo pro fluxo MENSAL, que nunca
// chega a bater no backend — ver comentário da interface).
function pushHistoricoLocal(
  cache: Record<string, IndicadorUpdate[]>,
  entry: Omit<IndicadorUpdate, 'id' | 'criado_em'>,
): Record<string, IndicadorUpdate[]> {
  const nova: IndicadorUpdate = { ...entry, id: newLocalId('upd'), criado_em: new Date().toISOString() };
  return { ...cache, [entry.indicador_id]: [nova, ...(cache[entry.indicador_id] ?? [])] };
}

export const useIndicatorStore = create<IndicatorState>((set, get) => ({
  indicators: [],
  loading: false,
  historicoCache: {},
  filters: defaultFilters,

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),

  // COLABORADOR não tem acesso a GET /indicators (só ao próprio, em /me) —
  // ver requireRole em backend/indicators/routes.ts.
  fetchIndicadores: async () => {
    set({ loading: true });
    try {
      const role = useAuthStore.getState().user?.role;
      const path = role === 'COLABORADOR' ? '/indicators/me' : '/indicators';
      const data = await apiClient.get<BackendIndicador[]>(path);
      set({ indicators: data.map(mapIndicador), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  fetchHistorico: async (indicadorId) => {
    const data = await apiClient.get<BackendIndicadorUpdate[]>(`/indicators/${indicadorId}/history`);
    set((state) => ({ historicoCache: { ...state.historicoCache, [indicadorId]: data.map(mapIndicadorUpdate) } }));
  },

  solicitarConclusao: async (id, nota) => {
    const atualizado = mapIndicador(await apiClient.patch<BackendIndicador>(`/indicators/${id}/complete`, { nota }));
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  cancelarSolicitacao: async (id) => {
    const atualizado = mapIndicador(await apiClient.patch<BackendIndicador>(`/indicators/${id}/complete/cancelar`));
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  desfazerConclusao: async (id) => {
    const atualizado = mapIndicador(await apiClient.patch<BackendIndicador>(`/indicators/${id}/complete/desfazer`));
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  aprovarGestor: async (id, observacao) => {
    const atualizado = mapIndicador(
      await apiClient.patch<BackendIndicador>(`/indicators/${id}/approve`, { aprovado: true, observacao }),
    );
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  rejeitarGestor: async (id, motivo) => {
    const atualizado = mapIndicador(
      await apiClient.patch<BackendIndicador>(`/indicators/${id}/approve`, { aprovado: false, observacao: motivo }),
    );
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  aprovarRH: async (id, observacao) => {
    const atualizado = mapIndicador(
      await apiClient.patch<BackendIndicador>(`/indicators/${id}/approve`, { aprovado: true, observacao }),
    );
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  rejeitarRH: async (id, motivo) => {
    const atualizado = mapIndicador(
      await apiClient.patch<BackendIndicador>(`/indicators/${id}/approve`, { aprovado: false, observacao: motivo }),
    );
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  // --- MENSAL: local-only, nunca alcançável pela UI de criação — ver comentário da interface. ---

  solicitarMes: (id, mes, userId, userNome, nota) => {
    const now = new Date().toISOString();
    set((state) => ({
      indicators: state.indicators.map((ind) => {
        if (ind.id !== id) return ind;
        const registros = (ind.registrosMensais ?? []).filter((r) => r.mes !== mes);
        const registro: RegistroMensal = { mes, status: 'AGUARDANDO_GESTOR', nota: nota?.trim() || null, enviado_em: now };
        return { ...ind, registrosMensais: [...registros, registro], atualizado_em: now };
      }),
      historicoCache: pushHistoricoLocal(state.historicoCache, {
        indicador_id: id,
        usuario_alterou_id: userId,
        usuario_nome: userNome,
        tipo_alteracao: 'SOLICITACAO_CONCLUSAO',
        campo_alterado: `mes:${mes}`,
        valor_anterior: null,
        valor_novo: 'AGUARDANDO_GESTOR',
        motivo: nota?.trim() ? nota.trim() : `Colaborador enviou o mês ${mes} para avaliação`,
      }),
    }));
  },

  aprovarMes: (id, mes, userId, userNome, observacao) => {
    const now = new Date().toISOString();
    set((state) => ({
      indicators: state.indicators.map((ind) => {
        if (ind.id !== id) return ind;
        const registros = (ind.registrosMensais ?? []).map((r) =>
          r.mes === mes ? { ...r, status: 'APROVADO' as const, observacaoGestor: observacao?.trim() || null, aprovado_em: now } : r,
        );
        return { ...ind, registrosMensais: registros, atualizado_em: now };
      }),
      historicoCache: pushHistoricoLocal(state.historicoCache, {
        indicador_id: id,
        usuario_alterou_id: userId,
        usuario_nome: userNome,
        tipo_alteracao: 'APROVACAO_GESTOR',
        campo_alterado: `mes:${mes}`,
        valor_anterior: 'AGUARDANDO_GESTOR',
        valor_novo: 'APROVADO',
        motivo: `Mês ${mes} aprovado pelo gestor do departamento`,
        observacao: observacao?.trim() ? observacao.trim() : null,
      }),
    }));
  },

  rejeitarMes: (id, mes, userId, userNome, motivo) => {
    const now = new Date().toISOString();
    set((state) => ({
      indicators: state.indicators.map((ind) => {
        if (ind.id !== id) return ind;
        const registros = (ind.registrosMensais ?? []).filter((r) => r.mes !== mes);
        return { ...ind, registrosMensais: registros, atualizado_em: now };
      }),
      historicoCache: pushHistoricoLocal(state.historicoCache, {
        indicador_id: id,
        usuario_alterou_id: userId,
        usuario_nome: userNome,
        tipo_alteracao: 'REJEICAO',
        campo_alterado: `mes:${mes}`,
        valor_anterior: 'AGUARDANDO_GESTOR',
        valor_novo: 'PENDENTE',
        motivo,
      }),
    }));
  },

  validarPeriodoFinal: (id, userId, userNome, observacao) => {
    const now = new Date().toISOString();
    set((state) => ({
      indicators: state.indicators.map((ind) =>
        ind.id === id ? { ...ind, status: 'CONCLUIDO', atendimento: 100, concluido_em: now, atualizado_em: now } : ind,
      ),
      historicoCache: pushHistoricoLocal(state.historicoCache, {
        indicador_id: id,
        usuario_alterou_id: userId,
        usuario_nome: userNome,
        tipo_alteracao: 'APROVACAO_RH',
        campo_alterado: 'status',
        valor_anterior: 'EM_ANDAMENTO',
        valor_novo: 'CONCLUIDO',
        motivo: 'Validação final do período aprovada pelo RH — indicador concluído',
        observacao: observacao?.trim() ? observacao.trim() : null,
      }),
    }));
  },

  // --- fim MENSAL ---

  updateIndicador: async (id, updates) => {
    const payload: Record<string, unknown> = { ...updates };
    const atualizado = mapIndicador(await apiClient.put<BackendIndicador>(`/indicators/${id}`, payload));
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  reatribuir: async (id, novoResponsavelId, motivo) => {
    const atualizado = mapIndicador(
      await apiClient.patch<BackendIndicador>(`/indicators/${id}/reatribuir`, {
        usuario_responsavel_id: novoResponsavelId,
        motivo,
      }),
    );
    set((state) => ({ indicators: substituirIndicador(state.indicators, atualizado) }));
  },

  addAnexo: async (id, file, descricao) => {
    const form = new FormData();
    form.append('file', file);
    if (descricao) form.append('descricao', descricao);
    const anexo: Attachment = mapAttachment(
      await apiClient.postForm<BackendAttachment>(`/indicators/${id}/attachments`, form),
    );
    set((state) => ({
      indicators: state.indicators.map((ind) => (ind.id === id ? { ...ind, anexos: [...ind.anexos, anexo] } : ind)),
    }));
  },

  removeAnexo: async (id, anexoId) => {
    await apiClient.delete(`/indicators/${id}/attachments/${anexoId}`);
    set((state) => ({
      indicators: state.indicators.map((ind) =>
        ind.id === id ? { ...ind, anexos: ind.anexos.filter((a) => a.id !== anexoId) } : ind,
      ),
    }));
  },

  createIndicador: async (data) => {
    const payload = {
      departamento_id: data.departamento_id || undefined,
      usuario_responsavel_id: data.usuario_responsavel_id,
      nome: data.nome,
      peso: data.peso,
      objetivo: data.objetivo,
      detalhamento: data.detalhamento || null,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
      pilar: data.pilar || null,
      meta: data.meta || null,
      forma_medicao: data.formaMedicao || null,
      evidencia_obrigatoria: data.evidenciaObrigatoria || null,
    };
    const criado = mapIndicador(await apiClient.post<BackendIndicador>('/indicators', payload));
    set((state) => ({ indicators: [criado, ...state.indicators] }));
    return criado;
  },

  deleteIndicador: async (id) => {
    await apiClient.delete(`/indicators/${id}`);
    set((state) => ({ indicators: state.indicators.filter((ind) => ind.id !== id) }));
  },

  historyFor: (indicadorId) => get().historicoCache[indicadorId] ?? [],

  notaConclusaoAtual: (indicadorId) => get().indicators.find((i) => i.id === indicadorId)?.notaConclusaoAtual ?? null,
  observacaoGestor: (indicadorId) => get().indicators.find((i) => i.id === indicadorId)?.observacaoGestor ?? null,
  observacaoRH: (indicadorId) => get().indicators.find((i) => i.id === indicadorId)?.observacaoRH ?? null,
  percentualGestorAtingido: () => null,
}));
