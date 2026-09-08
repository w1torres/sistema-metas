import { create } from 'zustand';
import type { Attachment, Indicador, IndicadorFilters, IndicadorStatus, IndicadorUpdate, TipoAlteracao } from '../types';
import mockData from '../data/mockData.json';

interface IndicatorState {
  indicators: Indicador[];
  history: IndicadorUpdate[];
  filters: IndicadorFilters;

  setFilters: (filters: Partial<IndicadorFilters>) => void;
  resetFilters: () => void;

  solicitarConclusao: (id: string, userId: string, userNome: string, nota?: string) => void;
  cancelarSolicitacao: (id: string, userId: string, userNome: string) => void;
  aprovarGestor: (id: string, userId: string, userNome: string, motivo?: string) => void;
  rejeitarGestor: (id: string, userId: string, userNome: string, motivo: string) => void;
  aprovarRH: (id: string, userId: string, userNome: string, motivo?: string) => void;
  rejeitarRH: (id: string, userId: string, userNome: string, motivo: string) => void;
  desfazerConclusao: (id: string, userId: string, userNome: string) => void;

  updateIndicador: (
    id: string,
    updates: Partial<Pick<Indicador, 'nome' | 'peso' | 'status' | 'atendimento' | 'objetivo' | 'detalhamento' | 'data_inicio' | 'data_fim'>>,
    userId: string,
    userNome: string,
    motivo?: string,
  ) => void;
  reatribuir: (
    id: string,
    novoResponsavelId: string,
    novoResponsavelNome: string,
    userId: string,
    userNome: string,
    motivo?: string,
  ) => void;
  addAnexo: (id: string, anexo: Attachment, userId: string, userNome: string) => void;
  removeAnexo: (id: string, anexoId: string) => void;
  createIndicador: (
    data: Pick<Indicador, 'nome' | 'peso' | 'departamento_id' | 'departamento' | 'usuario_responsavel_id' | 'responsavel' | 'objetivo' | 'data_inicio' | 'data_fim'>,
    userId: string,
    userNome: string,
  ) => void;
  deleteIndicador: (id: string) => void;
  historyFor: (indicadorId: string) => IndicadorUpdate[];
  notaConclusaoAtual: (indicadorId: string) => string | null;
}

const defaultFilters: IndicadorFilters = { departamento: null, status: null, search: '' };

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function pushHistory(
  history: IndicadorUpdate[],
  entry: Omit<IndicadorUpdate, 'id' | 'criado_em'>,
): IndicadorUpdate[] {
  return [
    { ...entry, id: newId('upd'), criado_em: new Date().toISOString() },
    ...history,
  ];
}

