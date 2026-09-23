import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useUserStore } from '../../store/userStore';
import HistoricoModal from '../indicators/HistoricoModal';
import RejeitarModal from './RejeitarModal';
import AprovarModal from './AprovarModal';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { formatMes, listarMesesDoPeriodo, mesAtual } from '../../utils/meses';
import { departamentosDoGestor, ehGestorDepartamento } from '../../utils/constants';
import type { Indicador } from '../../types';

type Etapa = 'GESTOR' | 'RH' | 'MES' | 'FINAL';

type ItemPendente =
  | { key: string; etapa: 'GESTOR'; indicador: Indicador; nota: string | null }
  | { key: string; etapa: 'MES'; indicador: Indicador; mes: string; nota: string | null }
  | { key: string; etapa: 'FINAL'; indicador: Indicador }
  | { key: string; etapa: 'RH'; indicador: Indicador; nota: string | null; observacaoAnterior: string | null };

interface ColaboradorGrupo {
  userId: string;
  nome: string;
  cargo: string;
  departamentoId: string;
  departamento: string;
  itens: ItemPendente[];
}

interface DepartamentoGrupo {
  departamentoId: string;
  departamento: string;
  colaboradores: ColaboradorGrupo[];
  totalItens: number;
}

interface ItemPendenteRowProps {
  item: ItemPendente;
  somenteLeitura: boolean;
  onAprovar: (item: ItemPendente) => void;
  onRejeitar: (item: ItemPendente) => void;
  onVerHistorico: (indicador: Indicador) => void;
}

