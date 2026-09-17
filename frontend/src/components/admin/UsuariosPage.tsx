import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import UsuarioModal from './UsuarioModal';
import UsuarioCard from './UsuarioCard';
import UsuarioDetalhesModal from './UsuarioDetalhesModal';
import ImportUsuariosModal from './ImportUsuariosModal';
import Button from '../common/Button';
import { Input, Select } from '../common/Input';
import type { User } from '../../types';

export default function UsuariosPage() {
  const users = useUserStore((s) => s.users);
  const toggleAtivo = useUserStore((s) => s.toggleAtivo);
  const currentUser = useAuthStore((s) => s.user);
  const departments = useDepartmentStore((s) => s.departments);
  const cargos = useCargoStore((s) => s.cargos);

  const [departamentoFiltro, setDepartamentoFiltro] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('');
  const [busca, setBusca] = useState('');

  const [criando, setCriando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [editando, setEditando] = useState<User | null>(null);
  const [detalhando, setDetalhando] = useState<User | null>(null);

  const filtrados = useMemo(
    () =>
      users.filter((u) => {
        if (departamentoFiltro && u.departamento_id !== departamentoFiltro) return false;
        if (cargoFiltro && u.cargo !== cargoFiltro) return false;
        if (busca) {
          const term = busca.toLowerCase();
          if (!u.nome.toLowerCase().includes(term) && !u.email.toLowerCase().includes(term)) return false;
        }
        return true;
      }),
    [users, departamentoFiltro, cargoFiltro, busca],
  );

  function handleToggle(id: string, nome: string, ativo: boolean) {
    if (id === currentUser?.id) {
      toast.error('Você não pode desativar seu próprio usuário.');
      return;
    }
    toggleAtivo(id);
    toast.success(ativo ? `${nome} desativado(a).` : `${nome} reativado(a).`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Usuários</h1>
          <p className="text-sm text-secondary">
            {filtrados.length} de {users.length} usuário(s) — cadastre aqui quem poderá acessar o sistema com email
            corporativo (login via Microsoft chega na Etapa 2).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCriando(true)}>+ Novo Usuário</Button>
          <Button variant="secondary" onClick={() => setImportando(true)}>
            Importar Planilha
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:grid-cols-3">
        <Select
          label="Departamento"
          value={departamentoFiltro}
          onChange={setDepartamentoFiltro}
          placeholder="Todos"
          options={departments.map((d) => ({ value: d.id, label: d.nome }))}
        />
        <Select
          label="Cargo"
          value={cargoFiltro}
          onChange={setCargoFiltro}
          placeholder="Todos"
          options={cargos.map((c) => ({ value: c, label: c }))}
        />
        <Input label="Buscar" placeholder="Nome ou email..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-sm text-secondary">
          Nenhum usuário encontrado com os filtros atuais.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((u) => (
            <UsuarioCard key={u.id} usuario={u} onSelect={() => setDetalhando(u)} />
          ))}
        </div>
      )}

      <UsuarioModal isOpen={criando} onClose={() => setCriando(false)} />
      <UsuarioModal isOpen={!!editando} usuario={editando} onClose={() => setEditando(null)} />
      <ImportUsuariosModal isOpen={importando} onClose={() => setImportando(false)} />
      <UsuarioDetalhesModal
        isOpen={!!detalhando}
        usuario={detalhando}
        onClose={() => setDetalhando(null)}
        podeDesativar={detalhando?.id !== currentUser?.id}
        onEditar={() => {
          setEditando(detalhando);
          setDetalhando(null);
        }}
        onToggleAtivo={() => {
          if (!detalhando) return;
          handleToggle(detalhando.id, detalhando.nome, detalhando.ativo);
          setDetalhando(null);
        }}
      />
    </div>
  );
}
