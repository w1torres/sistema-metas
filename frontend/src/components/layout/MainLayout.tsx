import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { useUserStore } from '../../store/userStore';

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

  // Carrega uma vez por sessão (guardas por lista vazia) — dado real do
  // backend, substitui o mockData.json que populava essas stores de cara.
  useEffect(() => {
    if (departamentos.length === 0) fetchDepartamentos().catch(() => {});
    if (cargos.length === 0) fetchCargos().catch(() => {});
    if (usuarios.length === 0) fetchUsers().catch(() => {});
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