function ItemPendenteRow({ item, somenteLeitura, onAprovar, onRejeitar, onVerHistorico }: ItemPendenteRowProps) {
  const { indicador } = item;

  if (item.etapa === 'FINAL') {
    const meses = listarMesesDoPeriodo(indicador.data_inicio, indicador.data_fim);
    const aprovados = meses.filter((mes) => indicador.registrosMensais?.find((r) => r.mes === mes)?.status === 'APROVADO').length;
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border bg-gray-50/60 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{indicador.nome}</p>
            <p className="text-xs text-secondary">
              Peso: {indicador.peso}% · Prazo: {formatDate(indicador.data_fim)} · {aprovados} de {meses.length} meses aprovados
            </p>
          </div>
          <Button size="sm" onClick={() => onAprovar(item)}>
            Validar Final
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => onVerHistorico(indicador)}>
          Ver Histórico
        </Button>
      </div>
    );
  }

  const titulo = item.etapa === 'MES' ? `${indicador.nome} — ${formatMes(item.mes)}` : indicador.nome;
  const nota = item.etapa === 'RH' || item.etapa === 'GESTOR' || item.etapa === 'MES' ? item.nota : null;
  const observacaoAnterior = item.etapa === 'RH' ? item.observacaoAnterior : null;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-gray-50/60 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{titulo}</p>
          <p className="text-xs text-secondary">
            Peso: {indicador.peso}% · Prazo: {formatDate(indicador.data_fim)}
          </p>
        </div>
        {somenteLeitura ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-secondary">
            Aguardando o gestor do departamento
          </span>
        ) : (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" onClick={() => onAprovar(item)}>
              Aprovar
            </Button>
            <Button variant="danger" size="sm" onClick={() => onRejeitar(item)}>
              Rejeitar
            </Button>
          </div>
        )}
      </div>

      {nota && (
        <p className="rounded-md bg-white p-2 text-xs text-secondary">
          <span className="font-medium text-ink">Observação do colaborador: </span>
          {nota}
        </p>
      )}
      {observacaoAnterior && (
        <p className="rounded-md bg-primary/5 p-2 text-xs text-secondary">
          <span className="font-medium text-ink">Observação do gestor: </span>
          {observacaoAnterior}
        </p>
      )}
      {indicador.anexos.length > 0 && (
        <ul className="flex flex-col gap-1">
          {indicador.anexos.map((anexo) => (
            <li key={anexo.id} className="flex items-center gap-1.5 text-xs text-secondary">
              📎 {anexo.nome_arquivo} <span className="text-secondary/70">({formatFileSize(anexo.tamanho_bytes)})</span>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" size="sm" className="w-fit" onClick={() => onVerHistorico(indicador)}>
        Ver Histórico
      </Button>
    </div>
  );
}

interface AprovacaoColaboradorCardProps {
  grupo: ColaboradorGrupo;
  podeAprovar: (indicador: Indicador) => boolean;
  onAprovar: (item: ItemPendente) => void;
  onRejeitar: (item: ItemPendente) => void;
  onVerHistorico: (indicador: Indicador) => void;
}

function AprovacaoColaboradorCard({ grupo, podeAprovar, onAprovar, onRejeitar, onVerHistorico }: AprovacaoColaboradorCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div>
        <p className="font-semibold text-ink">{grupo.nome}</p>
        <p className="text-xs text-secondary">
          {grupo.cargo} · {grupo.itens.length} pendente(s)
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {grupo.itens.map((item) => (
          <ItemPendenteRow
            key={item.key}
            item={item}
            somenteLeitura={item.etapa === 'GESTOR' || item.etapa === 'MES' ? !podeAprovar(item.indicador) : false}
            onAprovar={onAprovar}
            onRejeitar={onRejeitar}
            onVerHistorico={onVerHistorico}
          />
        ))}
      </div>
    </div>
  );
}

interface ResumoCardProps {
  titulo: string;
  subtitulo?: string;
  totalItens: number;
  botaoLabel: string;
  ativo?: boolean;
  onAbrir: () => void;
}

function ResumoCard({ titulo, subtitulo, totalItens, botaoLabel, ativo, onAbrir }: ResumoCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border bg-white p-4 shadow-sm ${ativo ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
    >
      <div>
        <p className="font-semibold text-ink">{titulo}</p>
        {subtitulo && <p className="text-xs text-secondary">{subtitulo}</p>}
      </div>
      <p className="text-sm text-secondary">{totalItens} pendente(s)</p>
      <Button variant="secondary" size="sm" onClick={onAbrir}>
        {botaoLabel}
      </Button>
    </div>
  );
}

export default function AprovacoesPage() {
  const user = useAuthStore((s) => s.user);
  const indicators = useIndicatorStore((s) => s.indicators);
  const departments = useDepartmentStore((s) => s.departments);
  const {
    aprovarGestor,
    rejeitarGestor,
    aprovarRH,
    rejeitarRH,
    aprovarMes,
    rejeitarMes,
    validarPeriodoFinal,
    notaConclusaoAtual,
    observacaoGestor,
    historyFor,
    fetchHistorico,
  } = useIndicatorStore();
  const users = useUserStore((s) => s.users);
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [rejeitando, setRejeitando] = useState<{ indicador: Indicador; etapa: Etapa; mes?: string } | null>(null);
  const [aprovando, setAprovando] = useState<{ indicador: Indicador; etapa: Etapa; mes?: string } | null>(null);
  const [busca, setBusca] = useState('');
  const [departamentoFiltro, setDepartamentoFiltro] = useState('');
  const [departamentoAberto, setDepartamentoAberto] = useState<string | null>(null);
  const [colaboradorAberto, setColaboradorAberto] = useState<string | null>(null);

  if (!user) return null;

  const isRHouAdmin = user.role === 'MASTER' || user.role === 'ADMIN';
  const isGestorDepartamento = ehGestorDepartamento(user, users);
  // Coordenador/Supervisor só chega aqui (ver APPROVER_ROLES) quando lidera
  // ALGUM departamento sem Gerente — se não lidera nenhum, essa página não
  // tem nada pra ele (não é RH/Admin nem gestor de fato): manda pro dashboard
  // em vez de mostrar a fila de outros departamentos sem poder agir nela.
  if (!isRHouAdmin && !isGestorDepartamento) {
    return <Navigate to="/dashboard" replace />;
  }
  // Aprovação final (AGUARDANDO_APROVACAO_RH -> CONCLUIDO) e a validação
  // final de indicador mensal são exclusivas de MASTER — ADMIN tem acesso
  // amplo a tudo mais (ver 1º nível/visão por departamento), mas não a essa
  // etapa (decisão confirmada: só MASTER aprova PPR/etapa final de RH).
  const podeAprovarFinal = user.role === 'MASTER';

  // O gestor pode ter indicadores próprios (ver "Meus Indicadores"). Quando o
  // indicador pendente é dele mesmo, ele não pode se auto-aprovar — e como só
  // existe um gestor por departamento neste modelo, não haveria mais ninguém
  // para aprovar o 1º nível. Nesse caso específico (responsável é o próprio
  // gestor do departamento), o RH/Admin assume a aprovação de 1º nível.
  const podeAprovar = (indicador: Indicador) => {
    if (indicador.usuario_responsavel_id === user.id) return false;
    if (isGestorDepartamento) return true;
    if (isRHouAdmin) {
      const responsavel = users.find((u) => u.id === indicador.usuario_responsavel_id);
      return responsavel?.role === 'GERENTES';
    }
    return false;
  };

  const combinaBusca = (i: Indicador) => {
    if (!busca.trim()) return true;
    const termo = busca.trim().toLowerCase();
    return i.nome.toLowerCase().includes(termo) || i.responsavel.toLowerCase().includes(termo);
  };
  const combinaDepartamento = (i: Indicador) => !departamentoFiltro || i.departamento_id === departamentoFiltro;

  // Um GERENTES pode responder por mais de um departamento (ex.: gerente
  // administrativo que também aprova Compras, Estoque e Faturamento) — ver
  // User.departamentosAdicionais.
  const meusDepartamentos = departamentosDoGestor(user);

  const pendentesGestor = indicators.filter(
    (i) =>
      i.status === 'AGUARDANDO_APROVACAO_GESTOR' &&
      (isRHouAdmin || meusDepartamentos.includes(i.departamento_id)) &&
      combinaBusca(i) &&
      combinaDepartamento(i),
  );
  const pendentesRH = podeAprovarFinal
    ? indicators.filter((i) => i.status === 'AGUARDANDO_APROVACAO_RH' && combinaBusca(i) && combinaDepartamento(i))
    : [];

  // Indicadores MENSAL: cada mês em AGUARDANDO_GESTOR vira um item próprio na
  // fila — mesma regra de visibilidade/ação do 1º nível anual (RH/Admin vê
  // tudo, mas só o gestor do departamento aprova de verdade).
  const pendentesMensal = indicators
    .filter(
      (i) =>
        i.periodicidade === 'MENSAL' &&
        (isRHouAdmin || meusDepartamentos.includes(i.departamento_id)) &&
        combinaBusca(i) &&
        combinaDepartamento(i),
    )
    .flatMap((i) =>
      (i.registrosMensais ?? [])
        .filter((r) => r.status === 'AGUARDANDO_GESTOR')
        .map((r) => ({ indicador: i, mes: r.mes, nota: r.nota ?? null })),
    );

  // Indicadores MENSAL prontos pra validação final — só depois que o período
  // termina (ou todos os meses já foram aprovados pelo gestor) — e só MASTER
  // ("controller") pode fazer essa validação (mesma exceção da aprovação
  // final anual — ADMIN não participa dessa etapa).
  const hoje = mesAtual();
  const pendentesValidacaoFinal = podeAprovarFinal
    ? indicators.filter((i) => {
        if (i.periodicidade !== 'MENSAL') return false;
        if (i.status !== 'EM_ANDAMENTO' && i.status !== 'ATRASADO') return false;
        if (!combinaBusca(i) || !combinaDepartamento(i)) return false;
        const meses = listarMesesDoPeriodo(i.data_inicio, i.data_fim);
        const periodoEncerrado = i.data_fim.slice(0, 7) <= hoje;
        const todosAprovados = meses.every((mes) => i.registrosMensais?.find((r) => r.mes === mes)?.status === 'APROVADO');
        return periodoEncerrado || todosAprovados;
      })
    : [];

  // Junta as 4 filas num único conjunto de itens marcados por etapa, para
  // reorganizar por colaborador/departamento em vez de 4 listas separadas.
  const todosItens: ItemPendente[] = [
    ...pendentesGestor.map((indicador): ItemPendente => ({
      key: `gestor-${indicador.id}`,
      etapa: 'GESTOR',
      indicador,
      nota: notaConclusaoAtual(indicador.id),
    })),
    ...pendentesMensal.map(({ indicador, mes, nota }): ItemPendente => ({
      key: `mes-${indicador.id}-${mes}`,
      etapa: 'MES',
      indicador,
      mes,
      nota,
    })),
    ...pendentesValidacaoFinal.map((indicador): ItemPendente => ({
      key: `final-${indicador.id}`,
      etapa: 'FINAL',
      indicador,
    })),
    ...pendentesRH.map((indicador): ItemPendente => ({
      key: `rh-${indicador.id}`,
      etapa: 'RH',
      indicador,
      nota: notaConclusaoAtual(indicador.id),
      observacaoAnterior: observacaoGestor(indicador.id),
    })),
  ];

  const porColaborador = new Map<string, ColaboradorGrupo>();
  todosItens.forEach((item) => {
    const { indicador } = item;
    const uid = indicador.usuario_responsavel_id;
    const existente = porColaborador.get(uid);
    if (existente) {
      existente.itens.push(item);
      return;
    }
    const usuario = users.find((u) => u.id === uid);
    porColaborador.set(uid, {
      userId: uid,
      nome: indicador.responsavel,
      cargo: usuario?.cargo ?? '—',
      departamentoId: indicador.departamento_id,
      departamento: indicador.departamento,
      itens: [item],
    });
  });
  const gruposColaborador = Array.from(porColaborador.values()).sort((a, b) => a.nome.localeCompare(b.nome));

  const porDepartamento = new Map<string, DepartamentoGrupo>();
  gruposColaborador.forEach((grupo) => {
    const existente = porDepartamento.get(grupo.departamentoId);
    if (existente) {
      existente.colaboradores.push(grupo);
      existente.totalItens += grupo.itens.length;
      return;
    }
    porDepartamento.set(grupo.departamentoId, {
      departamentoId: grupo.departamentoId,
      departamento: grupo.departamento,
      colaboradores: [grupo],
      totalItens: grupo.itens.length,
    });
  });
  const gruposDepartamento = Array.from(porDepartamento.values()).sort((a, b) => a.departamento.localeCompare(b.departamento));
  const departamentoAtual = gruposDepartamento.find((d) => d.departamentoId === departamentoAberto) ?? null;
  const colaboradorAtual = gruposColaborador.find((g) => g.userId === colaboradorAberto) ?? null;

  const currentUser = user;
  const indicadorHistorico = indicators.find((i) => i.id === historicoId) ?? null;

  const handleConfirmarAprovacao = async (observacao: string) => {
    if (!aprovando) return;
    const { indicador, etapa, mes } = aprovando;

    try {
      if (etapa === 'GESTOR') {
        await aprovarGestor(indicador.id, observacao);
        toast.success(`Conclusão de "${indicador.nome}" aprovada — enviada para avaliação final do RH.`);
      } else if (etapa === 'MES' && mes) {
        aprovarMes(indicador.id, mes, currentUser.id, currentUser.nome, observacao);
        toast.success(`Mês ${formatMes(mes)} de "${indicador.nome}" aprovado.`);
      } else if (etapa === 'FINAL') {
        validarPeriodoFinal(indicador.id, currentUser.id, currentUser.nome, observacao);
        toast.success(`"${indicador.nome}" concluído! O peso já conta para o colaborador.`);
      } else {
        await aprovarRH(indicador.id, observacao);
        toast.success(`"${indicador.nome}" concluído! O peso já conta para o colaborador.`);
      }
      setAprovando(null);
    } catch {
      toast.error('Não foi possível registrar a aprovação.');
    }
  };

  const handleConfirmarRejeicao = async (motivo: string) => {
    if (!rejeitando) return;
    const { indicador, etapa, mes } = rejeitando;
    const motivoFinal =
      motivo.trim() ||
      (etapa === 'GESTOR'
        ? 'Rejeitado pelo gestor do departamento'
        : etapa === 'MES'
          ? 'Mês rejeitado pelo gestor do departamento'
          : 'Rejeitado pelo RH na avaliação final');

    try {
      if (etapa === 'GESTOR') {
        await rejeitarGestor(indicador.id, motivoFinal);
      } else if (etapa === 'MES' && mes) {
        rejeitarMes(indicador.id, mes, currentUser.id, currentUser.nome, motivoFinal);
      } else {
        await rejeitarRH(indicador.id, motivoFinal);
      }
      toast.success('Solicitação rejeitada — o colaborador foi notificado.');
      setRejeitando(null);
    } catch {
      toast.error('Não foi possível registrar a rejeição.');
    }
  };

  function handleAprovarItem(item: ItemPendente) {
    setAprovando({ indicador: item.indicador, etapa: item.etapa, mes: item.etapa === 'MES' ? item.mes : undefined });
  }
  function handleRejeitarItem(item: ItemPendente) {
    setRejeitando({ indicador: item.indicador, etapa: item.etapa, mes: item.etapa === 'MES' ? item.mes : undefined });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
          <CheckSquare className="h-6 w-6 text-primary" aria-hidden="true" />
          Aprovações
        </h1>
        <p className="text-sm text-secondary">
          {isGestorDepartamento
            ? `Indicadores do${meusDepartamentos.length > 1 ? 's departamentos' : ' departamento'} ${meusDepartamentos
                .map((id) => departments.find((d) => d.id === id)?.nome ?? user.departamento)
                .join(', ')} que colaboradores marcaram como concluídos, aguardando sua avaliação. Você só vê solicitações ${meusDepartamentos.length > 1 ? 'desses departamentos' : 'do seu próprio departamento'}.`
            : 'Fluxo de conclusão: o gestor do departamento avalia primeiro, depois o RH dá a avaliação final — só então o peso conta para o colaborador. Organizado por departamento e colaborador.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:grid-cols-2">
        <Input
          label="Buscar colaborador"
          placeholder="Nome do colaborador ou indicador..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {isRHouAdmin && (
          <Select
            label="Departamento"
            value={departamentoFiltro}
            onChange={setDepartamentoFiltro}
            placeholder="Todos"
            options={departments.map((d) => ({ value: d.id, label: d.nome }))}
          />
        )}
      </div>

      {gruposDepartamento.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhuma solicitação pendente.
        </p>
      ) : isRHouAdmin ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gruposDepartamento.map((dept) => {
              const aberto = departamentoAberto === dept.departamentoId;
              return (
                <ResumoCard
                  key={dept.departamentoId}
                  titulo={dept.departamento}
                  totalItens={dept.totalItens}
                  botaoLabel={aberto ? 'Ocultar Colaboradores' : 'Ver Colaboradores'}
                  ativo={aberto}
                  onAbrir={() => setDepartamentoAberto(aberto ? null : dept.departamentoId)}
                />
              );
            })}
          </div>

          {departamentoAtual && (
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Colaboradores — {departamentoAtual.departamento}</h2>
                <button
                  type="button"
                  onClick={() => setDepartamentoAberto(null)}
                  className="text-xs font-medium text-secondary hover:text-ink"
                >
                  Fechar ✕
                </button>
              </div>
              {departamentoAtual.colaboradores.length === 0 ? (
                <p className="text-sm text-secondary">Nenhuma solicitação pendente neste departamento.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {departamentoAtual.colaboradores.map((grupo) => (
                    <ResumoCard
                      key={grupo.userId}
                      titulo={grupo.nome}
                      subtitulo={grupo.cargo}
                      totalItens={grupo.itens.length}
                      botaoLabel="Ver Pendências"
                      onAbrir={() => setColaboradorAberto(grupo.userId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gruposColaborador.map((grupo) => (
            <ResumoCard
              key={grupo.userId}
              titulo={grupo.nome}
              subtitulo={meusDepartamentos.length > 1 ? `${grupo.cargo} · ${grupo.departamento}` : grupo.cargo}
              totalItens={grupo.itens.length}
              botaoLabel="Ver Pendências"
              onAbrir={() => setColaboradorAberto(grupo.userId)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!colaboradorAtual}
        onClose={() => setColaboradorAberto(null)}
        title="Pendências do Colaborador"
        maxWidthClassName="max-w-2xl"
      >
        {colaboradorAtual && (
          <AprovacaoColaboradorCard
            grupo={colaboradorAtual}
            podeAprovar={podeAprovar}
            onAprovar={handleAprovarItem}
            onRejeitar={handleRejeitarItem}
            onVerHistorico={(indicador) => {
              setHistoricoId(indicador.id);
              fetchHistorico(indicador.id).catch(() => {});
            }}
          />
        )}
      </Modal>

      <HistoricoModal
        isOpen={!!indicadorHistorico}
        onClose={() => setHistoricoId(null)}
        indicadorNome={indicadorHistorico?.nome ?? ''}
        eventos={indicadorHistorico ? historyFor(indicadorHistorico.id) : []}
      />

      <RejeitarModal
        isOpen={!!rejeitando}
        onClose={() => setRejeitando(null)}
        indicadorNome={rejeitando?.indicador.nome ?? ''}
        onConfirmar={handleConfirmarRejeicao}
      />

      <AprovarModal
        isOpen={!!aprovando}
        onClose={() => setAprovando(null)}
        indicadorNome={aprovando?.indicador.nome ?? ''}
        destinatario={aprovando?.etapa === 'GESTOR' ? 'o RH' : 'o colaborador'}
        onConfirmar={handleConfirmarAprovacao}
        indicador={aprovando?.indicador}
        pedirPercentualAtingido={aprovando?.etapa === 'GESTOR'}
      />
    </div>
  );
}
