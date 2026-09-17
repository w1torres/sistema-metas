import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import SummaryCard from './SummaryCard';
import DepartamentoCard from './DepartamentoCard';
import ColaboradoresModal, { type ColaboradorResumo } from './ColaboradoresModal';
import BasicCharts from '../charts/BasicCharts';
import Button from '../common/Button';
import { Select } from '../common/Input';
import { calcularMediaPorColaborador } from '../../utils/ppr';
import { getSafraAtual, getSafraForDate, listSafras } from '../../utils/safra';
import type { Indicador } from '../../types';

const SAFRAS = listSafras();

function resumoColaboradores(indicators: Indicador[], colaboradores: { id: string; nome: string; cargo: string }[]): ColaboradorResumo[] {
  return colaboradores.map((c) => {
    const doColaborador = indicators.filter((i) => i.usuario_responsavel_id === c.id);
    return {
      id: c.id,
      nome: c.nome,
      cargo: c.cargo,
      total: doColaborador.length,
      pendentes: doColaborador.filter((i) => i.status === 'EM_ANDAMENTO').length,
      emAprovacao: doColaborador.filter(
        (i) => i.status === 'AGUARDANDO_APROVACAO_GESTOR' || i.status === 'AGUARDANDO_APROVACAO_RH',
      ).length,
      concluidos: doColaborador.filter((i) => i.status === 'CONCLUIDO').length,
    };
  });
}

export default function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const todosIndicadores = useIndicatorStore((s) => s.indicators);
  const allUsers = useUserStore((s) => s.users);
  const departments = useDepartmentStore((s) => s.departments);
  const navigate = useNavigate();
  const [safraId, setSafraId] = useState(getSafraAtual().id);
  const [departamentoAberto, setDepartamentoAberto] = useState<string | null>(null);

  const indicators = useMemo(
    () => (safraId ? todosIndicadores.filter((i) => getSafraForDate(i.data_inicio).id === safraId) : todosIndicadores),
    [todosIndicadores, safraId],
  );

  if (!user) return null;

  const total = indicators.length;
  const concluidos = indicators.filter((i) => i.status === 'CONCLUIDO').length;
  const emAndamento = indicators.filter((i) => i.status === 'EM_ANDAMENTO').length;
  const atrasados = indicators.filter((i) => i.status === 'ATRASADO').length;
  const taxaMedia = Math.round(calcularMediaPorColaborador(indicators));

  // DashboardOverview só é alcançado por ADMIN/MASTER (MANAGER_ROLES) — quem
  // é GERENTES ou nível colaborador cai em DashboardColaborador (App.tsx),
  // sem visão multi-departamento nem acesso a /indicadores. Por isso as cards
  // de "Departamentos" abaixo são renderizadas sempre que esta página é
  // alcançada, sem precisar de um branch separado por role.
  const colaboradorUsers = allUsers.filter((u) => u.ativo && u.role !== 'ADMIN' && u.role !== 'MASTER');

  function irParaIndicadoresDoColaborador(nome: string) {
    setDepartamentoAberto(null);
    navigate(`/indicadores?busca=${encodeURIComponent(nome)}`);
  }

  const departamentoAtual = departments.find((d) => d.id === departamentoAberto) ?? null;
  const colaboradoresDoModal = departamentoAtual
    ? resumoColaboradores(
        indicators.filter((i) => i.departamento_id === departamentoAtual.id),
        colaboradorUsers.filter((u) => u.departamento_id === departamentoAtual.id),
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Visão Geral</h1>
          <p className="text-sm text-secondary">Bem-vindo, {user.nome}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <Select
              label="Safra"
              value={safraId}
              onChange={setSafraId}
              placeholder="Todas"
              options={SAFRAS.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <Button variant="secondary" onClick={() => navigate('/indicadores')}>
            Todos Indicadores
          </Button>
          <Button variant="secondary" onClick={() => navigate('/relatorios')}>
            Relatórios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Indicadores" value={total} />
        <SummaryCard label="Concluídos" value={concluidos} accentClassName="text-success" />
        <SummaryCard label="Em Andamento" value={emAndamento} accentClassName="text-warning" />
        <SummaryCard label="Atrasados" value={atrasados} accentClassName="text-danger" />
      </div>

      <SummaryCard label="Média de % Peso Concluído por Colaborador" value={`${taxaMedia}%`} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Departamentos</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {departments.map((dept) => {
            const doDept = indicators.filter((i) => i.departamento_id === dept.id);
            const totalDept = doDept.length;
            const pendentesDept = doDept.filter((i) => i.status === 'EM_ANDAMENTO').length;
            const concluidosDept = doDept.filter((i) => i.status === 'CONCLUIDO').length;
            const taxaDept = totalDept > 0 ? Math.round((concluidosDept / totalDept) * 100) : 0;
            return (
              <DepartamentoCard
                key={dept.id}
                nome={dept.nome}
                total={totalDept}
                pendentes={pendentesDept}
                taxaConclusao={taxaDept}
                onVerColaboradores={() => setDepartamentoAberto(dept.id)}
              />
            );
          })}
        </div>
      </div>

      <BasicCharts indicators={indicators} />

      <ColaboradoresModal
        isOpen={!!departamentoAtual}
        onClose={() => setDepartamentoAberto(null)}
        departamentoNome={departamentoAtual?.nome ?? ''}
        colaboradores={colaboradoresDoModal}
        onVerIndicadores={irParaIndicadoresDoColaborador}
      />
    </div>
  );
}
