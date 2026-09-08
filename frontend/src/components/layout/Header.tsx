import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    toast.success('Sessão encerrada');
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Abrir menu"
          className="rounded p-2 hover:bg-gray-100 lg:hidden"
        >
          ☰
        </button>
        <span className="text-lg font-bold text-primary">Sistema de Metas</span>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{user.nome}</p>
            <p className="text-xs text-secondary">{ROLE_LABELS[user.role]}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {initials(user.nome)}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-secondary hover:bg-gray-50"
          >
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
