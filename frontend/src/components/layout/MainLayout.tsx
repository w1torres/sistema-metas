import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { useUserStore } from '../../store/userStore';
import { usePPRStore } from '../../store/pprStore';
import { useTrilhaStore } from '../../store/trilhaStore';
import { useAtingimentoStore } from '../../store/atingimentoStore';
import { useIndicatorStore } from '../../store/indicatorStore';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const departamentos = useDepartmentStore((s) => s.departments);
  const fetchDepartamentos = useDepartmentStore((s) => s.fetchDepartamentos);
  const cargos = useCargoStore((s) => s.cargos);
  const fetchCargos = useCargoStore((s) => s.fetchCargos);
  const usuarios = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);
  const faixasPPR = usePPRStore((s) => s.faixas);
  const fetchFaixasPPR = usePPRStore((s) => s.fetchFaixas);
  const trilhas = useTrilhaStore((s) => s.trilhas);
  const fetchTrilhas = useTrilhaStore((s) => s.fetchTrilhas);
  const faixasAtingimento = useAtingimentoStore((s) => s.faixas);
  const fetchFaixasAtingimento = useAtingimentoStore((s) => s.fetchFaixas);
  const indicators = useIndicatorStore((s) => s.indicators);
  const fetchIndicadores = useIndicatorStore((s) => s.fetchIndicadores);

  // Carrega uma vez por sessão (guardas por lista vazia) — dado real do
  // backend, substitui o mockData.json que populava essas stores de cara.
  useEffect(() => {
    if (departamentos.length === 0) fetchDepartamentos().catch(() => {});
    if (cargos.length === 0) fetchCargos().catch(() => {});
    if (usuarios.length === 0) fetchUsers().catch(() => {});
    if (faixasPPR.length === 0) fetchFaixasPPR().catch(() => {});
    if (trilhas.length === 0) fetchTrilhas().catch(() => {});
    if (faixasAtingimento.length === 0) fetchFaixasAtingimento().catch(() => {});
    if (indicators.length === 0) fetchIndicadores().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
