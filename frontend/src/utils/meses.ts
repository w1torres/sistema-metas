const NOMES_MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// "YYYY-MM" do mês corrente (usado pra saber qual mês o colaborador pode enviar).
export function mesAtual(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

// Lista "YYYY-MM" de cada mês entre data_inicio e data_fim do indicador (inclusive).
export function listarMesesDoPeriodo(dataInicio: string, dataFim: string): string[] {
  const [anoIni, mesIni] = dataInicio.slice(0, 7).split('-').map(Number);
  const [anoFim, mesFim] = dataFim.slice(0, 7).split('-').map(Number);

  const meses: string[] = [];
  let ano = anoIni;
  let mes = mesIni;
  // Limite de segurança (10 anos) — evita loop infinito se as datas vierem trocadas.
  for (let i = 0; i < 120 && (ano < anoFim || (ano === anoFim && mes <= mesFim)); i += 1) {
    meses.push(`${ano}-${String(mes).padStart(2, '0')}`);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      ano += 1;
    }
  }
  return meses;
}

// "2026-05" -> "mai/26"
export function formatMes(mes: string): string {
  const [ano, mesNum] = mes.split('-').map(Number);
  return `${NOMES_MES[mesNum - 1]}/${String(ano).slice(2)}`;
}
