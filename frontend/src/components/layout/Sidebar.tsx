import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';

interface NavItem {
  label: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const indicators = useIndicatorStore((s) => s.indicators);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  let pendentesAprovacao = 0;
  if (user.role === 'GERENTE_DEPARTAMENTO') {
    pendentesAprovacao = indicators.filter(
      (i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR' && i.departamento_id === user.departamento_id,
    ).length;
  } else if (user.role === 'GERENTE_RH' || user.role === 'ADMIN') {
    pendentesAprovacao = indicators.filter(
      (i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR' || i.status === 'AGUARDANDO_APROVACAO_RH',
    ).length;
  }

  let items: NavItem[];
  if (user.role === 'COLABORADOR') {
    items = [{ label: 'Meus Indicadores', path: '/dashboard' }];
  } else if (user.role === 'GERENTE_DEPARTAMENTO') {
    items = [{ label: 'Aprovações', path: '/aprovacoes', badge: pendentesAprovacao }];
  } else if (user.role === 'GERENTE_RH') {
    items = [
      { label: 'Visão Geral', path: '/dashboard' },
      { label: 'Todos Indicadores', path: '/indicadores' },
      { label: 'Aprovações', path: '/aprovacoes', badge: pendentesAprovacao },
      { label: 'Relatórios', path: '/relatorios' },
      { label: 'Tabela PPR', path: '/ppr' },
    ];
  } else {
    items = [
      { label: 'Visão Geral', path: '/dashboard' },
      { label: 'Todos Indicadores', path: '/indicadores' },
      { label: 'Aprovações', path: '/aprovacoes', badge: pendentesAprovacao },
      { label: 'Relatórios', path: '/relatorios' },
      { label: 'Tabela PPR', path: '/ppr' },
      { label: 'Usuários', path: '/usuarios' },
    ];
  }

  function handleNavigate(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <nav
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-56 shrink-0 border-r border-border bg-white pt-16 transition-transform lg:static lg:z-0 lg:translate-x-0 lg:pt-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegação principal"
      >
        <ul className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-gray-50',
                  )}
                >
                  {item.label}
                  {!!item.badge && (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
