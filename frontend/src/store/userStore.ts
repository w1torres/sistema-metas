import { create } from 'zustand';
import type { Role, User } from '../types';
import mockData from '../data/mockData.json';

const CARGO_PADRAO = 'NAO_DEFINIDO';

interface NewUserInput {
  nome: string;
  email: string;
  departamento_id: string;
  departamento: string;
  cargo: string;
  role: Role;
  matricula?: string;
}

interface UserState {
  users: User[];
  addUser: (input: NewUserInput) => { ok: true; user: User } | { ok: false; error: string };
  toggleAtivo: (id: string) => void;
  findByEmail: (email: string) => User | undefined;
  findOrCreateColaborador: (input: {
    nome: string;
    email: string;
    departamento_id: string;
    departamento: string;
    cargo?: string;
  }) => User;
}

function newId(): string {
  return `user-${crypto.randomUUID().slice(0, 8)}`;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: mockData.users as User[],

  addUser: (input) => {
    const email = input.email.trim().toLowerCase();
    if (get().users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Já existe um usuário com este email.' };
    }
    const novo: User = {
      id: newId(),
      email,
      nome: input.nome.trim(),
      departamento_id: input.departamento_id,
      departamento: input.departamento,
      cargo: input.cargo,
      role: input.role,
      matricula: input.matricula,
      ativo: true,
    };
    set((state) => ({ users: [...state.users, novo] }));
    return { ok: true, user: novo };
  },

  toggleAtivo: (id) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u)),
    }));
  },

  findByEmail: (email) => get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()),

  findOrCreateColaborador: ({ nome, email, departamento_id, departamento, cargo }) => {
    const existing = get().findByEmail(email);
    if (existing) return existing;

    const novo: User = {
      id: newId(),
      email: email.trim().toLowerCase(),
      nome: nome.trim(),
      departamento_id,
      departamento,
      cargo: cargo?.trim() ? cargo.trim().toUpperCase() : CARGO_PADRAO,
      role: 'COLABORADOR',
      ativo: true,
    };
    set((state) => ({ users: [...state.users, novo] }));
    return novo;
  },
}));
