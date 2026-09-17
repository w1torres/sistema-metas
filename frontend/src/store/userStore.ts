import { create } from 'zustand';
import type { Role, User } from '../types';
import { apiClient, ApiClientError } from '../api/client';
import { mapUser, type BackendUser } from '../api/mappers';
import { useCargoStore } from './cargoStore';

interface NewUserInput {
  nome: string;
  // Opcional: sem email, o usuário fica cadastrado mas sem acesso — precisa
  // de CPF pra poder ser identificado/vinculado depois (ver addUser).
  email?: string;
  departamento_id: string;
  departamento: string;
  cargo: string;
  role: Role;
  cpf?: string;
  dataNascimento?: string;
  dataAdmissao?: string;
  filial?: string;
  departamentosAdicionais?: string[];
}

type SalvarResultado = { ok: true; user: User } | { ok: false; error: string };

interface UserState {
  users: User[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  addUser: (input: NewUserInput) => Promise<SalvarResultado>;
  updateUser: (id: string, input: NewUserInput) => Promise<SalvarResultado>;
  toggleAtivo: (id: string) => Promise<void>;
  removeUser: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  findByEmail: (email: string) => User | undefined;
  findByCpf: (cpf: string) => User | undefined;
  findOrCreateColaborador: (input: {
    nome: string;
    email: string;
    departamento_id: string;
    departamento: string;
    cargo?: string;
  }) => Promise<User>;
}

// "cargo" no frontend é um nome direto no usuário — o backend modela cargo
// como entidade própria (cargo_id), resolvido aqui via cargoStore (que já
// fez o findOrCreate antes de chegar aqui, ver UsuarioModal.tsx).
// "departamento" (nome) não vai no payload — o backend devolve o nome via
// join a partir do departamento_id, que já chega resolvido pelos callers.
function paraPayload(input: NewUserInput) {
  return {
    nome: input.nome,
    email: input.email || null,
    cpf: input.cpf || null,
    departamento_id: input.departamento_id,
    cargo_id: input.cargo ? (useCargoStore.getState().getIdByName(input.cargo) ?? null) : null,
    role: input.role,
    data_nascimento: input.dataNascimento || null,
    data_admissao: input.dataAdmissao || null,
    filial: input.filial || null,
  };
}

function mensagemErro(err: unknown, fallback: string): string {
  return err instanceof ApiClientError ? err.message : fallback;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true });
    try {
      const data = await apiClient.get<BackendUser[]>('/users');
      set({ users: data.map(mapUser), loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  addUser: async (input) => {
    try {
      const criado = await apiClient.post<BackendUser>('/users', paraPayload(input));
      const novo = mapUser(criado);
      set((state) => ({ users: [...state.users, novo] }));
      return { ok: true, user: novo };
    } catch (err) {
      return { ok: false, error: mensagemErro(err, 'Não foi possível salvar o usuário.') };
    }
  },

  updateUser: async (id, input) => {
    try {
      const atualizado = await apiClient.put<BackendUser>(`/users/${id}`, paraPayload(input));
      const mapeado = mapUser(atualizado);
      set((state) => ({ users: state.users.map((u) => (u.id === id ? mapeado : u)) }));
      return { ok: true, user: mapeado };
    } catch (err) {
      return { ok: false, error: mensagemErro(err, 'Não foi possível salvar o usuário.') };
    }
  },

  toggleAtivo: async (id) => {
    const atual = get().users.find((u) => u.id === id);
    if (!atual) return;
    const atualizado = await apiClient.patch<BackendUser>(`/users/${id}/ativo`, { ativo: !atual.ativo });
    const mapeado = mapUser(atualizado);
    set((state) => ({ users: state.users.map((u) => (u.id === id ? mapeado : u)) }));
  },

  // Exclusão definitiva — a UI (UsuariosPage) já garante antes de chamar isso
  // que não é o próprio usuário logado; o backend também garante (400) e
  // recusa (409) se o usuário ainda for responsável por algum indicador.
  removeUser: async (id) => {
    try {
      await apiClient.delete(`/users/${id}`);
      set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: mensagemErro(err, 'Não foi possível excluir o usuário.') };
    }
  },

  findByEmail: (email) => get().users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase()),

  // Suporte ao fluxo "importar só com CPF, vincular depois": um admin usa
  // isso pra achar o cadastro pendente do colaborador pelo CPF (documento
  // estável, ao contrário do email que ainda não existe) e completar com o
  // email/Entra ID quando o acesso for liberado.
  findByCpf: (cpf) => {
    const digitos = cpf.replace(/\D/g, '');
    if (!digitos) return undefined;
    return get().users.find((u) => u.cpf?.replace(/\D/g, '') === digitos);
  },

  findOrCreateColaborador: async ({ nome, email, departamento_id, departamento, cargo }) => {
    const existing = get().findByEmail(email);
    if (existing) return existing;

    const resultado = await get().addUser({
      nome,
      email,
      departamento_id,
      departamento,
      cargo: cargo?.trim() ?? '',
      role: 'COLABORADOR',
    });
    if (!resultado.ok) throw new Error(resultado.error);
    return resultado.user;
  },
}));
