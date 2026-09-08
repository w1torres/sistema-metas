import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, Select, Textarea } from '../common/Input';
import type { Indicador, IndicadorStatus } from '../../types';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { STATUS_EDIT_OPTIONS, STATUS_META } from '../../utils/constants';
import { validateDatas, validateNome, validatePeso } from '../../utils/validators';

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
  data_inicio: string;
  data_fim: string;
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
      data_inicio: '',
      data_fim: '',
    };
  }
  return {
    nome: indicador.nome,
    departamento_id: indicador.departamento_id,
    usuario_responsavel_id: indicador.usuario_responsavel_id,
    peso: String(indicador.peso),
    status: indicador.status,
    objetivo: indicador.objetivo,
    data_inicio: indicador.data_inicio,
    data_fim: indicador.data_fim,
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

  useEffect(() => {
    setForm(toFormState(indicador));
    setErrors({});
  }, [indicador, isOpen]);

  const ativos = users.filter((u) => u.ativo);
  const colaboradores = form.departamento_id
    ? ativos.filter((u) => u.departamento_id === form.departamento_id)
    : ativos;
  const statusControladoPeloFluxo = !!indicador && !STATUS_EDIT_OPTIONS.includes(indicador.status);

  function handleSubmit() {
    if (!currentUser) return;

    const nomeError = validateNome(form.nome);
    const peso = Number(form.peso);
    const pesoError = validatePeso(peso);
    const datasError = validateDatas(form.data_inicio, form.data_fim);
    const deptError = !form.departamento_id ? 'Departamento é obrigatório' : null;
    const respError = !form.usuario_responsavel_id ? 'Responsável é obrigatório' : null;

    const nextErrors: Record<string, string> = {};
    if (nomeError) nextErrors.nome = nomeError;
    if (pesoError) nextErrors.peso = pesoError;
    if (datasError) nextErrors.datas = datasError;
    if (deptError) nextErrors.departamento_id = deptError;
    if (respError) nextErrors.usuario_responsavel_id = respError;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const departamento = departments.find((d) => d.id === form.departamento_id)!;
    const responsavel = users.find((u) => u.id === form.usuario_responsavel_id)!;

    if (isCreating) {
      createIndicador(
        {
          nome: form.nome,
          peso,
          departamento_id: departamento.id,
          departamento: departamento.nome,
          usuario_responsavel_id: responsavel.id,
          responsavel: responsavel.nome,
          objetivo: form.objetivo,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
        },
        currentUser.id,
        currentUser.nome,
      );
      toast.success('Indicador criado com sucesso!');
    } else {
      updateIndicador(
        indicador.id,
        {
          nome: form.nome,
          peso,
          status: form.status,
          objetivo: form.objetivo,
          data_inicio: form.data_inicio,
          data_fim: form.data_fim,
        },
        currentUser.id,
        currentUser.nome,
      );
      toast.success('Indicador atualizado com sucesso!');
    }
    onClose();
  }

  function handleDelete() {
    if (!indicador) return;
    if (!window.confirm('Você tem certeza de que deseja deletar este indicador? Essa ação não pode ser desfeita.')) {
      return;
    }
    deleteIndicador(indicador.id);
    toast.success('Indicador removido.');
    onClose();
  }

  return (
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
          options={colaboradores.map((u) => ({ value: u.id, label: `${u.nome} (${u.email})` }))}
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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Data de Início"
            type="date"
            required
            value={form.data_inicio}
            onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
          />
          <Input
            label="Data de Fim / Prazo"
            type="date"
            required
            value={form.data_fim}
            onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
          />
        </div>
        {errors.datas && <p className="text-sm text-danger">{errors.datas}</p>}
      </div>
    </Modal>
  );
}
