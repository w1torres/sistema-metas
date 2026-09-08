import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Indicador, IndicadorStatus } from '../../types';
import { STATUS_META } from '../../utils/constants';
import { calcularMediaPorColaborador } from '../../utils/ppr';

const STATUS_HEX: Record<IndicadorStatus, string> = {
  EM_ANDAMENTO: '#FFC107',
  AGUARDANDO_APROVACAO_GESTOR: '#0DCAF0',
  AGUARDANDO_APROVACAO_RH: '#0A7D3D',
  CONCLUIDO: '#0D9488',
  ATRASADO: '#DC3545',
  PAUSADO: '#6C757D',
};

const BRAND_GREEN = '#0A7D3D';

const FAKE_MONTHLY_SERIES = [
  { mes: 'Abr', realizacao: 18 },
  { mes: 'Mai', realizacao: 24 },
  { mes: 'Jun', realizacao: 29 },
  { mes: 'Jul', realizacao: 33 },
  { mes: 'Ago', realizacao: 41 },
  { mes: 'Set', realizacao: 39 },
];

interface BasicChartsProps {
  indicators: Indicador[];
}

export default function BasicCharts({ indicators }: BasicChartsProps) {
  const statusCounts = (Object.keys(STATUS_META) as IndicadorStatus[])
    .map((status) => ({
      status,
      name: STATUS_META[status].label,
      value: indicators.filter((i) => i.status === status).length,
    }))
    .filter((entry) => entry.value > 0);

  const byDepartamento = Array.from(new Set(indicators.map((i) => i.departamento))).map((departamento) => {
    const items = indicators.filter((i) => i.departamento === departamento);
    return { departamento, realizacao: Math.round(calcularMediaPorColaborador(items)) };
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-ink">Por Status</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusCounts} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
              {statusCounts.map((entry) => (
                <Cell key={entry.status} fill={STATUS_HEX[entry.status]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-ink">Realização ao Longo do Tempo</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={FAKE_MONTHLY_SERIES}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" />
            <XAxis dataKey="mes" fontSize={12} />
            <YAxis fontSize={12} unit="%" />
            <Tooltip />
            <Line type="monotone" dataKey="realizacao" stroke={BRAND_GREEN} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold text-ink">Por Departamento</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byDepartamento}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" />
            <XAxis dataKey="departamento" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
            <YAxis fontSize={12} unit="%" />
            <Tooltip />
            <Bar dataKey="realizacao" fill={BRAND_GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
