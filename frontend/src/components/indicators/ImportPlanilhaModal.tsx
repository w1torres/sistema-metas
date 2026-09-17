import { useRef, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import { downloadXLSX, readSpreadsheetFile } from '../../utils/xlsx';
import { IMPORT_TEMPLATE_HEADERS } from '../../utils/constants';
import { normalizarCpfDigitos, validateNome, validatePeso } from '../../utils/validators';
import { getSafraAtual } from '../../utils/safra';

interface ImportPlanilhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportError {
  linha: number;
  motivo: string;
}

interface ImportResult {
  indicadoresCriados: number;
  erros: ImportError[];
}

export default function ImportPlanilhaModal({ isOpen, onClose }: ImportPlanilhaModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const findByCpf = useUserStore((s) => s.findByCpf);
  const createIndicador = useIndicatorStore((s) => s.createIndicador);

  const [fileName, setFileName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleClose() {
    setFileName(null);
    setResult(null);
    onClose();
  }

  function handleBaixarModelo() {
    const exemplo = [
      'Resultado da Área',
      'NOME DO INDICADOR EXEMPLO',
      'Descreva aqui o objetivo do indicador',
      'Descreva aqui a meta a ser atingida',
      'Como o indicador é medido',
      'Evidência exigida para comprovar o resultado',
      '',
      '25',
      '',
      '000.000.000-00',
    ];
    downloadXLSX('modelo_importacao_indicadores.xlsx', IMPORT_TEMPLATE_HEADERS, [exemplo]);
  }

  async function handleFile(file: File) {
    if (!currentUser) return;
    setFileName(file.name);
    setProcessing(true);
    setResult(null);

    try {
      const rows = await readSpreadsheetFile(file);
      const safraAtual = getSafraAtual();

      const erros: ImportError[] = [];
      let indicadoresCriados = 0;

      for (const [idx, row] of rows.entries()) {
        const linha = idx + 2; // +1 header, +1 for 1-index
        const pilar = row['pilar']?.trim() || undefined;
        const nomeIndicador = row['indicador / meta'] ?? '';
        const descricao = row['descrição']?.trim() ?? '';
        const meta = row['meta']?.trim() || undefined;
        const formaMedicao = row['forma de medição']?.trim() || undefined;
        const evidenciaObrigatoria = row['evidência obrigatória']?.trim() || undefined;
        const tabelaAtingimento = row['tabela de atingimento (redutor)']?.trim() || undefined;
        const peso = Number((row['peso'] ?? '').replace('%', '').replace(',', '.').trim());
        const observacao = row['observação / sinalização']?.trim() || undefined;
        const cpfBruto = row['cpf'] ?? '';
        const cpf = normalizarCpfDigitos(cpfBruto);

        const nomeError = validateNome(nomeIndicador);
        if (nomeError) {
          erros.push({ linha, motivo: `Indicador / Meta: ${nomeError}` });
          continue;
        }

        if (!descricao) {
          erros.push({ linha, motivo: 'Descrição é obrigatória' });
          continue;
        }

        const pesoError = validatePeso(peso);
        if (pesoError) {
          erros.push({ linha, motivo: `Peso: ${pesoError}` });
          continue;
        }

        if (!cpf) {
          erros.push({ linha, motivo: 'CPF é obrigatório para vincular o responsável' });
          continue;
        }

        const responsavel = findByCpf(cpf);
        if (!responsavel) {
          erros.push({ linha, motivo: `CPF '${cpfBruto}' não encontrado nos usuários cadastrados` });
          continue;
        }

        const detalhamentoPartes = [
          tabelaAtingimento ? `Tabela de Atingimento (Redutor): ${tabelaAtingimento}` : null,
          observacao ? `Observação / Sinalização: ${observacao}` : null,
        ].filter((parte): parte is string => !!parte);

        createIndicador(
          {
            nome: nomeIndicador,
            peso,
            departamento_id: responsavel.departamento_id,
            departamento: responsavel.departamento,
            usuario_responsavel_id: responsavel.id,
            responsavel: responsavel.nome,
            objetivo: descricao,
            data_inicio: safraAtual.dataInicio,
            data_fim: safraAtual.dataFim,
            detalhamento: detalhamentoPartes.join(' | '),
            pilar,
            meta,
            formaMedicao,
            evidenciaObrigatoria,
          },
          currentUser.id,
          currentUser.nome,
        );

        indicadoresCriados += 1;
      }

      setResult({ indicadoresCriados, erros });
    } catch (err) {
      setResult({ indicadoresCriados: 0, erros: [{ linha: 0, motivo: err instanceof Error ? err.message : 'Falha ao ler o arquivo' }] });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Planilha de Indicadores" maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">
          Envie um arquivo Excel (.xlsx) ou CSV com uma linha por indicador. A coluna <code>CPF</code> vincula o
          indicador a um usuário já cadastrado em Usuários — linhas com CPF não encontrado são rejeitadas (nenhum
          usuário é criado por este import). Departamento e responsável do indicador seguem o cadastro desse
          usuário. Indicadores importados entram na safra atual ({getSafraAtual().label}).
        </p>

        <div className="rounded-md border border-border bg-gray-50 p-3 text-xs text-secondary">
          <p className="mb-1 font-medium text-ink">Colunas esperadas (na primeira linha):</p>
          <code className="break-words">{IMPORT_TEMPLATE_HEADERS.join(', ')}</code>
        </div>

        <Button variant="secondary" size="sm" onClick={handleBaixarModelo} className="self-start">
          Baixar modelo XLSX
        </Button>

        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-secondary">
            {fileName ? `Arquivo selecionado: ${fileName}` : 'Selecione um arquivo .xlsx ou .csv'}
          </p>
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
            }}
          />
        </div>

        {result && (
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium text-success">✅ {result.indicadoresCriados} indicador(es) importado(s).</p>
            {result.erros.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-danger">{result.erros.length} linha(s) com erro:</p>
                <ul className="mt-1 max-h-32 list-disc overflow-y-auto pl-5 text-xs text-danger">
                  {result.erros.map((erro) => (
                    <li key={erro.linha}>
                      Linha {erro.linha}: {erro.motivo}
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
