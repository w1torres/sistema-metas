import { useState } from 'react';
import toast from 'react-hot-toast';
import { useUserStore } from '../../store/userStore';
import { useAuthStore } from '../../store/authStore';
import NovoUsuarioModal from './NovoUsuarioModal';
import Button from '../common/Button';
import { ROLE_LABELS } from '../../utils/constants';

export default function UsuariosPage() {
  const users = useUserStore((s) => s.users);
  const toggleAtivo = useUserStore((s) => s.toggleAtivo);
  const currentUser = useAuthStore((s) => s.user);
  const [criando, setCriando] = useState(false);

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
            {users.length} usuário(s) cadastrado(s) — cadastre aqui quem poderá acessar o sistema com email
            corporativo (login via Microsoft chega na Etapa 2).
          </p>
        </div>
        <Button onClick={() => setCriando(true)}>+ Novo Usuário</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-secondary">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email corporativo</th>
              <th className="px-4 py-3">Departamento</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.nome}</td>
                <td className="px-4 py-3 text-secondary">{u.email}</td>
                <td className="px-4 py-3 text-secondary">{u.departamento}</td>
                <td className="px-4 py-3 text-secondary">{u.cargo}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.ativo ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'
                    }`}
                  >
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(u.id, u.nome, u.ativo)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NovoUsuarioModal isOpen={criando} onClose={() => setCriando(false)} />
    </div>
  );
}
