import { Table2 } from 'lucide-react';
import { useTrilhaStore } from '../../store/trilhaStore';
import MultiplosPPRTable from './MultiplosPPRTable';
import TabelaAtingimentoTable from './TabelaAtingimentoTable';
import TrilhaPilaresTable from './TrilhaPilaresTable';

export default function PPRPage() {
  const trilhas = useTrilhaStore((s) => s.trilhas);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Table2 className="h-6 w-6 text-primary" aria-hidden="true" />
            Tabelas
          </h1>
          <p className="text-sm text-secondary">
            Múltiplo pago por grupo de cargo, de acordo com o percentual do peso concluído pelo colaborador (soma do
            peso dos indicadores concluídos, dividido pelo peso total). Clique em "Editar" para ajustar os valores.
          </p>
        </div>

        <MultiplosPPRTable />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Percentual de Atingimento dos Indicadores</h2>
          <p className="text-sm text-secondary">
            Quanto maior, melhor: converte o % da meta atingida pelo indicador no % do peso dele que conta no
            cálculo do colaborador. Referência usada pelo gestor ao marcar o atendimento na aprovação.
          </p>
        </div>

        <TabelaAtingimentoTable />
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
