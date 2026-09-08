import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { useUserStore } from './userStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: (email: string) => {
        const found = useUserStore.getState().findByEmail(email);
        if (!found) {
          return { ok: false, error: 'Usuário não encontrado. Use um dos emails de exemplo ou peça a um administrador para cadastrá-lo.' };
        }
        if (!found.ativo) {
          return { ok: false, error: 'Usuário inativo.' };
        }
        set({ user: found, token: `mock-jwt-${found.id}` });
        return { ok: true };
      },

      logout: () => set({ user: null, token: null }),
    }),
    { name: 'metas-auth' },
  ),
);
