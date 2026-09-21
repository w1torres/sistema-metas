import { useRef, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { apiClient } from '../../api/client';
import { useBonificacaoStore } from '../../store/bonificacaoStore';
import { downloadXLSX, readSpreadsheetFile } from '../../utils/xlsx';

interface ImportNotasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Resultado {
  atualizados: number;
  erros: { linha: number; cpf: string; motivo: string }[];
}

const HEADERS = ['cpf', 'nota'];

export default function ImportNotasModal({ isOpen, onClose }: ImportNotasModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const fetchBonificacoes = useBonificacaoStore((s) => s.fetchBonificacoes);
  const [fileName, setFileName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  function handleClose() {
    setFileName(null);
    setResultado(null);
    onClose();
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setProcessing(true);
    setResultado(null);
    try {
      const rows = await readSpreadsheetFile(file);
      // Aceita "90", "90,5" e "90%". Linha ilegível vai como NaN e o backend
      // reporta o erro com o número da linha.
      const notas = rows.map((row) => ({
        cpf: row['cpf'] ?? '',
        percentual_nota: Number((row['nota'] ?? '').replace('%', '').replace(',', '.').trim() || NaN),
      }));
      const invalidas = notas.map((n, i) => ({ n, i })).filter(({ n }) => Number.isNaN(n.percentual_nota));
      const validas = notas.filter((n) => !Number.isNaN(n.percentual_nota));
      const res = validas.length
        ? await apiClient.post<Resultado>('/bonificacoes/notas/importar', { notas: validas })
        : { atualizados: 0, erros: [] };
      await fetchBonificacoes();
      setResultado({
        atualizados: res.atualizados,
        erros: [
          ...invalidas.map(({ n, i }) => ({ linha: i + 2, cpf: n.cpf, motivo: 'Nota inválida ou vazia' })),
          ...res.erros,
        ],
      });
    } catch (err) {
      setResultado({
        atualizados: 0,
        erros: [{ linha: 0, cpf: '', motivo: err instanceof Error ? err.message : 'Falha ao importar o arquivo' }],
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Notas da Avaliação de Desempenho" maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">
          Envie um arquivo Excel (.xlsx) ou CSV com as colunas <code>cpf</code> e <code>nota</code> (0 a 100). O
          colaborador é localizado pelo CPF e a nota passa a valer em todas as bonificações em que ele participa.
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => downloadXLSX('modelo_importacao_notas.xlsx', HEADERS, [['000.000.000-00', '90']])}
        >
          Baixar modelo XLSX
        </Button>

        <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-secondary">{fileName ? `Arquivo selecionado: ${fileName}` : 'Selecione um arquivo .xlsx ou .csv'}</p>
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} loading={processing}>
            Selecionar Arquivo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {resultado && (
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium text-success">✅ {resultado.atualizados} nota(s) importada(s).</p>
            {resultado.erros.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-danger">{resultado.erros.length} linha(s) com erro:</p>
                <ul className="mt-1 max-h-32 list-disc overflow-y-auto pl-5 text-xs text-danger">
                  {resultado.erros.map((e, i) => (
                    <li key={i}>
                      Linha {e.linha}
                      {e.cpf ? ` (${e.cpf})` : ''}: {e.motivo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
