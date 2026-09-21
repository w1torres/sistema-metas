import { useMemo, useState } from 'react';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useUserStore } from '../../store/userStore';
import { usePPRStore } from '../../store/pprStore';
import BasicCharts from '../charts/BasicCharts';
import NotasBonificacaoCard from '../bonificacao/NotasBonificacaoCard';
import Button from '../common/Button';
import { Select } from '../common/Input';
import { formatPercent } from '../../utils/formatters';
import { calcularMediaPorColaborador, calcularPercentualPonderado } from '../../utils/ppr';
import { getSafraAtual, getSafraForDate, listSafras } from '../../utils/safra';
import clsx from 'clsx';
import { downloadCSV, toCSV } from '../../utils/csv';
import type { Indicador, PPRFaixa, Role, User } from '../../types';

const SAFRAS = listSafras();

interface DepartamentoResumo {
  departamento: string;
  total: number;
  concluidos: number;
  emAndamento: number;
  atrasados: number;
  taxa: number;
}

interface ColaboradorResumo {
  responsavelId: string;
  responsavel: string;
  cargo: string;
  total: number;
  concluidos: number;
  percentualPonderado: number;
  faixa: PPRFaixa | undefined;
}

function summarizeByDepartamento(indicators: Indicador[]): DepartamentoResumo[] {
  const nomes = Array.from(new Set(indicators.map((i) => i.departamento)));
  return nomes.map((departamento) => {
    const items = indicators.filter((i) => i.departamento === departamento);
    const concluidos = items.filter((i) => i.status === 'CONCLUIDO').length;
    const emAndamento = items.filter((i) => i.status === 'EM_ANDAMENTO').length;
    const atrasados = items.filter((i) => i.status === 'ATRASADO').length;
    const taxa = calcularMediaPorColaborador(items);
    return { departamento, total: items.length, concluidos, emAndamento, atrasados, taxa: Math.round(taxa) };
  });
}

function summarizeByColaborador(
  indicators: Indicador[],
  users: User[],
  faixaPara: (role: Role, cargo: string | undefined, percentual: number) => PPRFaixa | undefined,
): ColaboradorResumo[] {
  const ids = Array.from(new Set(indicators.map((i) => i.usuario_responsavel_id)));
  return ids
    .map((responsavelId) => {
      const items = indicators.filter((i) => i.usuario_responsavel_id === responsavelId);
      const user = users.find((u) => u.id === responsavelId);
      const concluidos = items.filter((i) => i.status === 'CONCLUIDO').length;
      const percentualPonderado = calcularPercentualPonderado(items);
      const cargo = user?.cargo ?? 'NAO_DEFINIDO';
      return {
        responsavelId,
        responsavel: items[0].responsavel,
        cargo,
        total: items.length,
        concluidos,
        percentualPonderado: Math.round(percentualPonderado),
        faixa: user ? faixaPara(user.role, user.cargo, percentualPonderado) : undefined,
      };
    })
    .sort((a, b) => b.percentualPonderado - a.percentualPonderado);
}

export default function RelatoriosPage() {
  const todosIndicadores = useIndicatorStore((s) => s.indicators);
  const users = useUserStore((s) => s.users);
  const faixaPara = usePPRStore((s) => s.faixaPara);
  const [safraId, setSafraId] = useState(getSafraAtual().id);

  const indicators = useMemo(
    () => (safraId ? todosIndicadores.filter((i) => getSafraForDate(i.data_inicio).id === safraId) : todosIndicadores),
    [todosIndicadores, safraId],
  );

  const porDepartamento = useMemo(() => summarizeByDepartamento(indicators), [indicators]);
  const porColaborador = useMemo(
    () => summarizeByColaborador(indicators, users, faixaPara),
    [indicators, users, faixaPara],
  );

  function exportarPorDepartamento() {
    const header = ['Departamento', 'Total', 'Concluídos', 'Em Andamento', 'Atrasados', 'Média % Peso Concluído'];
    const rows = porDepartamento.map((d) => [d.departamento, d.total, d.concluidos, d.emAndamento, d.atrasados, `${d.taxa}%`]);
    downloadCSV('relatorio_por_departamento.csv', toCSV(header, rows));
  }

  function exportarPorColaborador() {
    const header = ['Responsável', 'Cargo', 'Total de Indicadores', 'Concluídos', '% Peso Concluído', 'Múltiplo PPR'];
    const rows = porColaborador.map((c) => [
      c.responsavel,
      c.cargo,
      c.total,
      c.concluidos,
      `${c.percentualPonderado}%`,
      c.faixa ? `${c.faixa.multiplo}x` : '-',
    ]);
    downloadCSV('relatorio_por_colaborador.csv', toCSV(header, rows));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Relatórios</h1>
          <p className="text-sm text-secondary">Consolidado de indicadores por departamento e por colaborador</p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Safra"
            value={safraId}
            onChange={setSafraId}
            placeholder="Todas"
            options={SAFRAS.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>
      </div>

      <BasicCharts indicators={indicators} />

      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Por Departamento</h2>
          <Button variant="secondary" size="sm" onClick={exportarPorDepartamento}>
            Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-secondary">
                <th className="py-2 pr-4">Departamento</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Concluídos</th>
                <th className="py-2 pr-4">Em Andamento</th>
                <th className="py-2 pr-4">Atrasados</th>
                <th className="py-2 pr-4">Média % Peso Concluído</th>
              </tr>
            </thead>
            <tbody>
              {porDepartamento.map((d) => (
                <tr key={d.departamento} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium text-ink">{d.departamento}</td>
                  <td className="py-2 pr-4">{d.total}</td>
                  <td className="py-2 pr-4">{d.concluidos}</td>
                  <td className="py-2 pr-4">{d.emAndamento}</td>
                  <td className="py-2 pr-4">{d.atrasados}</td>
                  <td className="py-2 pr-4">{formatPercent(d.taxa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Por Colaborador</h2>
          <Button variant="secondary" size="sm" onClick={exportarPorColaborador}>
            Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-secondary">
                <th className="py-2 pr-4">Responsável</th>
                <th className="py-2 pr-4">Cargo</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Concluídos</th>
                <th className="py-2 pr-4">% Peso Concluído</th>
                <th className="py-2 pr-4">Múltiplo PPR</th>
              </tr>
            </thead>
            <tbody>
              {porColaborador.map((c) => (
                <tr key={c.responsavelId} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium text-ink">{c.responsavel}</td>
                  <td className="py-2 pr-4 text-secondary">{c.cargo}</td>
                  <td className="py-2 pr-4">{c.total}</td>
                  <td className="py-2 pr-4">{c.concluidos}</td>
                  <td
                    className={clsx(
                      'py-2 pr-4 font-medium',
                      c.percentualPonderado >= 70
                        ? 'text-success'
                        : c.percentualPonderado >= 40
                          ? 'text-yellow-700'
                          : 'text-danger',
                    )}
                  >
                    {formatPercent(c.percentualPonderado)}
                  </td>
                  <td className="py-2 pr-4 font-semibold text-primary">{c.faixa ? `${c.faixa.multiplo}x` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NotasBonificacaoCard titulo="Avaliação de Desempenho e Bonificação por Colaborador" exportavel />
    </div>
  );
}
