import { useRef, useState } from 'react';
import { format as formatDateISO } from 'date-fns';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useUserStore } from '../../store/userStore';
import { useDepartmentStore } from '../../store/departmentStore';
import { useCargoStore } from '../../store/cargoStore';
import { downloadXLSX, readSpreadsheetFile } from '../../utils/xlsx';
import { IMPORT_USUARIOS_TEMPLATE_HEADERS, ROLE_ALIASES } from '../../utils/constants';
import { normalizarCpfDigitos, validateCPF, validateEmailOpcional } from '../../utils/validators';

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
  atualizados: number;
  erros: ImportError[];
}

// Tolerante a variações comuns de planilha: dia/mês sem zero à esquerda
// ("4/8/1996"), ano com 2 dígitos ("4/8/96") e, quando um dos dois primeiros
// campos é > 12, ordem invertida mês/dia ("4/18/96" só pode ser mês/dia —
// dia 18 não existe como mês). Quando os dois são <= 12 (ambíguo de verdade,
// ex. "4/8/96"), assume dia/mês/ano, o formato padrão do sistema.
function parseDataBR(valor: string | undefined): string | undefined {
  const bruto = valor?.trim();
  if (!bruto) return undefined;

  const erro = () => new Error(`data inválida "${valor}" — use o formato DD/MM/AAAA`);

  const partes = bruto.split(/[/\-.]/);
  if (partes.length !== 3 || partes.some((p) => !/^\d{1,4}$/.test(p))) throw erro();

  const [p1, p2, p3] = partes.map(Number);
  let dia: number;
  let mes: number;
  let ano: number;

  if (partes[0].length === 4) {
    // AAAA/MM/DD
    ano = p1;
    mes = p2;
    dia = p3;
  } else {
    ano = p3;
    if (p1 > 12 && p2 <= 12) {
      dia = p1;
      mes = p2;
    } else if (p2 > 12 && p1 <= 12) {
      dia = p2;
      mes = p1;
    } else {
      dia = p1; // ambíguo — assume DD/MM/AAAA
      mes = p2;
    }
  }

  if (ano < 100) ano += ano <= 49 ? 2000 : 1900;

  const data = new Date(ano, mes - 1, dia);
  const valida = data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!valida) throw erro();

  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export default function ImportUsuariosModal({ isOpen, onClose }: ImportUsuariosModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const addUser = useUserStore((s) => s.addUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const findByCpf = useUserStore((s) => s.findByCpf);
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
      '000.000.000-00',
      'fulano.tal@empresa.com',
      'DEPARTAMENTO EXEMPLO',
      'CARGO EXEMPLO',
      'COLABORADOR',
      'FILIAL EXEMPLO',
      '01/01/1990',
      '01/01/2020',
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
      let atualizados = 0;

      for (const [idx, row] of rows.entries()) {
        const linha = idx + 2;
        try {
          // O CPF é obrigatório: é ele que identifica o usuário pra localizar
          // e completar um cadastro sem email (ver findByCpf em userStore.ts)
          // e também pra fazer upsert — uma linha com um CPF já cadastrado
          // ATUALIZA esse usuário em vez de gerar erro de CPF duplicado.
          const cpfCelula = row['cpf']?.trim() || undefined;
          if (!cpfCelula) throw new Error('cpf é obrigatório (usado para localizar e liberar o acesso deste usuário depois)');
          // Excel guarda CPF como número quando a célula não está formatada
          // como texto, derrubando zero à esquerda (ex.: "02793397121" vira
          // "2793397121") — completa antes de validar/comparar.
          const cpf = normalizarCpfDigitos(cpfCelula);
          const cpfError = validateCPF(cpf);
          if (cpfError) throw new Error(cpfError);

          // No upsert (CPF já cadastrado), uma célula em branco na planilha
          // NÃO apaga o valor já salvo — só sobrescreve o que a linha
          // realmente preencheu. Sem isso, reimportar só pra adicionar um
          // email (por exemplo) zerava data de nascimento/admissão, cargo,
          // filial etc. de quem já tinha esses dados.
          const existente = findByCpf(cpf);

          const nome = row['nome']?.trim() || existente?.nome;
          if (!nome) throw new Error('nome é obrigatório');

          // Email é opcional — quem ainda não tem email corporativo fica sem
          // acesso até alguém completar o cadastro (aqui mesmo, numa
          // reimportação, ou editando manualmente depois).
          const email = row['email']?.trim() || existente?.email;
          const emailError = validateEmailOpcional(email ?? '');
          if (emailError) throw new Error(emailError);

          const departamentoNome = row['departamento']?.trim() || existente?.departamento;
          if (!departamentoNome) throw new Error('departamento é obrigatório');
          const departamento = await findOrCreateDepartamento(departamentoNome);

          const cargoNome = row['cargo']?.trim() || existente?.cargo;
          const cargo = cargoNome ? await findOrCreateCargo(cargoNome) : '';

          // Só MASTER/ADMIN/GERENTE(S)/COORDENADOR(ES)_SUPERVISOR(ES) precisam ser
          // reconhecidos explicitamente (ver ROLE_ALIASES) — qualquer outro valor
          // de cargo/role (ex.: "ANALISTA", "ASSISTENTE") vira COLABORADOR
          // ("Demais Cargos"). Célula vazia é diferente: mantém o role já
          // salvo (ou COLABORADOR se o usuário é novo).
          const roleRaw = row['role']?.trim().toUpperCase().replace(/\s+/g, ' ');
          const role = roleRaw ? ROLE_ALIASES[roleRaw] || 'COLABORADOR' : existente?.role || 'COLABORADOR';

          const dataNascimento = parseDataBR(row['data_nascimento']) || existente?.dataNascimento;
          const dataAdmissao = parseDataBR(row['data_admissao']) || existente?.dataAdmissao;
          if (dataAdmissao && dataAdmissao > formatDateISO(new Date(), 'yyyy-MM-dd')) {
            throw new Error('data_admissao não pode ser no futuro');
          }

          const input = {
            nome,
            cpf,
            email,
            departamento_id: departamento.id,
            departamento: departamento.nome,
            cargo,
            role,
            filial: row['filial']?.trim() || existente?.filial,
            dataNascimento,
            dataAdmissao,
          };

          const resultado = existente ? await updateUser(existente.id, input) : await addUser(input);

          if (!resultado.ok) throw new Error(resultado.error);
          if (existente) atualizados += 1;
          else criados += 1;
        } catch (err) {
          erros.push({ linha, motivo: err instanceof Error ? err.message : String(err) });
        }
      }

      setResult({ criados, atualizados, erros });
    } catch (err) {
      setResult({
        criados: 0,
        atualizados: 0,
        erros: [{ linha: 0, motivo: err instanceof Error ? err.message : 'Falha ao ler o arquivo' }],
      });
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
          <code>data_nascimento</code> e <code>data_admissao</code> são opcionais. Só{' '}
          <code>MASTER</code>, <code>ADMIN</code>, <code>GERENTES</code> e{' '}
          <code>COORDENADORES_SUPERVISORES</code> (ou seus sinônimos, como <code>DEMAIS CARGOS</code> e{' '}
          <code>COORDENADORES E SUPERVISORES</code>) precisam ser escritos certinho — qualquer outro valor em{' '}
          <code>role</code> (vazio, <code>ANALISTA</code>, <code>ASSISTENTE</code> etc.) vira Colaborador/Demais
          Cargos automaticamente. Datas no formato DD/MM/AAAA.
        </p>
        <p className="text-sm text-secondary">
          A coluna <code>email</code> é opcional — quem ainda não tem email corporativo entra cadastrado mas sem
          acesso ao sistema até alguém completar depois (aqui mesmo, numa nova importação, ou editando o usuário). O{' '}
          <code>cpf</code> é obrigatório e funciona como identificador único: se o CPF da linha já existir, o
          usuário existente é <strong>atualizado</strong> (inclusive recebendo o email, se antes não tinha) em vez
          de gerar erro de duplicidade ou criar um cadastro repetido. Nessa atualização, uma célula em branco NÃO
          apaga o que já estava salvo — só sobrescreve os campos que a linha realmente preencheu.
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
            {result.atualizados > 0 && (
              <p className="font-medium text-success">
                🔄 {result.atualizados} usuário(s) já cadastrado(s) (mesmo CPF) atualizado(s).
              </p>
            )}
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
