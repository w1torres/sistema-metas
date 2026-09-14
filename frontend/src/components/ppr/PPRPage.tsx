import { useTrilhaStore } from '../../store/trilhaStore';
import MultiplosPPRTable from './MultiplosPPRTable';
import TrilhaPilaresTable from './TrilhaPilaresTable';

export default function PPRPage() {
  const trilhas = useTrilhaStore((s) => s.trilhas);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Tabelas</h1>
          <p className="text-sm text-secondary">
            Múltiplo pago por grupo de cargo, de acordo com o percentual do peso concluído pelo colaborador (soma do
            peso dos indicadores concluídos, dividido pelo peso total). Clique em "Editar" para ajustar os valores.
          </p>
        </div>

        <MultiplosPPRTable />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Pilares por Trilha</h2>
          <p className="text-sm text-secondary">
            Peso de cada pilar dentro da trilha de carreira do colaborador, usado como referência na composição dos
            indicadores.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {trilhas.map((trilha) => (
            <TrilhaPilaresTable key={trilha.id} trilha={trilha} />
          ))}
        </div>
      </section>
    </div>
  );
}
