import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import SummaryCard from './SummaryCard';
import BasicCharts from '../charts/BasicCharts';
import Button from '../common/Button';
import { Select } from '../common/Input';
import { calcularMediaPorColaborador } from '../../utils/ppr';
import { getSafraAtual, getSafraForDate, listSafras } from '../../utils/safra';

const SAFRAS = listSafras();

export default function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const todosIndicadores = useIndicatorStore((s) => s.indicators);
  const navigate = useNavigate();
  const [safraId, setSafraId] = useState(getSafraAtual().id);

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

      <BasicCharts indicators={indicators} />
    </div>
  );
}
