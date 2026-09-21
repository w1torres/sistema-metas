import Button from '../common/Button';

interface DepartamentoCardProps {
  nome: string;
  total: number;
  pendentes: number;
  taxaConclusao: number;
  onVerColaboradores: () => void;
}

export default function DepartamentoCard({ nome, total, pendentes, taxaConclusao, onVerColaboradores }: DepartamentoCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
      <p className="font-semibold text-ink">{nome}</p>
      <div className="flex flex-col gap-1 text-sm text-secondary">
        <p>
          Total: <span className="font-semibold text-ink">{total}</span>
        </p>
        <p>
          Pendentes: <span className="font-semibold text-ink">{pendentes}</span>
        </p>
        <p>
          Conclusão: <span className="font-semibold text-ink">{taxaConclusao}%</span>
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onVerColaboradores}>
        Ver Colaboradores
      </Button>
    </div>
  );
}
