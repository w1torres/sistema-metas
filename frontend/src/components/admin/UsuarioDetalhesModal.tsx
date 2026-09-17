import Modal from '../common/Modal';
import Button from '../common/Button';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { useDepartmentStore } from '../../store/departmentStore';
import type { User } from '../../types';

interface UsuarioDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: User | null;
  onEditar: () => void;
  onToggleAtivo: () => void;
  onRemover: () => void;
  podeDesativar: boolean;
}

function Campo({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
      <p className="text-sm text-ink">{value?.trim() ? value : '—'}</p>
    </div>
  );
}

export default function UsuarioDetalhesModal({
  isOpen,
  onClose,
  usuario,
  onEditar,
  onToggleAtivo,
  onRemover,
  podeDesativar,
}: UsuarioDetalhesModalProps) {
  const departments = useDepartmentStore((s) => s.departments);

  if (!usuario) return null;

  const departamentosAdicionaisNomes = (usuario.departamentosAdicionais ?? [])
    .map((id) => departments.find((d) => d.id === id)?.nome)
    .filter((nome): nome is string => !!nome);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={usuario.nome}
      maxWidthClassName="max-w-xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {podeDesativar && (
            <>
              <Button variant="danger" onClick={onRemover}>
                Excluir
              </Button>
              <Button variant="danger" onClick={onToggleAtivo}>
                {usuario.ativo ? 'Desativar' : 'Reativar'}
              </Button>
            </>
          )}
          <Button onClick={onEditar}>Editar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-md bg-primary/5 p-3">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {ROLE_LABELS[usuario.role]}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              usuario.ativo ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'
            }`}
          >
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Dados Pessoais</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Email corporativo" value={usuario.email} />
            <Campo label="CPF" value={usuario.cpf} />
            <Campo label="Data de Nascimento" value={usuario.dataNascimento ? formatDate(usuario.dataNascimento) : null} />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-sm font-semibold text-ink">Dados Profissionais</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Campo label="Departamento" value={usuario.departamento} />
            <Campo label="Cargo" value={usuario.cargo} />
            <Campo label="Filial" value={usuario.filial} />
            <Campo label="Data de Admissão" value={usuario.dataAdmissao ? formatDate(usuario.dataAdmissao) : null} />
          </div>
          {departamentosAdicionaisNomes.length > 0 && (
            <div className="mt-3">
              <Campo label="Departamentos adicionais (também aprova)" value={departamentosAdicionaisNomes.join(', ')} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
