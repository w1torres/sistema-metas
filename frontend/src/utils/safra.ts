export interface Safra {
  id: string; // "2025-2026"
  label: string; // "Safra 25/26"
  dataInicio: string; // "2025-05-01"
  dataFim: string; // "2026-04-30"
}

const MES_INICIO_SAFRA = 5; // maio

export function buildSafra(anoInicio: number): Safra {
  const anoFim = anoInicio + 1;
  const pad2 = (n: number) => String(n).slice(-2);
  return {
    id: `${anoInicio}-${anoFim}`,
    label: `Safra ${pad2(anoInicio)}/${pad2(anoFim)}`,
    dataInicio: `${anoInicio}-05-01`,
    dataFim: `${anoFim}-04-30`,
  };
}

export function getSafraForDate(dateIso: string): Safra {
  const [ano, mes] = dateIso.split('-').map(Number);
  const anoInicio = mes >= MES_INICIO_SAFRA ? ano : ano - 1;
  return buildSafra(anoInicio);
}

export function getSafraAtual(): Safra {
  const now = new Date();
  return getSafraForDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
}

/**
 * Lista de safras para seletores — um intervalo em torno da safra atual,
 * da mais recente para a mais antiga.
 */
export function listSafras(anosAntes = 3, anosDepois = 1): Safra[] {
  const anoAtual = Number(getSafraAtual().id.split('-')[0]);
  const safras: Safra[] = [];
  for (let ano = anoAtual + anosDepois; ano >= anoAtual - anosAntes; ano -= 1) {
    safras.push(buildSafra(ano));
  }
  return safras;
}

/**
 * Aceita "25/26", "2025/26", "2025/2026" ou "Safra 25/26" e retorna a safra
 * correspondente, ou null se não reconhecer o formato.
 */
export function parseSafraLabel(texto: string): Safra | null {
  const limpo = texto.trim().replace(/^safra\s*/i, '');
  const match = limpo.match(/^(\d{2}|\d{4})\s*\/\s*(\d{2}|\d{4})$/);
  if (!match) return null;

  const anoInicioRaw = match[1];
  const anoInicio = anoInicioRaw.length === 2 ? 2000 + Number(anoInicioRaw) : Number(anoInicioRaw);
  if (Number.isNaN(anoInicio)) return null;

  return buildSafra(anoInicio);
}

export function findSafraById(safras: Safra[], id: string): Safra | undefined {
  return safras.find((s) => s.id === id);
}
