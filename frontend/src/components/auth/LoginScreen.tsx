import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../common/Input';
import Button from '../common/Button';
import { validateEmail } from '../../utils/validators';
import { isCorporateEmail, loginComEntraId, msalModoLocal } from '../../utils/entraId';
import logo from '../../assets/favicon.png';

export default function LoginScreen() {
  const navigate = useNavigate();
  const loginSenha = useAuthStore((s) => s.loginSenha);
  const loginEntraId = useAuthStore((s) => s.loginEntraId);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const corporativo = useMemo(() => isCorporateEmail(email), [email]);

  async function irParaDashboard() {
    toast.success('Login realizado com sucesso!');
    navigate('/dashboard', { replace: true });
  }

  // Só em build de dev (`npm run dev`) — some do `npm run build`, então nunca
  // aparece em produção. Contas fixas do seed local (ver 01_seed_all.ts) só
  // pra evitar redigitar email/senha a cada teste manual.
  async function handleLoginRapido(emailConta: string) {
    setError(null);
    setEmail(emailConta);
    setSenha('senha123');
    setLoading(true);
    const result = await loginSenha(emailConta, 'senha123');
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await irParaDashboard();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    if (corporativo) {
      setError('Este e-mail é corporativo — entre com "Entrar com Microsoft" abaixo.');
      return;
    }
    if (!senha) {
      setError('Informe sua senha.');
      return;
    }

    setLoading(true);
    setError(null);
    const result = await loginSenha(email, senha);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await irParaDashboard();
  }

  async function handleEntraId() {
    setError(null);

    if (msalModoLocal) {
      const emailError = validateEmail(email);
      if (emailError || !isCorporateEmail(email)) {
        setError('Informe um e-mail corporativo no campo acima antes de entrar com Microsoft (modo local).');
        return;
      }
      setLoading(true);
      const result = await loginEntraId({ email });
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await irParaDashboard();
      return;
    }

    setLoading(true);
    try {
      const idToken = await loginComEntraId();
      const result = await loginEntraId({ idToken });
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await irParaDashboard();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Não foi possível entrar com Microsoft.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <img src={logo} alt="Logo" className="mx-auto mb-3 h-24 w-24" />
          <h1 className="text-2xl font-bold text-ink">Sistema de Metas</h1>
          <p className="mt-1 text-sm text-secondary">Acompanhamento de Indicadores e Metas</p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleEntraId}
          loading={loading}
          className="mb-4 w-full"
        >
          Entrar com Microsoft
        </Button>
        {msalModoLocal && (
          <p className="mb-4 -mt-2 text-center text-xs text-secondary">
            Modo local: digite um e-mail corporativo abaixo e clique em "Entrar com Microsoft" (sem popup real).
          </p>
        )}

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
          {!corporativo && (
            <Input
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          )}
          {corporativo && (
            <p className="text-xs text-secondary">
              E-mail corporativo — use o botão "Entrar com Microsoft" acima em vez de senha.
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {!corporativo && (
            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          )}
        </form>

        {import.meta.env.DEV && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="mb-2 text-center text-xs font-medium text-secondary">
              Modo local — contas de teste (seed)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                loading={loading}
                onClick={() => handleLoginRapido('admin@empresa.com')}
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                loading={loading}
                onClick={() => handleLoginRapido('teste@empresa.com')}
              >
                Colaborador de Teste
              </Button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-secondary">© 2026 Empresa</p>
      </div>
    </div>
  );
}
