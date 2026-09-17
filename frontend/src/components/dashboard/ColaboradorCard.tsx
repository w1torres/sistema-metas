import Button from '../common/Button';

interface ColaboradorCardProps {
  nome: string;
  cargo: string;
  total: number;
  pendentes: number;
  emAprovacao: number;
  concluidos: number;
  onVerIndicadores: () => void;
}

export default function ColaboradorCard({
  nome,
  cargo,
  total,
  pendentes,
  emAprovacao,
  concluidos,
  onVerIndicadores,
}: ColaboradorCardProps) {
  const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
      <div>
        <p className="font-semibold text-ink">{nome}</p>
        <p className="text-xs text-secondary">{cargo}</p>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <p className="font-bold text-ink">{total}</p>
          <p className="text-secondary">Total</p>
        </div>
        <div>
          <p className="font-bold text-yellow-700">{pendentes}</p>
          <p className="text-secondary">Pendentes</p>
        </div>
        <div>
          <p className="font-bold text-primary">{emAprovacao}</p>
          <p className="text-secondary">Em Aprov.</p>
        </div>
        <div>
          <p className="font-bold text-success">{concluidos}</p>
          <p className="text-secondary">Concluído</p>
        </div>
      </div>
      <p className="text-xs text-secondary">Conclusão: {taxaConclusao}%</p>
      <Button variant="secondary" size="sm" onClick={onVerIndicadores}>
        Ver Indicadores
      </Button>
    </div>
  );
}
