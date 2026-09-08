import { Navigate, Route, Routes } from 'react-router-dom';
import LoginScreen from './components/auth/LoginScreen';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import DashboardColaborador from './components/dashboard/DashboardColaborador';
import DashboardOverview from './components/dashboard/DashboardOverview';
import IndicadoresPage from './components/indicators/IndicadoresPage';
import RelatoriosPage from './components/reports/RelatoriosPage';
import UsuariosPage from './components/admin/UsuariosPage';
import PPRPage from './components/ppr/PPRPage';
import AprovacoesPage from './components/aprovacoes/AprovacoesPage';
import { useAuthStore } from './store/authStore';
import { APPROVER_ROLES, MANAGER_ROLES } from './utils/constants';

function Dashboard() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  if (user.role === 'COLABORADOR') return <DashboardColaborador />;
  // Gerente de Departamento não tem visão geral da empresa — vai direto para as aprovações do seu departamento
  if (user.role === 'GERENTE_DEPARTAMENTO') return <Navigate to="/aprovacoes" replace />;
  return <DashboardOverview />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/indicadores"
        element={
          <ProtectedRoute roles={MANAGER_ROLES}>
            <MainLayout>
              <IndicadoresPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute roles={MANAGER_ROLES}>
            <MainLayout>
              <RelatoriosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ppr"
        element={
          <ProtectedRoute roles={MANAGER_ROLES}>
            <MainLayout>
              <PPRPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprovacoes"
        element={
          <ProtectedRoute roles={APPROVER_ROLES}>
            <MainLayout>
              <AprovacoesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <MainLayout>
              <UsuariosPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
