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
  cpf?: string;
  dataNascimento?: string;
  dataAdmissao?: string;
  filial?: string;
  enderecoCompleto?: string;
  telefone?: string;
  celular?: string;
  departamentosAdicionais?: string[];
}

interface UserState {
  users: User[];
  addUser: (input: NewUserInput) => { ok: true; user: User } | { ok: false; error: string };
  updateUser: (id: string, input: NewUserInput) => { ok: true; user: User } | { ok: false; error: string };
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
    const cpfDigitos = input.cpf?.replace(/\D/g, '');
    if (cpfDigitos && get().users.some((u) => u.cpf?.replace(/\D/g, '') === cpfDigitos)) {
      return { ok: false, error: 'Já existe um usuário com este CPF.' };
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
      cpf: input.cpf?.trim() || undefined,
      ativo: true,
      dataNascimento: input.dataNascimento || undefined,
      dataAdmissao: input.dataAdmissao || undefined,
      filial: input.filial?.trim() || undefined,
      enderecoCompleto: input.enderecoCompleto?.trim() || undefined,
      telefone: input.telefone?.trim() || undefined,
      celular: input.celular?.trim() || undefined,
      departamentosAdicionais: input.departamentosAdicionais?.length ? input.departamentosAdicionais : undefined,
    };
    set((state) => ({ users: [...state.users, novo] }));
    return { ok: true, user: novo };
  },

  updateUser: (id, input) => {
    const email = input.email.trim().toLowerCase();
    if (get().users.some((u) => u.id !== id && u.email.toLowerCase() === email)) {
      return { ok: false, error: 'Já existe um usuário com este email.' };
    }
    const cpfDigitos = input.cpf?.replace(/\D/g, '');
    if (cpfDigitos && get().users.some((u) => u.id !== id && u.cpf?.replace(/\D/g, '') === cpfDigitos)) {
      return { ok: false, error: 'Já existe um usuário com este CPF.' };
    }

    let atualizado: User | undefined;
    set((state) => ({
      users: state.users.map((u) => {
        if (u.id !== id) return u;
        atualizado = {
          ...u,
          email,
          nome: input.nome.trim(),
          departamento_id: input.departamento_id,
          departamento: input.departamento,
          cargo: input.cargo,
          role: input.role,
          matricula: input.matricula,
          cpf: input.cpf?.trim() || undefined,
          dataNascimento: input.dataNascimento || undefined,
          dataAdmissao: input.dataAdmissao || undefined,
          filial: input.filial?.trim() || undefined,
          enderecoCompleto: input.enderecoCompleto?.trim() || undefined,
          telefone: input.telefone?.trim() || undefined,
          celular: input.celular?.trim() || undefined,
          departamentosAdicionais: input.departamentosAdicionais?.length ? input.departamentosAdicionais : undefined,
        };
        return atualizado;
      }),
    }));
    if (!atualizado) return { ok: false, error: 'Usuário não encontrado.' };
    return { ok: true, user: atualizado };
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
