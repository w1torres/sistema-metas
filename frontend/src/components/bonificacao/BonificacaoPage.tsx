import { Fragment, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBonificacaoStore } from '../../store/bonificacaoStore';
import { useAuthStore } from '../../store/authStore';
import BonificacaoModal from './BonificacaoModal';
import ImportNotasModal from './ImportNotasModal';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { podeGerenciarBonificacao } from '../../utils/constants';
import type { Bonificacao } from '../../types';

interface ResumoColaborador {
  usuarioId: string;
  usuarioNome: string;
  dataAdmissao: string | null;
  totalRecebido: number;
  porFornecedor: { bonificacaoId: string; fornecedor: string; percentualNota: number; valorRecebido: number }[];
}

// Agrega, por colaborador, a nota e o valor recebido em CADA bonificação
// (fornecedor) — ex.: Corteva paga R$900 (nota 90) e UPL paga R$1.200
// (nota 80) pro mesmo colaborador, o resumo mostra o total agregado de
// R$2.100 com o detalhamento (nota + valor) de cada fornecedor.
function agregarPorColaborador(bonificacoes: Bonificacao[]): ResumoColaborador[] {
  const porUsuario = new Map<string, ResumoColaborador>();
  for (const bonificacao of bonificacoes) {
    for (const participante of bonificacao.participantes ?? []) {
      const existente = porUsuario.get(participante.usuarioId);
      const entrada = {
        bonificacaoId: bonificacao.id,
        fornecedor: bonificacao.fornecedor,
        percentualNota: participante.percentualNota,
        valorRecebido: participante.valorRecebido,
      };
      if (existente) {
        existente.totalRecebido += participante.valorRecebido;
        existente.porFornecedor.push(entrada);
      } else {
        porUsuario.set(participante.usuarioId, {
          usuarioId: participante.usuarioId,
          usuarioNome: participante.usuarioNome,
          dataAdmissao: participante.dataAdmissao,
          totalRecebido: participante.valorRecebido,
          porFornecedor: [entrada],
        });
      }
    }
  }
  return Array.from(porUsuario.values()).sort((a, b) => a.usuarioNome.localeCompare(b.usuarioNome));
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMesReferencia(mesReferencia: string): string {
  const [ano, mes] = mesReferencia.split('-');
  const nome = MESES[Number(mes) - 1] ?? mes;
  return `${nome}/${ano}`;
}

export default function BonificacaoPage() {
  const user = useAuthStore((s) => s.user);
  const bonificacoes = useBonificacaoStore((s) => s.bonificacoes);
  const fetchBonificacoes = useBonificacaoStore((s) => s.fetchBonificacoes);
  const removeBonificacao = useBonificacaoStore((s) => s.removeBonificacao);
  const setPaga = useBonificacaoStore((s) => s.setPaga);
  const atualizarNotaParticipante = useBonificacaoStore((s) => s.atualizarNotaParticipante);

  const [criando, setCriando] = useState(false);
  const [importandoNotas, setImportandoNotas] = useState(false);
  const [editando, setEditando] = useState<Bonificacao | null>(null);
  const [excluindo, setExcluindo] = useState<Bonificacao | null>(null);
  const [alternandoPagaId, setAlternandoPagaId] = useState<string | null>(null);
  const [salvandoNotaChave, setSalvandoNotaChave] = useState<string | null>(null);

  useEffect(() => {
    fetchBonificacoes().catch(() => toast.error('Não foi possível carregar as bonificações.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumoPorColaborador = useMemo(() => agregarPorColaborador(bonificacoes), [bonificacoes]);

  if (!user || !podeGerenciarBonificacao(user)) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
        Acesso restrito ao MASTER e ao gerente do departamento de Marketing.
      </p>
    );
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    try {
      await removeBonificacao(excluindo.id);
      toast.success('Bonificação excluída.');
    } catch {
      toast.error('Não foi possível excluir a bonificação.');
    } finally {
      setExcluindo(null);
    }
  }

  async function handleTogglePaga(bonificacao: Bonificacao) {
    setAlternandoPagaId(bonificacao.id);
    try {
      await setPaga(bonificacao.id, !bonificacao.paga);
      toast.success(bonificacao.paga ? 'Bonificação marcada como pendente.' : 'Bonificação marcada como paga.');
    } catch {
      toast.error('Não foi possível atualizar o status de pagamento.');
    } finally {
      setAlternandoPagaId(null);
    }
  }

  async function handleNotaChange(bonificacaoId: string, usuarioId: string, valor: string) {
    const percentual = Number(valor);
    if (Number.isNaN(percentual) || percentual < 0 || percentual > 100) return;
    const chave = `${bonificacaoId}-${usuarioId}`;
    setSalvandoNotaChave(chave);
    try {
      await atualizarNotaParticipante(bonificacaoId, usuarioId, percentual);
    } catch {
      toast.error('Não foi possível salvar a nota.');
    } finally {
      setSalvandoNotaChave(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bonificação</h1>
          <p className="text-sm text-secondary">
            Cadastre a bonificação recebida por fornecedor. Os colaboradores participantes são vinculados
            automaticamente (ativos, admitidos até 31/12 do ano anterior).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportandoNotas(true)}>
            Importar Notas
          </Button>
          <Button onClick={() => setCriando(true)}>Nova Bonificação</Button>
        </div>
      </div>

      {bonificacoes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhuma bonificação cadastrada ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bonificacoes.map((b) => (
            <div key={b.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-secondary">
                    {formatMesReferencia(b.mesReferencia)}
                  </p>
                  <p className="text-lg font-bold text-ink">{b.fornecedor}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    b.paga ? 'bg-success/15 text-success' : 'bg-warning/20 text-yellow-800'
                  }`}
                >
                  {b.paga ? '✓ Paga' : '⏳ Pendente'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-secondary">Valor Total</p>
                  <p className="text-sm font-semibold text-ink">{formatCurrency(b.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Colaboradores</p>
                  <p className="text-sm font-semibold text-ink">{b.totalColaboradores}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary">Valor por Colaborador</p>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(b.valorPorColaborador)}</p>
                </div>
              </div>

              <p className="mt-3 text-xs text-secondary">Cadastrado por {b.criadoPorNome}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={alternandoPagaId === b.id}
                  onClick={() => handleTogglePaga(b)}
                >
                  {b.paga ? 'Marcar como Pendente' : 'Marcar como Paga'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditando(b)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => setExcluindo(b)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resumoPorColaborador.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhum colaborador elegível vinculado ainda.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-ink">Colaboradores</p>
          <p className="mb-3 text-xs text-secondary">
            Nota de avaliação (editável) e valor a receber de cada fornecedor, com o total agregado por colaborador
            (ex.: Corteva + UPL).
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-secondary">
                <th className="py-1 font-medium">Colaborador</th>
                <th className="py-1 font-medium">Fornecedor</th>
                <th className="py-1 font-medium">Nota da Avaliação</th>
                <th className="py-1 text-right font-medium">Valor a Receber</th>
                <th className="py-1 text-right font-medium">Total do Colaborador</th>
              </tr>
            </thead>
            <tbody>
              {resumoPorColaborador.map((r) => (
                <Fragment key={r.usuarioId}>
                  {r.porFornecedor.map((f, i) => {
                    const chave = `${f.bonificacaoId}-${r.usuarioId}`;
                    return (
                      <tr key={chave} className="border-b border-border">
                        {i === 0 && (
                          <td className="py-1.5 align-top text-ink" rowSpan={r.porFornecedor.length}>
                            {r.usuarioNome}
                            <span className="block text-xs text-secondary">
                              Admissão: {formatDate(r.dataAdmissao)}
                            </span>
                          </td>
                        )}
                        <td className="py-1.5 text-secondary">{f.fornecedor}</td>
                        <td className="py-1.5">
                          <input
                            // Remonta (reset do valor não-controlado) sempre que o valor
                            // canônico do servidor mudar — reflete um save bem-sucedido, e
                            // reverte a digitação se o save falhar (não deixa a UI "mentir").
                            key={`${chave}-${f.percentualNota}`}
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={f.percentualNota}
                            disabled={salvandoNotaChave === chave}
                            onBlur={(e) => handleNotaChange(f.bonificacaoId, r.usuarioId, e.target.value)}
                            className="w-16 rounded border border-border px-1.5 py-0.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="ml-1 text-xs text-secondary">%</span>
                        </td>
                        <td className="py-1.5 text-right text-ink">{formatCurrency(f.valorRecebido)}</td>
                        {i === 0 && (
                          <td
                            className="py-1.5 text-right align-top font-semibold text-primary"
                            rowSpan={r.porFornecedor.length}
                          >
                            {formatCurrency(r.totalRecebido)}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ImportNotasModal isOpen={importandoNotas} onClose={() => setImportandoNotas(false)} />
      <BonificacaoModal isOpen={criando} onClose={() => setCriando(false)} bonificacao={null} />
      <BonificacaoModal isOpen={!!editando} onClose={() => setEditando(null)} bonificacao={editando} />
      <ConfirmModal
        isOpen={!!excluindo}
        title="Excluir bonificação"
        message={`Tem certeza de que deseja excluir a bonificação de "${excluindo?.fornecedor}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  );
}
