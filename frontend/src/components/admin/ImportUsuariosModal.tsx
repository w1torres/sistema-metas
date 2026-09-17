import { useRef, useState } from 'react';
import { parse as parseDateBR, isValid as isValidDate, format as formatDateISO } from 'date-fns';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { downloadXLSX, readSpreadsheetFile } from '../../utils/xlsx';
import { IMPORT_USUARIOS_TEMPLATE_HEADERS, ROLE_OPTIONS } from '../../utils/constants';
import { validateEmail, validateCPF } from '../../utils/validators';
import type { Role } from '../../types';

interface ImportUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportError {
  linha: number;
  motivo: string;
}

interface ImportResult {
  criados: number;
  erros: ImportError[];
}

function parseDataBR(valor: string | undefined): string | undefined {
  if (!valor?.trim()) return undefined;
  const data = parseDateBR(valor.trim(), 'dd/MM/yyyy', new Date());
  if (!isValidDate(data)) throw new Error(`data inválida "${valor}" — use o formato DD/MM/AAAA`);
  return formatDateISO(data, 'yyyy-MM-dd');
}

export default function ImportUsuariosModal({ isOpen, onClose }: ImportUsuariosModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const addUser = useUserStore((s) => s.addUser);
  const findOrCreateDepartamento = useDepartmentStore((s) => s.findOrCreateByName);
  const findOrCreateCargo = useCargoStore((s) => s.findOrCreate);

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
      '000.000.000-00',
      'EMP-00000',
      'DEPARTAMENTO EXEMPLO',
      'CARGO EXEMPLO',
      'COLABORADOR',
      'FILIAL EXEMPLO',
      '01/01/1990',
      '01/01/2020',
      '(00) 0000-0000',
      '(00) 00000-0000',
      'Rua Exemplo, 123, Cidade-UF',
    ];
    downloadXLSX('modelo_importacao_usuarios.xlsx', IMPORT_USUARIOS_TEMPLATE_HEADERS, [exemplo]);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    setProcessing(true);
    setResult(null);

    try {
      const rows = await readSpreadsheetFile(file);

      const erros: ImportError[] = [];
      let criados = 0;

      rows.forEach((row, idx) => {
        const linha = idx + 2;
        try {
          const nome = row['nome']?.trim();
          if (!nome) throw new Error('nome é obrigatório');

          const email = row['email']?.trim() ?? '';
          const emailError = validateEmail(email);
          if (emailError) throw new Error(emailError);

          const cpf = row['cpf']?.trim() || undefined;
          const cpfError = cpf ? validateCPF(cpf) : null;
          if (cpfError) throw new Error(cpfError);

          const departamentoNome = row['departamento']?.trim();
          if (!departamentoNome) throw new Error('departamento é obrigatório');
          const departamento = findOrCreateDepartamento(departamentoNome);

          const cargoNome = row['cargo']?.trim();
          const cargo = cargoNome ? findOrCreateCargo(cargoNome) : '';

          const roleRaw = row['role']?.trim().toUpperCase();
          const role: Role = roleRaw ? (roleRaw as Role) : 'COLABORADOR';
          if (!ROLE_OPTIONS.includes(role)) {
            throw new Error(`role "${row['role']}" inválido — use um de: ${ROLE_OPTIONS.join(', ')}`);
          }

          const dataNascimento = parseDataBR(row['data_nascimento']);
          const dataAdmissao = parseDataBR(row['data_admissao']);
          if (dataAdmissao && dataAdmissao > formatDateISO(new Date(), 'yyyy-MM-dd')) {
            throw new Error('data_admissao não pode ser no futuro');
          }

          const resultado = addUser({
            nome,
            email,
            cpf,
            matricula: row['matricula']?.trim() || undefined,
            departamento_id: departamento.id,
            departamento: departamento.nome,
            cargo,
            role,
            filial: row['filial']?.trim() || undefined,
            dataNascimento,
            dataAdmissao,
            telefone: row['telefone']?.trim() || undefined,
            celular: row['celular']?.trim() || undefined,
            enderecoCompleto: row['endereco']?.trim() || undefined,
          });

          if (!resultado.ok) throw new Error(resultado.error);
          criados += 1;
        } catch (err) {
          erros.push({ linha, motivo: err instanceof Error ? err.message : String(err) });
        }
      });

      setResult({ criados, erros });
    } catch (err) {
      setResult({ criados: 0, erros: [{ linha: 0, motivo: err instanceof Error ? err.message : 'Falha ao ler o arquivo' }] });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Planilha de Usuários" maxWidthClassName="max-w-xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">
          Envie um arquivo Excel (.xlsx) ou CSV com uma linha por usuário. Departamentos e cargos citados que ainda
          não existirem serão criados automaticamente. As colunas <code>role</code>, <code>filial</code>,{' '}
          <code>data_nascimento</code>, <code>data_admissao</code>, <code>telefone</code>, <code>celular</code> e{' '}
          <code>endereco</code> são opcionais — <code>role</code> vazio vira Colaborador. Datas no formato
          DD/MM/AAAA.
        </p>

        <div className="rounded-md border border-border bg-gray-50 p-3 text-xs text-secondary">
          <p className="mb-1 font-medium text-ink">Colunas esperadas (na primeira linha):</p>
          <code className="break-words">{IMPORT_USUARIOS_TEMPLATE_HEADERS.join(', ')}</code>
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
            <p className="font-medium text-success">✅ {result.criados} usuário(s) importado(s).</p>
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
