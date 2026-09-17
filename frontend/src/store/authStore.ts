import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiClient, ApiClientError } from '../api/client';
import { mapUser, type BackendUser } from '../api/mappers';

interface LoginResult {
  ok: true;
}
interface LoginError {
  ok: false;
  error: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginSenha: (email: string, senha: string) => Promise<LoginResult | LoginError>;
  loginEntraId: (input: { idToken?: string; email?: string }) => Promise<LoginResult | LoginError>;
  logout: () => void;
}

function mensagemErro(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  return 'Não foi possível conectar ao servidor. Tente novamente.';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      loginSenha: async (email, senha) => {
        set({ isLoading: true });
        try {
          const data = await apiClient.post<{ token: string; user: BackendUser }>('/auth/login-senha', {
            email,
            senha,
          });
          set({ user: mapUser(data.user), token: data.token, isLoading: false });
          return { ok: true };
        } catch (err) {
          set({ isLoading: false });
          return { ok: false, error: mensagemErro(err) };
        }
      },

      loginEntraId: async (input) => {
        set({ isLoading: true });
        try {
          const data = await apiClient.post<{ token: string; user: BackendUser }>('/auth/entra', input);
          set({ user: mapUser(data.user), token: data.token, isLoading: false });
          return { ok: true };
        } catch (err) {
          set({ isLoading: false });
          return { ok: false, error: mensagemErro(err) };
        }
      },

      logout: () => set({ user: null, token: null }),
    }),
    { name: 'metas-auth' },
  ),
);
