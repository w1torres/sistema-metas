import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { construirEvolucaoPorIndicador } from '../../utils/evolucao';
import type { Indicador } from '../../types';

const CORES = ['#0A7D3D', '#0DCAF0', '#FFC107', '#DC3545', '#6F42C1', '#FD7E14', '#20C997', '#6C757D'];

interface EvolucaoIndicadoresChartProps {
  indicadores: Indicador[];
}

interface TooltipEntry {
  dataKey: string;
  name: string;
  value: number | null;
  color: string;
}

function ChartTooltip({
  active,
  label,
  payload,
  indicadorPorId,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  indicadorPorId: Map<string, Indicador>;
}) {
  if (!active || !payload?.length) return null;
  const entradas = payload.filter((p) => p.value != null);
  if (entradas.length === 0) return null;

  return (
    <div className="rounded-md border border-border bg-white p-2.5 text-xs shadow-md">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      <ul className="flex flex-col gap-1">
        {entradas.map((entrada) => {
          const indicador = indicadorPorId.get(entrada.dataKey);
          return (
            <li key={entrada.dataKey}>
              <span className="font-medium" style={{ color: entrada.color }}>
                {entrada.name}
              </span>
              : {entrada.value}%
              {indicador?.status === 'CONCLUIDO' && (
                <span className="text-secondary"> (atingimento: {indicador.atendimento}%)</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function EvolucaoIndicadoresChart({ indicadores }: EvolucaoIndicadoresChartProps) {
  const { pontos, series } = construirEvolucaoPorIndicador(indicadores);
  const temDados = series.length > 0 && pontos.length > 0;
  const indicadorPorId = new Map(indicadores.map((i) => [i.id, i]));

  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-ink">Evolução por Indicador</h3>
      <p className="mb-2 text-xs text-secondary">
        Progresso (conclusão) de cada indicador ao longo do tempo. Indicadores mensais mostram o % de meses aprovados;
        indicadores anuais saltam para 100% na conclusão — a nota de atingimento fica no card de cada indicador.
      </p>
      {!temDados ? (
        <p className="flex h-[260px] items-center justify-center text-center text-sm text-secondary">
          Nenhum indicador no período selecionado.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={pontos} margin={{ top: 12, right: 12, left: -10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" />
            <XAxis dataKey="mes" fontSize={12} />
            <YAxis fontSize={12} unit="%" domain={[0, 100]} />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  label={props.label as string | undefined}
                  payload={props.payload as unknown as TooltipEntry[] | undefined}
                  indicadorPorId={indicadorPorId}
                />
              )}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {series.map((serie, idx) => (
              <Line
                key={serie.id}
                type="monotone"
                dataKey={serie.id}
                name={serie.nome}
                stroke={CORES[idx % CORES.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
