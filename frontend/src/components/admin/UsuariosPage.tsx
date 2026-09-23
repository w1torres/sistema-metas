import { lazy, Suspense, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Upload, Users } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import UsuarioModal from './UsuarioModal';
import UsuarioCard from './UsuarioCard';
import UsuarioDetalhesModal from './UsuarioDetalhesModal';
import Button from '../common/Button';
import ModalLoadingFallback from '../common/ModalLoadingFallback';
import ConfirmModal from '../common/ConfirmModal';
import { Input, Select } from '../common/Input';
import type { User } from '../../types';

// Carregado só quando o modal é aberto — arrasta a lib de planilha (xlsx),
// pesada, junto (ver utils/xlsx.ts).
const ImportUsuariosModal = lazy(() => import('./ImportUsuariosModal'));

export default function UsuariosPage() {
  const users = useUserStore((s) => s.users);
  const toggleAtivo = useUserStore((s) => s.toggleAtivo);
  const removeUser = useUserStore((s) => s.removeUser);
  const currentUser = useAuthStore((s) => s.user);
  const departments = useDepartmentStore((s) => s.departments);
  const cargos = useCargoStore((s) => s.cargos);
  const indicators = useIndicatorStore((s) => s.indicators);
  const deleteIndicador = useIndicatorStore((s) => s.deleteIndicador);

  const [departamentoFiltro, setDepartamentoFiltro] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('');
  const [filialFiltro, setFilialFiltro] = useState('');
  const [busca, setBusca] = useState('');

  const filiais = useMemo(
    () => Array.from(new Set(users.map((u) => u.filial).filter((f): f is string => !!f))).sort(),
    [users],
  );

  const [criando, setCriando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [editando, setEditando] = useState<User | null>(null);
  const [detalhando, setDetalhando] = useState<User | null>(null);
  const [excluindo, setExcluindo] = useState<{ id: string; nome: string; qtdIndicadores: number } | null>(null);

  const filtrados = useMemo(
    () =>
      users.filter((u) => {
        if (departamentoFiltro && u.departamento_id !== departamentoFiltro) return false;
        if (cargoFiltro && u.cargo !== cargoFiltro) return false;
        if (filialFiltro && u.filial !== filialFiltro) return false;
        if (busca) {
          const term = busca.toLowerCase();
          const termDigitos = busca.replace(/\D/g, '');
          const bateNome = u.nome.toLowerCase().includes(term);
          const bateEmail = u.email?.toLowerCase().includes(term);
          const bateCpf = termDigitos && u.cpf?.replace(/\D/g, '').includes(termDigitos);
          if (!bateNome && !bateEmail && !bateCpf) return false;
        }
        return true;
      }),
    [users, departamentoFiltro, cargoFiltro, filialFiltro, busca],
  );

  function handleToggle(id: string, nome: string, ativo: boolean) {
    if (id === currentUser?.id) {
      toast.error('Você não pode desativar seu próprio usuário.');
      return;
    }
    toggleAtivo(id);
    toast.success(ativo ? `${nome} desativado(a).` : `${nome} reativado(a).`);
  }

  function handleRemover(id: string, nome: string) {
    if (id === currentUser?.id) {
      toast.error('Você não pode excluir seu próprio usuário.');
      return;
    }
    const qtdIndicadores = indicators.filter((i) => i.usuario_responsavel_id === id).length;
    setExcluindo({ id, nome, qtdIndicadores });
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    try {
      // Exclui junto os indicadores desse usuário — sem isso, dados de teste
      // (usuário + indicadores) nunca poderiam ser limpos antes de ir pra
      // produção, já que um usuário com indicador não podia ser removido.
      const doUsuario = indicators.filter((i) => i.usuario_responsavel_id === excluindo.id);
      for (const indicador of doUsuario) {
        await deleteIndicador(indicador.id);
      }
      const resultado = await removeUser(excluindo.id);
      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }
      toast.success(
        excluindo.qtdIndicadores > 0
          ? `${excluindo.nome} e ${excluindo.qtdIndicadores} indicador(es) dele(a) excluídos.`
          : `${excluindo.nome} excluído(a).`,
      );
    } catch {
      toast.error('Não foi possível excluir os indicadores deste usuário.');
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Users className="h-6 w-6 text-primary" aria-hidden="true" />
            Usuários
          </h1>
          <p className="text-sm text-secondary">
            {filtrados.length} de {users.length} usuário(s) — cadastre aqui quem poderá acessar o sistema com email
            corporativo (login via Microsoft chega na Etapa 2).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCriando(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo Usuário
          </Button>
          <Button variant="secondary" onClick={() => setImportando(true)}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Importar Planilha
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
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
        <Select
          label="Filial"
          value={filialFiltro}
          onChange={setFilialFiltro}
          placeholder="Todas"
          options={filiais.map((f) => ({ value: f, label: f }))}
        />
        <Input
          label="Buscar"
          placeholder="Nome, email ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
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
      {importando && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <ImportUsuariosModal isOpen onClose={() => setImportando(false)} />
        </Suspense>
      )}
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
        onRemover={() => {
          if (!detalhando) return;
          handleRemover(detalhando.id, detalhando.nome);
        }}
      />
      <ConfirmModal
        isOpen={!!excluindo}
        title="Excluir usuário"
        message={
          excluindo && excluindo.qtdIndicadores > 0
            ? `${excluindo.nome} é responsável por ${excluindo.qtdIndicadores} indicador(es). Excluir o usuário vai excluir esses indicadores junto. Essa ação não pode ser desfeita.`
            : `Excluir ${excluindo?.nome}? Essa ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
        onConfirm={() => {
          confirmarExclusao();
          setDetalhando(null);
        }}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  );
}
