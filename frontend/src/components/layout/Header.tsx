import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { ROLE_LABELS } from '../../utils/constants';
import { initials } from '../../utils/formatters';
import logo from '../../assets/favicon.png';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const departments = useDepartmentStore((s) => s.departments);
  const nomeDepartamento =
    user?.departamento || departments.find((d) => d.id === user?.departamento_id)?.nome || '';

  function handleLogout() {
    logout();
    toast.success('Sessão encerrada');
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-20 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Abrir menu"
          className="rounded p-2 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <img src={logo} alt="Logo" className="h-14 w-14" />
        <span className="text-lg font-bold text-primary">Sistema de Metas</span>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{user.nome}</p>
            <p className="text-xs text-secondary">
              {ROLE_LABELS[user.role]}
            </p>
            {nomeDepartamento && <p className="text-xs text-secondary">{nomeDepartamento}</p>}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {initials(user.nome)}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-secondary hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
