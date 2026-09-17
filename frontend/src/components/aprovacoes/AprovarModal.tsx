import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Textarea } from '../common/Input';
import type { Indicador } from '../../types';

interface AprovarModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicadorNome: string;
  destinatario: string;
  onConfirmar: (observacao: string, percentualAtingido?: number) => void;
  // Só quando presente (e a etapa é a do gestor do departamento) a modal
  // pede o percentual atingido a partir da Tabela de Atingimento do indicador.
  indicador?: Indicador;
  pedirPercentualAtingido?: boolean;
}

function formatPercent(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

export default function AprovarModal({
  isOpen,
  onClose,
  indicadorNome,
  destinatario,
  onConfirmar,
  indicador,
  pedirPercentualAtingido,
}: AprovarModalProps) {
  const [observacao, setObservacao] = useState('');
  const [percentualSelecionado, setPercentualSelecionado] = useState<number | null>(null);

  const tabela = indicador?.tabelaAtingimento ?? [];
  const exigePercentual = Boolean(pedirPercentualAtingido && tabela.length > 0);

  useEffect(() => {
    if (isOpen) setPercentualSelecionado(null);
  }, [isOpen, indicador?.id]);

  function handleClose() {
    setObservacao('');
    setPercentualSelecionado(null);
    onClose();
  }

  function handleConfirmar() {
    onConfirmar(observacao, percentualSelecionado ?? undefined);
    setObservacao('');
    setPercentualSelecionado(null);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Aprovar Conclusão"
      maxWidthClassName={exigePercentual ? 'max-w-2xl' : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={exigePercentual && percentualSelecionado === null}>
            Aprovar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink">{indicadorNome}</p>

        {exigePercentual && indicador && (
          <div>
            <p className="mb-1 text-sm font-medium text-ink">Percentual do resultado atingido</p>
            <p className="mb-2 text-xs text-secondary">
              Marque a faixa de resultado alcançada pelo colaborador. O peso efetivo é esse % aplicado sobre o peso de{' '}
              {formatPercent(indicador.peso)} do indicador.
            </p>
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-gray-50 uppercase text-secondary">
                    <th className="w-8 px-3 py-2" />
                    <th className="px-3 py-2">Resultado</th>
                    <th className="px-3 py-2">% do Peso</th>
                    <th className="px-3 py-2">Peso Efetivo</th>
                  </tr>
                </thead>
                <tbody>
                  {tabela.map((faixa, idx) => {
                    const pesoEfetivo = (faixa.percentualPeso / 100) * indicador.peso;
                    const selecionada = percentualSelecionado === faixa.percentualPeso;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setPercentualSelecionado(faixa.percentualPeso)}
                        className={`cursor-pointer border-b border-border last:border-0 ${
                          selecionada ? 'bg-primary/10' : 'even:bg-gray-50/60 hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name="percentual-atingido"
                            checked={selecionada}
                            onChange={() => setPercentualSelecionado(faixa.percentualPeso)}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                        </td>
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
            {percentualSelecionado === null && (
              <p className="mt-1.5 text-xs text-danger">Selecione uma faixa de resultado para aprovar.</p>
            )}
          </div>
        )}

        <Textarea
          label="Observação (opcional)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value.slice(0, 500))}
          rows={4}
          maxLength={500}
          placeholder={`Deixe uma observação para ${destinatario}, se quiser...`}
        />
        <p className="text-xs text-secondary">{observacao.length}/500 — {destinatario} verá esta mensagem.</p>
      </div>
    </Modal>
  );
}
