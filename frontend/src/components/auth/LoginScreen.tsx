import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Input } from '../common/Input';
import Button from '../common/Button';
import { validateEmail } from '../../utils/validators';
import { ROLE_LABELS } from '../../utils/constants';
import type { User } from '../../types';

export default function LoginScreen() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const demoUsers = useUserStore((s) => s.users).filter((u) => u.ativo);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!senha) {
      setError('Informe uma senha (qualquer valor no protótipo).');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      const result = login(email);
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard', { replace: true });
    }, 400);
  }

  function quickLogin(user: User) {
    setEmail(user.email);
    setSenha('demo');
    setError(null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-ink">Sistema de Metas</h1>
          <p className="mt-1 text-sm text-secondary">Acompanhamento de Indicadores e Metas</p>
        </div>

        <button
          type="button"
          disabled
          title="Disponível na Etapa 2 (integração Entra ID)"
          className="mb-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md border border-border bg-gray-50 px-4 py-2 text-sm font-medium text-secondary"
        >
          Entrar com Microsoft
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-secondary">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            required
          />
          <Input
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="qualquer valor (protótipo)"
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-secondary">Usuários de demonstração:</p>
          <div className="grid grid-cols-1 gap-1.5">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => quickLogin(user)}
                className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-left text-xs hover:bg-gray-50"
              >
                <span>
                  <span className="font-medium text-ink">{user.nome}</span>{' '}
                  <span className="text-secondary">({user.email})</span>
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
                  {ROLE_LABELS[user.role]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-secondary">© 2026 Empresa</p>
      </div>
    </div>
  );
}
