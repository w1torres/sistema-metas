import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import ConfirmModal from '../common/ConfirmModal';
import Button from '../common/Button';
import { Input, Select, Textarea } from '../common/Input';
import type { Indicador, IndicadorStatus } from '../../types';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { STATUS_EDIT_OPTIONS, STATUS_META } from '../../utils/constants';
import { validateNome, validatePeso } from '../../utils/validators';
import { findSafraById, getSafraAtual, getSafraForDate, listSafras } from '../../utils/safra';
import { formatDate } from '../../utils/formatters';

const SAFRAS = listSafras();

interface EditIndicadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicador: Indicador | null;
}

interface FormState {
  nome: string;
  departamento_id: string;
  usuario_responsavel_id: string;
  peso: string;
  status: IndicadorStatus;
  objetivo: string;
  safraId: string;
}

function toFormState(indicador: Indicador | null): FormState {
  if (!indicador) {
    return {
      nome: '',
      departamento_id: '',
      usuario_responsavel_id: '',
      peso: '',
      status: 'EM_ANDAMENTO',
      objetivo: '',
      safraId: getSafraAtual().id,
    };
  }
  return {
    nome: indicador.nome,
    departamento_id: indicador.departamento_id,
    usuario_responsavel_id: indicador.usuario_responsavel_id,
    peso: String(indicador.peso),
    status: indicador.status,
    objetivo: indicador.objetivo,
    safraId: getSafraForDate(indicador.data_inicio).id,
  };
}

export default function EditIndicadorModal({ isOpen, onClose, indicador }: EditIndicadorModalProps) {
  const isCreating = indicador === null;
  const currentUser = useAuthStore((s) => s.user);
  const { updateIndicador, createIndicador, deleteIndicador } = useIndicatorStore();
  const users = useUserStore((s) => s.users);
  const departments = useDepartmentStore((s) => s.departments);

  const [form, setForm] = useState<FormState>(toFormState(indicador));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(() => {
    setForm(toFormState(indicador));
    setErrors({});
  }, [indicador, isOpen]);

  // Sem email o colaborador ainda não tem acesso pra logar e reportar o
  // indicador sozinho, mas isso não impede ser responsável por um — a
  // maioria dos colaboradores importados ainda está só com CPF (cadastro em
  // etapas) e precisa poder receber indicador antes de completar o email.
  const ativos = users.filter((u) => u.ativo);
  const colaboradores = form.departamento_id
    ? ativos.filter((u) => u.departamento_id === form.departamento_id)
    : ativos;
  const statusControladoPeloFluxo = !!indicador && !STATUS_EDIT_OPTIONS.includes(indicador.status);
  const safraSelecionada = findSafraById(SAFRAS, form.safraId);

  async function handleSubmit() {
    if (!currentUser || !safraSelecionada) return;

    const nomeError = validateNome(form.nome);
    const peso = Number(form.peso);
    const pesoError = validatePeso(peso);
    const deptError = !form.departamento_id ? 'Departamento é obrigatório' : null;
    const respError = !form.usuario_responsavel_id ? 'Responsável é obrigatório' : null;

    const nextErrors: Record<string, string> = {};
    if (nomeError) nextErrors.nome = nomeError;
    if (pesoError) nextErrors.peso = pesoError;
    if (deptError) nextErrors.departamento_id = deptError;
    if (respError) nextErrors.usuario_responsavel_id = respError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const departamento = departments.find((d) => d.id === form.departamento_id)!;
    const responsavel = users.find((u) => u.id === form.usuario_responsavel_id)!;

    try {
      if (isCreating) {
        await createIndicador({
          nome: form.nome,
          peso,
          departamento_id: departamento.id,
          usuario_responsavel_id: responsavel.id,
          objetivo: form.objetivo,
          data_inicio: safraSelecionada.dataInicio,
          data_fim: safraSelecionada.dataFim,
        });
        toast.success('Indicador criado com sucesso!');
      } else {
        await updateIndicador(indicador.id, {
          nome: form.nome,
          peso,
          status: form.status,
          objetivo: form.objetivo,
          data_inicio: safraSelecionada.dataInicio,
          data_fim: safraSelecionada.dataFim,
        });
        toast.success('Indicador atualizado com sucesso!');
      }
      onClose();
    } catch {
      toast.error(isCreating ? 'Não foi possível criar o indicador.' : 'Não foi possível atualizar o indicador.');
    }
  }

  function handleDelete() {
    if (!indicador) return;
    setConfirmandoExclusao(true);
  }

  async function confirmarExclusao() {
    if (!indicador) return;
    try {
      await deleteIndicador(indicador.id);
      toast.success('Indicador removido.');
      setConfirmandoExclusao(false);
      onClose();
    } catch {
      toast.error('Não foi possível excluir o indicador.');
      setConfirmandoExclusao(false);
    }
  }

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? 'Novo Indicador' : 'Editar Indicador'}
      maxWidthClassName="max-w-xl"
      footer={
        <>
          {!isCreating && (
            <Button variant="danger" onClick={handleDelete} className="mr-auto">
              Deletar
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nome do Indicador"
          required
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          error={errors.nome}
        />

        <Select
          label="Departamento"
          required
          value={form.departamento_id}
          onChange={(value) => setForm((f) => ({ ...f, departamento_id: value, usuario_responsavel_id: '' }))}
          placeholder="Selecione..."
          options={departments.map((d) => ({ value: d.id, label: d.nome }))}
          error={errors.departamento_id}
        />

        <Select
          label="Responsável / Colaborador"
          required
          value={form.usuario_responsavel_id}
          onChange={(value) => setForm((f) => ({ ...f, usuario_responsavel_id: value }))}
          placeholder="Selecione..."
          options={colaboradores.map((u) => ({ value: u.id, label: u.email ? `${u.nome} (${u.email})` : u.nome }))}
          error={errors.usuario_responsavel_id}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Peso (%)"
            type="number"
            min={0}
            max={100}
            required
            value={form.peso}
            onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))}
            error={errors.peso}
          />
          <Select
            label="Status"
            required
            value={form.status}
            onChange={(value) => setForm((f) => ({ ...f, status: value as IndicadorStatus }))}
            disabled={statusControladoPeloFluxo}
            options={(statusControladoPeloFluxo ? [form.status] : STATUS_EDIT_OPTIONS).map((s) => ({
              value: s,
              label: STATUS_META[s].label,
            }))}
          />
        </div>
        {statusControladoPeloFluxo && (
          <p className="text-xs text-secondary">
            Este status é controlado pelo fluxo de aprovação (ver Aprovações) e não pode ser alterado aqui.
          </p>
        )}

        <Textarea
          label="Objetivo / Descrição"
          value={form.objetivo}
          onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value }))}
          rows={3}
        />

        <Select
          label="Safra"
          required
          value={form.safraId}
          onChange={(value) => setForm((f) => ({ ...f, safraId: value }))}
          options={SAFRAS.map((s) => ({ value: s.id, label: s.label }))}
        />
        {safraSelecionada && (
          <p className="text-xs text-secondary">
            Período do indicador: {formatDate(safraSelecionada.dataInicio)} a {formatDate(safraSelecionada.dataFim)}
          </p>
        )}
      </div>
    </Modal>

    <ConfirmModal
      isOpen={confirmandoExclusao}
      title="Excluir indicador"
      message="Tem certeza de que deseja excluir este indicador? Essa ação não pode ser desfeita."
      confirmLabel="Excluir"
      onConfirm={confirmarExclusao}
      onCancel={() => setConfirmandoExclusao(false)}
    />
    </>
  );
}
