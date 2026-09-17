import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../utils/constants';
import { validateEmail, validateCPF } from '../../utils/validators';
import { formatCPF } from '../../utils/formatters';
import type { Role, User } from '../../types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: User | null;
}

export default function UsuarioModal({ isOpen, onClose, usuario }: UsuarioModalProps) {
  const editando = !!usuario;
  const addUser = useUserStore((s) => s.addUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const departments = useDepartmentStore((s) => s.departments);
  const findOrCreateDepartamento = useDepartmentStore((s) => s.findOrCreateByName);
  const cargos = useCargoStore((s) => s.cargos);
  const findOrCreateCargo = useCargoStore((s) => s.findOrCreate);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [novoDepartamento, setNovoDepartamento] = useState('');
  const [cargo, setCargo] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [role, setRole] = useState<Role>('COLABORADOR');
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [filial, setFilial] = useState('');
  const [departamentosAdicionais, setDepartamentosAdicionais] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setNome(usuario?.nome ?? '');
    setEmail(usuario?.email ?? '');
    setCpf(usuario?.cpf ?? '');
    setDepartamentoId(usuario?.departamento_id ?? '');
    setNovoDepartamento('');
    setCargo(usuario?.cargo ?? '');
    setNovoCargo('');
    setRole(usuario?.role ?? 'COLABORADOR');
    setDataNascimento(usuario?.dataNascimento ?? '');
    setDataAdmissao(usuario?.dataAdmissao ?? '');
    setFilial(usuario?.filial ?? '');
    setDepartamentosAdicionais(usuario?.departamentosAdicionais ?? []);
    setErrors({});
  }, [isOpen, usuario]);

  function handleClose() {
    setErrors({});
    onClose();
  }

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!nome.trim()) nextErrors.nome = 'Nome é obrigatório';
    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;
    const cpfError = validateCPF(cpf);
    if (cpfError) nextErrors.cpf = cpfError;
    if (!departamentoId && !novoDepartamento.trim()) nextErrors.departamento = 'Selecione ou informe um departamento';
    if (!cargo && !novoCargo.trim()) nextErrors.cargo = 'Selecione ou informe um cargo';
    if (dataAdmissao && dataAdmissao > new Date().toISOString().slice(0, 10)) {
      nextErrors.dataAdmissao = 'Data de admissão não pode ser no futuro';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const departamento = novoDepartamento.trim()
      ? await findOrCreateDepartamento(novoDepartamento.trim())
      : departments.find((d) => d.id === departamentoId)!;
    const cargoFinal = novoCargo.trim() ? await findOrCreateCargo(novoCargo.trim()) : cargo;

    const input = {
      nome: nome.trim(),
      email: email.trim(),
      cpf: cpf.trim() || undefined,
      departamento_id: departamento.id,
      departamento: departamento.nome,
      cargo: cargoFinal,
      role,
      dataNascimento: dataNascimento || undefined,
      dataAdmissao: dataAdmissao || undefined,
      filial: filial.trim() || undefined,
      departamentosAdicionais: role === 'GERENTES' ? departamentosAdicionais.filter((id) => id !== departamento.id) : [],
    };

    const result = editando ? await updateUser(usuario!.id, input) : await addUser(input);

    if (!result.ok) {
      if (result.error.includes('CPF')) {
        setErrors({ cpf: result.error });
      } else if (result.error.toLowerCase().includes('email')) {
        setErrors({ email: result.error });
      } else {
        // Erro genérico (ex.: registro não existe mais no banco) não é sobre
        // nenhum campo específico — mostrar preso ao email confundia o motivo real.
        toast.error(result.error);
      }
      return;
    }

    toast.success(
      editando
        ? `${result.user.nome} atualizado(a).`
        : `${result.user.nome} cadastrado(a) como ${ROLE_LABELS[role]}.`,
    );
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editando ? 'Editar Usuário' : 'Novo Usuário'}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{editando ? 'Salvar' : 'Cadastrar'}</Button>
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

        <Input
          label="CPF"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          error={errors.cpf}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Data de Nascimento"
            type="date"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />
          <Input
            label="Data de Admissão"
            type="date"
            value={dataAdmissao}
            onChange={(e) => setDataAdmissao(e.target.value)}
            error={errors.dataAdmissao}
          />
        </div>

        <Input label="Filial" value={filial} onChange={(e) => setFilial(e.target.value)} placeholder="Ex: FORMOSA-GO" />

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
        <p className="text-xs text-secondary">Título do cargo — informativo, aparece nos cards e relatórios.</p>

        <Select
          label="Papel/Perfil"
          required
          value={role}
          onChange={(value) => setRole(value as Role)}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        />
        <p className="text-xs text-secondary">
          Define o acesso ao sistema e também o grupo da Tabela de Múltiplos de PPR (Gerentes / Coordenador-Supervisor /
          Colaborador têm múltiplos diferentes — ver Tabelas). Admin e Master não entram na tabela de PPR.
        </p>

        {role === 'GERENTES' && (
          <div className="rounded-md bg-primary/5 p-3 text-xs text-secondary">
            <p>
              Este usuário aprova o departamento selecionado acima
              {departamentoId || novoDepartamento
                ? ` (${novoDepartamento.trim() || departments.find((d) => d.id === departamentoId)?.nome})`
                : ''}
              . Se ele também responde por outros departamentos (ex.: um gerente administrativo que também cuida de
              Compras, Estoque e Faturamento), marque abaixo.
            </p>
            {departments.filter((d) => d.id !== departamentoId).length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                <p className="font-medium text-ink">Departamentos adicionais</p>
                {departments
                  .filter((d) => d.id !== departamentoId)
                  .map((d) => (
                    <label key={d.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={departamentosAdicionais.includes(d.id)}
                        onChange={(e) =>
                          setDepartamentosAdicionais((prev) =>
                            e.target.checked ? [...prev, d.id] : prev.filter((id) => id !== d.id),
                          )
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      {d.nome}
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}

        {!editando && (
          <p className="rounded-md bg-primary/5 p-3 text-xs text-secondary">
            O login com Microsoft (Entra ID) será habilitado na Etapa 2. Por enquanto, esta pessoa já pode acessar o
            protótipo usando o email corporativo cadastrado com qualquer senha na tela de login.
          </p>
        )}
      </div>
    </Modal>
  );
}
