import * as XLSX from 'xlsx';
import { parseCSV, csvRowsToObjects } from './csv';

export function downloadXLSX(filename: string, header: string[], rows: (string | number)[][]): void {
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');
  XLSX.writeFile(workbook, filename);
}

function isXlsxBuffer(buffer: ArrayBuffer): boolean {
  // .xlsx é um ZIP por dentro (assinatura PK\x03\x04) — CSV puro não tem esse
  // cabeçalho, então tratamos qualquer coisa sem ele como texto CSV.
  const bytes = new Uint8Array(buffer.slice(0, 4));
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

// Aceita .xlsx (gerado pelo botão "Baixar modelo") ou .csv (planilha salva/exportada
// como CSV) — detecta pelo conteúdo, não pela extensão do arquivo.
export async function readSpreadsheetFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();

  if (isXlsxBuffer(buffer)) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const primeiraAba = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[primeiraAba];
    const linhas = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { raw: false, defval: '' });
    // Normaliza as chaves (nome das colunas) pra minúsculo, igual ao csvRowsToObjects,
    // já que o resto do código espera as chaves em minúsculo (ex.: row['email']).
    return linhas.map((linha) => {
      const normalizada: Record<string, string> = {};
      Object.entries(linha).forEach(([chave, valor]) => {
        normalizada[chave.trim().toLowerCase()] = String(valor ?? '').trim();
      });
      return normalizada;
    });
  }

  // CSV: decodificar como UTF-8 nós mesmos (removendo um possível BOM) — deixar
  // o navegador adivinhar a codepage a partir de bytes crus corrompe acentos.
  const texto = new TextDecoder('utf-8').decode(buffer).replace(/^﻿/, '');
  return csvRowsToObjects(parseCSV(texto));
}
