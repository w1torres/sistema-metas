import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../utils/constants';
import { validateEmail } from '../../utils/validators';
import type { Role } from '../../types';

interface NovoUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NovoUsuarioModal({ isOpen, onClose }: NovoUsuarioModalProps) {
  const addUser = useUserStore((s) => s.addUser);
  const departments = useDepartmentStore((s) => s.departments);
  const findOrCreateDepartamento = useDepartmentStore((s) => s.findOrCreateByName);
  const cargos = useCargoStore((s) => s.cargos);
  const findOrCreateCargo = useCargoStore((s) => s.findOrCreate);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [novoDepartamento, setNovoDepartamento] = useState('');
  const [cargo, setCargo] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [role, setRole] = useState<Role>('COLABORADOR');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleClose() {
    setNome('');
    setEmail('');
    setDepartamentoId('');
    setNovoDepartamento('');
    setCargo('');
    setNovoCargo('');
    setRole('COLABORADOR');
    setErrors({});
    onClose();
  }

  function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!nome.trim()) nextErrors.nome = 'Nome é obrigatório';
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    if (!departamentoId && !novoDepartamento.trim()) nextErrors.departamento = 'Selecione ou informe um departamento';
    if (!cargo && !novoCargo.trim()) nextErrors.cargo = 'Selecione ou informe um cargo';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const departamento = novoDepartamento.trim()
      ? findOrCreateDepartamento(novoDepartamento.trim())
      : departments.find((d) => d.id === departamentoId)!;
    const cargoFinal = novoCargo.trim() ? findOrCreateCargo(novoCargo.trim()) : cargo;

    const result = addUser({
      nome: nome.trim(),
      email: email.trim(),
      departamento_id: departamento.id,
      departamento: departamento.nome,
      cargo: cargoFinal,
      role,
    });

    if (!result.ok) {
      setErrors({ email: result.error });
      return;
    }

    toast.success(`${result.user.nome} cadastrado(a) como ${ROLE_LABELS[role]}.`);
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo Usuário"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Cadastrar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="Nome completo" required value={nome} onChange={(e) => setNome(e.target.value)} error={errors.nome} />

        <Input
          label="Email corporativo"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@empresa.com"
          error={errors.email}
        />

        <Select
          label="Departamento"
          value={departamentoId}
          onChange={(value) => {
            setDepartamentoId(value);
            if (value) setNovoDepartamento('');
          }}
          placeholder="Selecione..."
          options={departments.map((d) => ({ value: d.id, label: d.nome }))}
          error={errors.departamento}
        />
        <Input
          label="Ou cadastrar novo departamento"
          value={novoDepartamento}
          onChange={(e) => {
            setNovoDepartamento(e.target.value);
            if (e.target.value) setDepartamentoId('');
          }}
          placeholder="Ex: MARKETING"
        />

        <Select
          label="Cargo"
          value={cargo}
          onChange={(value) => {
            setCargo(value);
            if (value) setNovoCargo('');
          }}
          placeholder="Selecione..."
          options={cargos.map((c) => ({ value: c, label: c }))}
          error={errors.cargo}
        />
        <Input
          label="Ou cadastrar novo cargo"
          value={novoCargo}
          onChange={(e) => {
            setNovoCargo(e.target.value);
            if (e.target.value) setCargo('');
          }}
          placeholder="Ex: SUPERVISOR"
        />
        <p className="text-xs text-secondary">
          O cargo é usado para calcular o múltiplo de PPR do colaborador (ver Tabela PPR).
        </p>

        <Select
          label="Papel"
          required
          value={role}
          onChange={(value) => setRole(value as Role)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />

        <p className="rounded-md bg-primary/5 p-3 text-xs text-secondary">
          O login com Microsoft (Entra ID) será habilitado na Etapa 2. Por enquanto, esta pessoa já pode acessar o
          protótipo usando o email corporativo cadastrado com qualquer senha na tela de login.
        </p>
      </div>
    </Modal>
  );
}
