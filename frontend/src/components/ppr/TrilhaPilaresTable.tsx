import type { Trilha } from '../../types';

interface TrilhaPilaresTableProps {
  trilha: Trilha;
}

export default function TrilhaPilaresTable({ trilha }: TrilhaPilaresTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="bg-gray-50 px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          Pilares por {trilha.nome} — {trilha.descricao}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-secondary">
              <th className="px-4 py-2">Trilha</th>
              <th className="px-4 py-2">Pilar</th>
              <th className="px-4 py-2">Peso</th>
            </tr>
          </thead>
          <tbody>
            {trilha.pilares.map((p) => (
              <tr key={p.pilar} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-ink">{trilha.nome}</td>
                <td className="px-4 py-2 text-ink">{p.pilar}</td>
                <td className="px-4 py-2 font-semibold text-primary">{p.peso}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
