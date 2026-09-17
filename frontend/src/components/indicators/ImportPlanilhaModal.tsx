import { useRef, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { useIndicatorStore } from '../../store/indicatorStore';
import { downloadXLSX, readSpreadsheetFile } from '../../utils/xlsx';
import { IMPORT_TEMPLATE_HEADERS } from '../../utils/constants';
import { validateNome, validatePeso } from '../../utils/validators';
import { getSafraAtual, parseSafraLabel } from '../../utils/safra';

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
  colaboradoresCriados: number;
  erros: ImportError[];
}

export default function ImportPlanilhaModal({ isOpen, onClose }: ImportPlanilhaModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const findOrCreateColaborador = useUserStore((s) => s.findOrCreateColaborador);
  const findByEmail = useUserStore((s) => s.findByEmail);
  const findOrCreateDepartamento = useDepartmentStore((s) => s.findOrCreateByName);
  const findOrCreateCargo = useCargoStore((s) => s.findOrCreate);
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
      'Fulano de Tal',
      'fulano.tal@empresa.com',
      'DEPARTAMENTO EXEMPLO',
      'CARGO EXEMPLO',
      'NOME DO INDICADOR EXEMPLO',
      '25',
      'Descreva aqui o objetivo do indicador',
      getSafraAtual().label.replace('Safra ', ''),
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

      const erros: ImportError[] = [];
      let indicadoresCriados = 0;
      const colaboradoresAntes = new Set(useUserStore.getState().users.map((u) => u.id));

      rows.forEach((row, idx) => {
        const linha = idx + 2; // +1 header, +1 for 1-index
        const nome = row['nome_colaborador'];
        const email = row['email_colaborador'];
        const departamento = row['departamento'];
        const cargo = row['cargo'];
        const nomeIndicador = row['nome_indicador'];
        const peso = Number(row['peso']);
        const objetivo = row['objetivo'] ?? '';
        const safra = parseSafraLabel(row['safra'] ?? '');

        if (!nome || !email || !departamento) {
          erros.push({ linha, motivo: 'Colaborador, email e departamento são obrigatórios' });
          return;
        }

        const nomeError = validateNome(nomeIndicador ?? '');
        if (nomeError) {
          erros.push({ linha, motivo: `Indicador: ${nomeError}` });
          return;
        }

        const pesoError = validatePeso(peso);
        if (pesoError) {
          erros.push({ linha, motivo: `Peso: ${pesoError}` });
          return;
        }

        if (!safra) {
          erros.push({ linha, motivo: `Safra: informe no formato "25/26" (valor recebido: "${row['safra'] ?? ''}")` });
          return;
        }

        const existiaAntes = !!findByEmail(email);
        const dept = findOrCreateDepartamento(departamento);
        const cargoFinal = cargo ? findOrCreateCargo(cargo) : undefined;
        const colaborador = findOrCreateColaborador({
          nome,
          email,
          departamento_id: dept.id,
          departamento: dept.nome,
          cargo: cargoFinal,
        });
        if (!existiaAntes) colaboradoresAntes.delete(colaborador.id);

        createIndicador(
          {
            nome: nomeIndicador,
            peso,
            departamento_id: dept.id,
            departamento: dept.nome,
            usuario_responsavel_id: colaborador.id,
            responsavel: colaborador.nome,
            objetivo,
            data_inicio: safra.dataInicio,
            data_fim: safra.dataFim,
          },
          currentUser.id,
          currentUser.nome,
        );
        indicadoresCriados += 1;
      });

      const colaboradoresCriados = useUserStore.getState().users.filter((u) => !colaboradoresAntes.has(u.id)).length;

      setResult({ indicadoresCriados, colaboradoresCriados, erros });
    } catch (err) {
      setResult({ indicadoresCriados: 0, colaboradoresCriados: 0, erros: [{ linha: 0, motivo: err instanceof Error ? err.message : 'Falha ao ler o arquivo' }] });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Planilha de Indicadores" maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">
          Envie um arquivo Excel (.xlsx) ou CSV com uma linha por indicador. Colaboradores, departamentos e cargos
          citados que ainda não existirem no sistema serão criados automaticamente (como Colaborador ativo). A
          coluna <code>cargo</code> é opcional — se vazia, o colaborador é criado sem cargo definido e não recebe
          múltiplo de PPR até alguém corrigir isso em Usuários. A coluna <code>safra</code> define o período do
          indicador (ex.: <code>25/26</code> vira 01/05/2025–30/04/2026) — todo indicador segue exatamente o período
          da safra informada.
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
            <p className="font-medium text-success">
              ✅ {result.indicadoresCriados} indicador(es) importado(s), {result.colaboradoresCriados} colaborador(es) novo(s) criado(s).
            </p>
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
