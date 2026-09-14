import Modal from '../common/Modal';
import type { Indicador } from '../../types';

interface IndicadorDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicador: Indicador;
}

export default function IndicadorDetalhesModal({ isOpen, onClose, indicador }: IndicadorDetalhesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={indicador.nome} maxWidthClassName="max-w-2xl">
      <div className="flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {indicador.pilar && (
            <div>
              <p className="text-xs font-semibold uppercase text-secondary">Pilar</p>
              <p className="text-ink">{indicador.pilar}</p>
            </div>
          )}
          {indicador.meta && (
            <div>
              <p className="text-xs font-semibold uppercase text-secondary">Meta</p>
              <p className="text-ink">{indicador.meta}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase text-secondary">Peso</p>
            <p className="text-ink">{indicador.peso}%</p>
          </div>
        </div>

        {indicador.objetivo && (
          <div>
            <p className="text-xs font-semibold uppercase text-secondary">Descrição</p>
            <p className="text-ink">{indicador.objetivo}</p>
          </div>
        )}

        {indicador.formaMedicao && (
          <div>
            <p className="text-xs font-semibold uppercase text-secondary">Forma de Medição</p>
            <p className="text-ink">{indicador.formaMedicao}</p>
          </div>
        )}

        {indicador.evidenciaObrigatoria && (
          <div>
            <p className="text-xs font-semibold uppercase text-secondary">Evidência Obrigatória</p>
            <p className="text-ink">{indicador.evidenciaObrigatoria}</p>
          </div>
        )}

        {indicador.tabelaAtingimento && indicador.tabelaAtingimento.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-secondary">Tabela de Atingimento (Redutor)</p>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50 uppercase text-secondary">
                    <th className="px-3 py-2">Resultado</th>
                    <th className="px-3 py-2">% do Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {indicador.tabelaAtingimento.map((faixa, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-ink">{faixa.faixa}</td>
                      <td className="px-3 py-2 font-medium text-primary">{faixa.percentualPeso}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