export const useIndicatorStore = create<IndicatorState>((set, get) => {
  function mudarStatus(
    id: string,
    statusOrigemValidos: IndicadorStatus[],
    statusDestino: IndicadorStatus,
    userId: string,
    userNome: string,
    tipoAlteracao: TipoAlteracao,
    motivo: string | null,
    extra?: Partial<Indicador>,
  ): boolean {
    const indicador = get().indicators.find((i) => i.id === id);
    if (!indicador || !statusOrigemValidos.includes(indicador.status)) return false;
    const now = new Date().toISOString();

    set((state) => ({
      indicators: state.indicators.map((ind) =>
        ind.id === id ? { ...ind, status: statusDestino, atualizado_em: now, ...extra } : ind,
      ),
      history: pushHistory(state.history, {
        indicador_id: id,
        usuario_alterou_id: userId,
        usuario_nome: userNome,
        tipo_alteracao: tipoAlteracao,
        campo_alterado: 'status',
        valor_anterior: indicador.status,
        valor_novo: statusDestino,
        motivo,
      }),
    }));
    return true;
  }

  return {
    indicators: mockData.indicators as Indicador[],
    history: mockData.indicador_updates as IndicadorUpdate[],
    filters: defaultFilters,

    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    resetFilters: () => set({ filters: defaultFilters }),

    // Colaborador marca o checkbox: não conclui direto, entra na fila do gestor do departamento.
    // A nota (o que o colaborador escreveu sobre a conclusão) fica registrada no histórico e é
    // o que os gestores veem na tela de Aprovações.
    solicitarConclusao: (id, userId, userNome, nota) => {
      mudarStatus(
        id,
        ['EM_ANDAMENTO', 'ATRASADO'],
        'AGUARDANDO_APROVACAO_GESTOR',
        userId,
        userNome,
        'SOLICITACAO_CONCLUSAO',
        nota?.trim() ? nota.trim() : 'Colaborador solicitou conclusão (sem observações)',
      );
    },

    // Colaborador desiste antes do gestor avaliar
    cancelarSolicitacao: (id, userId, userNome) => {
      mudarStatus(
        id,
        ['AGUARDANDO_APROVACAO_GESTOR'],
        'EM_ANDAMENTO',
        userId,
        userNome,
        'EDICAO',
        'Solicitação de conclusão cancelada pelo colaborador',
      );
    },

    // Gestor do departamento aprova: segue para avaliação final do RH
    aprovarGestor: (id, userId, userNome, motivo) => {
      mudarStatus(
        id,
        ['AGUARDANDO_APROVACAO_GESTOR'],
        'AGUARDANDO_APROVACAO_RH',
        userId,
        userNome,
        'APROVACAO_GESTOR',
        motivo ?? 'Aprovado pelo gestor do departamento',
      );
    },

    // Gestor do departamento rejeita: volta para o colaborador
    rejeitarGestor: (id, userId, userNome, motivo) => {
      mudarStatus(id, ['AGUARDANDO_APROVACAO_GESTOR'], 'EM_ANDAMENTO', userId, userNome, 'REJEICAO', motivo);
    },

    // RH dá a avaliação final: só agora conta o peso para o colaborador
    aprovarRH: (id, userId, userNome, motivo) => {
      const now = new Date().toISOString();
      mudarStatus(
        id,
        ['AGUARDANDO_APROVACAO_RH'],
        'CONCLUIDO',
        userId,
        userNome,
        'APROVACAO_RH',
        motivo ?? 'Aprovado pelo RH — indicador concluído',
        { atendimento: 100, concluido_em: now },
      );
    },

    // RH rejeita a avaliação final: volta para o colaborador refazer/reenviar
    rejeitarRH: (id, userId, userNome, motivo) => {
      mudarStatus(id, ['AGUARDANDO_APROVACAO_RH'], 'EM_ANDAMENTO', userId, userNome, 'REJEICAO', motivo);
    },

    // Colaborador desfaz uma conclusão já aprovada (não passa pelo fluxo de novo)
    desfazerConclusao: (id, userId, userNome) => {
      mudarStatus(id, ['CONCLUIDO'], 'EM_ANDAMENTO', userId, userNome, 'EDICAO', 'Marca de conclusão removida', {
        atendimento: 0,
        concluido_em: null,
      });
    },

    updateIndicador: (id, updates, userId, userNome, motivo) => {
      const indicador = get().indicators.find((i) => i.id === id);
      if (!indicador) return;
      const now = new Date().toISOString();

      set((state) => ({
        indicators: state.indicators.map((ind) =>
          ind.id === id ? { ...ind, ...updates, atualizado_em: now } : ind,
        ),
        history: pushHistory(state.history, {
          indicador_id: id,
          usuario_alterou_id: userId,
          usuario_nome: userNome,
          tipo_alteracao: 'EDICAO',
          campo_alterado: Object.keys(updates).join(', '),
          valor_anterior: null,
          valor_novo: updates,
          motivo: motivo ?? null,
        }),
      }));
    },

    reatribuir: (id, novoResponsavelId, novoResponsavelNome, userId, userNome, motivo) => {
      const indicador = get().indicators.find((i) => i.id === id);
      if (!indicador) return;
      const now = new Date().toISOString();

      set((state) => ({
        indicators: state.indicators.map((ind) =>
          ind.id === id
            ? { ...ind, usuario_responsavel_id: novoResponsavelId, responsavel: novoResponsavelNome, atualizado_em: now }
            : ind,
        ),
        history: pushHistory(state.history, {
          indicador_id: id,
          usuario_alterou_id: userId,
          usuario_nome: userNome,
          tipo_alteracao: 'REATRIBUICAO',
          campo_alterado: 'responsavel',
          valor_anterior: indicador.responsavel,
          valor_novo: novoResponsavelNome,
          motivo: motivo ?? null,
        }),
      }));
    },

    addAnexo: (id, anexo, userId, userNome) => {
      const now = new Date().toISOString();
      set((state) => ({
        indicators: state.indicators.map((ind) =>
          ind.id === id ? { ...ind, anexos: [...ind.anexos, anexo], atualizado_em: now } : ind,
        ),
        history: pushHistory(state.history, {
          indicador_id: id,
          usuario_alterou_id: userId,
          usuario_nome: userNome,
          tipo_alteracao: 'EDICAO',
          campo_alterado: 'anexos',
          valor_anterior: null,
          valor_novo: anexo.nome_arquivo,
          motivo: 'Documento anexado',
        }),
      }));
    },

    removeAnexo: (id, anexoId) => {
      set((state) => ({
        indicators: state.indicators.map((ind) =>
          ind.id === id ? { ...ind, anexos: ind.anexos.filter((a) => a.id !== anexoId) } : ind,
        ),
      }));
    },

    createIndicador: (data, userId, userNome) => {
      const now = new Date().toISOString();
      const novo: Indicador = {
        id: newId('ind'),
        ...data,
        status: 'EM_ANDAMENTO',
        atendimento: 0,
        detalhamento: '',
        concluido_em: null,
        criado_em: now,
        atualizado_em: now,
        anexos: [],
      };

      set((state) => ({
        indicators: [novo, ...state.indicators],
        history: pushHistory(state.history, {
          indicador_id: novo.id,
          usuario_alterou_id: userId,
          usuario_nome: userNome,
          tipo_alteracao: 'CRIACAO',
          campo_alterado: null,
          valor_anterior: null,
          valor_novo: novo.id,
          motivo: 'Indicador criado',
        }),
      }));
    },

    deleteIndicador: (id) => {
      set((state) => ({ indicators: state.indicators.filter((ind) => ind.id !== id) }));
    },

    historyFor: (indicadorId) => get().history.filter((h) => h.indicador_id === indicadorId),

    // Nota que o colaborador escreveu na solicitação de conclusão em aberto (para a tela de Aprovações)
    notaConclusaoAtual: (indicadorId) => {
      const entrada = get()
        .history.filter((h) => h.indicador_id === indicadorId)
        .find((h) => h.tipo_alteracao === 'SOLICITACAO_CONCLUSAO');
      return entrada?.motivo ?? null;
    },
  };
});
