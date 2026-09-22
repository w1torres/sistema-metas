import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useDepartmentStore } from '../../store/departmentStore';
import ColaboradorIndicadoresGroup from './ColaboradorIndicadoresGroup';
import EditIndicadorModal from './EditIndicadorModal';
import MudarResponsavelModal from './MudarResponsavelModal';
import HistoricoModal from './HistoricoModal';
import ImportPlanilhaModal from './ImportPlanilhaModal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { OPCOES_CARDS_POR_PAGINA, STATUS_META, STATUS_OPTIONS } from '../../utils/constants';
import { downloadCSV, toCSV } from '../../utils/csv';
import { getSafraAtual, getSafraForDate, listSafras } from '../../utils/safra';
import type { Indicador } from '../../types';

const SAFRAS = listSafras();

interface ColaboradorGrupo {
  responsavelId: string;
  responsavel: string;
  departamento: string;
  indicadores: Indicador[];
}

export default function IndicadoresPage() {
  const { indicators, historyFor } = useIndicatorStore();
  const departments = useDepartmentStore((s) => s.departments);

  const [searchParams, setSearchParams] = useSearchParams();

  const [departamento, setDepartamento] = useState('');
  const [status, setStatus] = useState('');
  const [safraId, setSafraId] = useState(getSafraAtual().id);
  const [busca, setBusca] = useState(searchParams.get('busca') ?? '');
  const [pagina, setPagina] = useState(1);
  const [cardsPorPagina, setCardsPorPagina] = useState<number>(OPCOES_CARDS_POR_PAGINA[0]);

  const [editando, setEditando] = useState<Indicador | null>(null);
  const [criando, setCriando] = useState(false);
  const [reatribuindo, setReatribuindo] = useState<Indicador | null>(null);
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [bulkExpanded, setBulkExpanded] = useState<boolean | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const filtrados = useMemo(
    () =>
      indicators.filter((i) => {
        if (departamento && i.departamento_id !== departamento) return false;
        if (status && i.status !== status) return false;
        if (safraId && getSafraForDate(i.data_inicio).id !== safraId) return false;
        if (busca) {
          const term = busca.toLowerCase();
          if (!i.nome.toLowerCase().includes(term) && !i.responsavel.toLowerCase().includes(term)) return false;
        }
        return true;
      }),
    [indicators, departamento, status, safraId, busca],
  );

  const grupos = useMemo(() => {
    const porResponsavel = new Map<string, ColaboradorGrupo>();
    filtrados.forEach((indicador) => {
      const existente = porResponsavel.get(indicador.usuario_responsavel_id);
      if (existente) {
        existente.indicadores.push(indicador);
      } else {
        porResponsavel.set(indicador.usuario_responsavel_id, {
          responsavelId: indicador.usuario_responsavel_id,
          responsavel: indicador.responsavel,
          departamento: indicador.departamento,
          indicadores: [indicador],
        });
      }
    });
    return Array.from(porResponsavel.values()).sort((a, b) => a.responsavel.localeCompare(b.responsavel));
  }, [filtrados]);

  const totalPaginas = Math.max(1, Math.ceil(grupos.length / cardsPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const gruposPaginados = grupos.slice((paginaAtual - 1) * cardsPorPagina, paginaAtual * cardsPorPagina);

  function handleCardsPorPaginaChange(value: string) {
    setCardsPorPagina(Number(value));
    setPagina(1);
  }

  useEffect(() => {
    if (searchParams.get('busca')) setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFiltro(setter: (value: string) => void, value: string) {
    setter(value);
    setPagina(1);
    setBulkExpanded(null);
  }

  const indicadorHistorico = indicators.find((i) => i.id === historicoId) ?? null;

  function handleExportCSV() {
    const header = ['Nome', 'Safra', 'Departamento', 'Responsável', 'Peso', 'Status', 'Início', 'Prazo'];
    const rows = filtrados.map((i) => [
      i.nome,
      getSafraForDate(i.data_inicio).label,
      i.departamento,
      i.responsavel,
      `${i.peso}%`,
      STATUS_META[i.status].label,
      i.data_inicio,
      i.data_fim,
    ]);
    downloadCSV('indicadores.csv', toCSV(header, rows));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Todos Indicadores</h1>
          <p className="text-sm text-secondary">
            {filtrados.length} indicador(es) de {grupos.length} colaborador(es)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCriando(true)}>+ Novo Indicador</Button>
          <Button variant="secondary" onClick={() => setImportando(true)}>
            Importar Planilha
          </Button>
          <Button variant="secondary" onClick={handleExportCSV}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <Select
          label="Safra"
          value={safraId}
          onChange={(value) => updateFiltro(setSafraId, value)}
          placeholder="Todas"
          options={SAFRAS.map((s) => ({ value: s.id, label: s.label }))}
        />
        <Select
          label="Departamento"
          value={departamento}
          onChange={(value) => updateFiltro(setDepartamento, value)}
          placeholder="Todos"
          options={departments.map((d) => ({ value: d.id, label: d.nome }))}
        />
        <Select
          label="Status"
          value={status}
          onChange={(value) => updateFiltro(setStatus, value)}
          placeholder="Todos"
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_META[s].label }))}
        />
        <Input
          label="Buscar"
          placeholder="Indicador ou responsável..."
          value={busca}
          onChange={(e) => updateFiltro(setBusca, e.target.value)}
        />
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhum indicador encontrado com os filtros atuais.
        </p>
      ) : (
        <>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBulkExpanded(true);
                setResetKey((k) => k + 1);
              }}
            >
              Expandir Todos
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setBulkExpanded(false);
                setResetKey((k) => k + 1);
              }}
            >
              Recolher Todos
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {gruposPaginados.map((grupo) => (
              <ColaboradorIndicadoresGroup
                key={`${grupo.responsavelId}-${resetKey}`}
                responsavel={grupo.responsavel}
                departamento={grupo.departamento}
                indicadores={grupo.indicadores}
                defaultExpanded={bulkExpanded ?? grupos.length <= 10}
                onEditar={setEditando}
                onMudarResponsavel={setReatribuindo}
                onHistorico={(indicador) => setHistoricoId(indicador.id)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {totalPaginas > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={paginaAtual === 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-secondary">
                  Página {paginaAtual} de {totalPaginas} ({grupos.length} colaboradores)
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                </Button>
              </>
            )}
            <div className="w-36">
              <Select
                label="Cards por página"
                value={String(cardsPorPagina)}
                onChange={handleCardsPorPaginaChange}
                options={OPCOES_CARDS_POR_PAGINA.map((n) => ({ value: String(n), label: String(n) }))}
              />
            </div>
          </div>
        </>
      )}

      <EditIndicadorModal isOpen={!!editando} onClose={() => setEditando(null)} indicador={editando} />
      <EditIndicadorModal isOpen={criando} onClose={() => setCriando(false)} indicador={null} />
      <MudarResponsavelModal isOpen={!!reatribuindo} onClose={() => setReatribuindo(null)} indicador={reatribuindo} />
      <ImportPlanilhaModal isOpen={importando} onClose={() => setImportando(false)} />
      <HistoricoModal
        isOpen={!!indicadorHistorico}
        onClose={() => setHistoricoId(null)}
        indicadorNome={indicadorHistorico?.nome ?? ''}
        eventos={indicadorHistorico ? historyFor(indicadorHistorico.id) : []}
      />
    </div>
  );
}
