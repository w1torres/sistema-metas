import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import SummaryCard from './SummaryCard';
import MeuPPRCard from '../ppr/MeuPPRCard';
import IndicadorCard from '../indicators/IndicadorCard';
import AnexarDocumentoModal from '../indicators/AnexarDocumentoModal';
import HistoricoModal from '../indicators/HistoricoModal';
import SolicitarConclusaoModal from '../indicators/SolicitarConclusaoModal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { getSafraAtual, getSafraForDate, listSafras } from '../../utils/safra';
import clsx from 'clsx';

type FiltroStatus = 'TODOS' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'CONCLUIDO';

const STATUS_PENDENTES = ['AGUARDANDO_APROVACAO_GESTOR', 'AGUARDANDO_APROVACAO_RH'];
const SAFRAS = listSafras();

const PAGE_STEP = 5;

export default function DashboardColaborador() {
  const user = useAuthStore((s) => s.user);
  const {
    indicators,
    solicitarConclusao,
    cancelarSolicitacao,
    desfazerConclusao,
    addAnexo,
    removeAnexo,
    historyFor,
    notaConclusaoAtual,
  } = useIndicatorStore();

  const [filtro, setFiltro] = useState<FiltroStatus>('TODOS');
  const [safraId, setSafraId] = useState(getSafraAtual().id);
  const [busca, setBusca] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [anexarId, setAnexarId] = useState<string | null>(null);
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null);

  const meusIndicadores = useMemo(
    () => indicators.filter((i) => i.usuario_responsavel_id === user?.id),
    [indicators, user],
  );

  const filtrados = useMemo(
    () =>
      meusIndicadores.filter((i) => {
        if (filtro === 'AGUARDANDO' && !STATUS_PENDENTES.includes(i.status)) return false;
        if (filtro !== 'TODOS' && filtro !== 'AGUARDANDO' && i.status !== filtro) return false;
        if (safraId && getSafraForDate(i.data_inicio).id !== safraId) return false;
        if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      }),
    [meusIndicadores, filtro, safraId, busca],
  );

  const visiveis = filtrados.slice(0, visibleCount);

  const total = meusIndicadores.length;
  const concluidos = meusIndicadores.filter((i) => i.status === 'CONCLUIDO').length;
  const aguardando = meusIndicadores.filter((i) => STATUS_PENDENTES.includes(i.status)).length;
  const emAndamento = total - concluidos - aguardando;

  const indicadorAnexar = indicators.find((i) => i.id === anexarId) ?? null;
  const indicadorHistorico = indicators.find((i) => i.id === historicoId) ?? null;
  const indicadorSolicitando = indicators.find((i) => i.id === solicitandoId) ?? null;

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Meus Indicadores</h1>
        <p className="text-sm text-secondary">Bem-vindo, {user.nome}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total de Indicadores" value={total} />
        <SummaryCard label="Concluídos" value={concluidos} accentClassName="text-success" />
        <SummaryCard label="Aguardando Aprovação" value={aguardando} accentClassName="text-primary" />
        <SummaryCard label="Em Andamento" value={emAndamento} accentClassName="text-warning" />
      </div>

      <MeuPPRCard cargo={user.cargo} indicadores={meusIndicadores} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['TODOS', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDO'] as FiltroStatus[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFiltro(opt)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filtro === opt ? 'bg-primary text-white' : 'bg-white text-secondary border border-border hover:bg-gray-50',
              )}
            >
              {opt === 'TODOS'
                ? 'Todos'
                : opt === 'EM_ANDAMENTO'
                  ? 'Em Andamento'
                  : opt === 'AGUARDANDO'
                    ? 'Aguardando Aprovação'
                    : 'Concluídos'}
            </button>
          ))}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="w-40 shrink-0">
            <Select
              label=""
              value={safraId}
              onChange={setSafraId}
              placeholder="Todas as safras"
              options={SAFRAS.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <div className="w-full sm:w-64">
            <Input label="" placeholder="Buscar indicador..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhum indicador encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visiveis.map((indicador) => (
            <IndicadorCard
              key={indicador.id}
              indicador={indicador}
              notaConclusao={notaConclusaoAtual(indicador.id)}
              onAbrirSolicitacao={() => setSolicitandoId(indicador.id)}
              onCancelarSolicitacao={() => {
                cancelarSolicitacao(indicador.id, user.id, user.nome);
                toast.success('Solicitação de conclusão cancelada.');
              }}
              onDesfazerConclusao={() => {
                desfazerConclusao(indicador.id, user.id, user.nome);
                toast.success('Marca de conclusão removida.');
              }}
              onAnexar={() => setAnexarId(indicador.id)}
              onHistorico={() => setHistoricoId(indicador.id)}
            />
          ))}
        </div>
      )}

      {visibleCount < filtrados.length && (
        <Button variant="secondary" onClick={() => setVisibleCount((v) => v + PAGE_STEP)} className="mx-auto">
          Carregar Mais...
        </Button>
      )}

      <SolicitarConclusaoModal
        isOpen={!!indicadorSolicitando}
        onClose={() => setSolicitandoId(null)}
        indicadorNome={indicadorSolicitando?.nome ?? ''}
        onConfirmar={(nota) => {
          solicitarConclusao(indicadorSolicitando!.id, user.id, user.nome, nota);
          toast.success('Solicitação enviada para aprovação do gestor do departamento.');
          setSolicitandoId(null);
        }}
      />

      <AnexarDocumentoModal
        isOpen={!!indicadorAnexar}
        onClose={() => setAnexarId(null)}
        onAnexar={(anexo) => addAnexo(indicadorAnexar!.id, anexo, user.id, user.nome)}
        anexosExistentes={indicadorAnexar?.anexos ?? []}
        onRemover={(anexoId) => removeAnexo(indicadorAnexar!.id, anexoId)}
      />

      <HistoricoModal
        isOpen={!!indicadorHistorico}
        onClose={() => setHistoricoId(null)}
        indicadorNome={indicadorHistorico?.nome ?? ''}
        eventos={indicadorHistorico ? historyFor(indicadorHistorico.id) : []}
      />
    </div>
  );
}
