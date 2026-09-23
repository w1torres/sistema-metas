import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckSquare,
  Gift,
  LayoutDashboard,
  ListChecks,
  Table2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useUserStore } from '../../store/userStore';
import {
  COLABORADOR_TIER_ROLES,
  departamentosDoGestor,
  ehGerenteDeMarketing,
  ehGestorDepartamento,
} from '../../utils/constants';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const indicators = useIndicatorStore((s) => s.indicators);
  const users = useUserStore((s) => s.users);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // Coordenador/Supervisor só vira "gestor de departamento" (mesmo nível de
  // GERENTES pra aprovação) quando o departamento dele não tem nenhum
  // Gerente ativo — ver ehGestorDepartamento e AprovacoesPage.
  const souGestorDepartamento = user.role === 'GERENTES' || ehGestorDepartamento(user, users);

  let pendentesAprovacao = 0;
  if (souGestorDepartamento) {
    const meusDepartamentos = departamentosDoGestor(user);
    pendentesAprovacao = indicators.filter(
      (i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR' && meusDepartamentos.includes(i.departamento_id),
    ).length;
  } else if (user.role === 'MASTER') {
    // Só MASTER faz a etapa final (AGUARDANDO_APROVACAO_RH) — ver AprovacoesPage.
    pendentesAprovacao = indicators.filter(
      (i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR' || i.status === 'AGUARDANDO_APROVACAO_RH',
    ).length;
  } else if (user.role === 'ADMIN') {
    pendentesAprovacao = indicators.filter((i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR').length;
  }

  let items: NavItem[];
  if (souGestorDepartamento) {
    items = [
      { label: 'Meus Indicadores', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Aprovações', path: '/aprovacoes', icon: CheckSquare, badge: pendentesAprovacao },
      // Gerente de Marketing também gerencia a Bonificação (fornecedor/valor/
      // participantes) — ver ehGerenteDeMarketing e BonificacaoPage.
      ...(ehGerenteDeMarketing(user) ? [{ label: 'Bonificação', path: '/bonificacao', icon: Gift }] : []),
    ];
  } else if (COLABORADOR_TIER_ROLES.includes(user.role)) {
    items = [{ label: 'Meus Indicadores', path: '/dashboard', icon: LayoutDashboard }];
  } else if (user.role === 'MASTER') {
    items = [
      { label: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Todos Indicadores', path: '/indicadores', icon: ListChecks },
      { label: 'Aprovações', path: '/aprovacoes', icon: CheckSquare, badge: pendentesAprovacao },
      { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
      { label: 'Tabelas', path: '/ppr', icon: Table2 },
      { label: 'Usuários', path: '/usuarios', icon: Users },
      { label: 'Bonificação', path: '/bonificacao', icon: Gift },
    ];
  } else {
    items = [
      { label: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Todos Indicadores', path: '/indicadores', icon: ListChecks },
      { label: 'Aprovações', path: '/aprovacoes', icon: CheckSquare, badge: pendentesAprovacao },
      { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
      { label: 'Tabelas', path: '/ppr', icon: Table2 },
      { label: 'Usuários', path: '/usuarios', icon: Users },
      { label: 'Bonificação', path: '/bonificacao', icon: Gift },
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
          'fixed inset-y-0 left-0 z-40 w-56 shrink-0 border-r border-border bg-white pt-20 transition-transform lg:static lg:z-0 lg:translate-x-0 lg:pt-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Navegação principal"
      >
        <ul className="flex flex-col gap-1 p-4">
          {items.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
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
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </span>
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
