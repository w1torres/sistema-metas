import { ROLE_LABELS } from '../../utils/constants';
import type { User } from '../../types';

interface UsuarioCardProps {
  usuario: User;
  onSelect: () => void;
}

export default function UsuarioCard({ usuario, onSelect }: UsuarioCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 text-left shadow-sm transition-colors hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold leading-snug text-ink">{usuario.nome}</p>
          {usuario.email ? (
            <p className="truncate text-xs text-secondary">{usuario.email}</p>
          ) : (
            <p className="truncate text-xs font-medium text-warning">Sem email — acesso pendente</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            usuario.ativo ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'
          }`}
        >
          {usuario.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 text-xs text-secondary">
        <p>{usuario.departamento}</p>
        <p>{usuario.cargo}</p>
      </div>

      <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        {ROLE_LABELS[usuario.role]}
      </span>
    </button>
  );
}
