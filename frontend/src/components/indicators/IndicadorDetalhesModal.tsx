import type { ReactNode } from 'react';
import Modal from '../common/Modal';
import type { Indicador } from '../../types';

interface IndicadorDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicador: Indicador;
}

function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-secondary">{titulo}</p>
      {children}
    </div>
  );
}

export default function IndicadorDetalhesModal({ isOpen, onClose, indicador }: IndicadorDetalhesModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={indicador.nome} maxWidthClassName="max-w-3xl">
      <div className="flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-gray-50 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Pilar</p>
            <p className="text-ink">{indicador.pilar || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Meta</p>
            <p className="text-ink">{indicador.meta || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Peso</p>
            <p className="font-semibold text-primary">{formatPercent(indicador.peso)}</p>
          </div>
        </div>

        {indicador.objetivo && (
          <Secao titulo="Descrição">
            <p className="text-ink">{indicador.objetivo}</p>
          </Secao>
        )}

        {indicador.formaMedicao && (
          <Secao titulo="Forma de Medição">
            <p className="text-ink">{indicador.formaMedicao}</p>
          </Secao>
        )}

        {indicador.evidenciaObrigatoria && (
          <Secao titulo="Evidência Obrigatória">
            <p className="text-ink">{indicador.evidenciaObrigatoria}</p>
          </Secao>
        )}

        {indicador.tabelaAtingimento && indicador.tabelaAtingimento.length > 0 && (
          <Secao titulo="Tabela de Atingimento (Redutor)">
            <p className="mb-2 text-xs text-secondary">
              O resultado atingido define o % do peso considerado; o peso efetivo é esse % aplicado sobre o peso de{' '}
              {formatPercent(indicador.peso)} do indicador.
            </p>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50 uppercase text-secondary">
                    <th className="px-3 py-2">Resultado</th>
                    <th className="px-3 py-2">% do Peso</th>
                    <th className="px-3 py-2">Peso Efetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {indicador.tabelaAtingimento.map((faixa, idx) => {
                    const pesoEfetivo = (faixa.percentualPeso / 100) * indicador.peso;
                    return (
                      <tr key={idx} className="border-b border-border last:border-0 even:bg-gray-50/60">
                        <td className="px-3 py-2 text-ink">{faixa.faixa}</td>
                        <td className="px-3 py-2 font-medium text-primary">{formatPercent(faixa.percentualPeso)}</td>
                        <td className="px-3 py-2">
                          <span className="font-semibold text-ink">{formatPercent(pesoEfetivo)}</span>
                          <span className="ml-1.5 text-[11px] text-secondary">
                            ({faixa.percentualPeso}% de {formatPercent(indicador.peso)})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Secao>
        )}
      </div>
    </Modal>
  );
}
