import * as XLSX from 'xlsx';
import { parse as parseDate, isValid as isValidDate, isBefore } from 'date-fns';
import * as usersRepository from '../users/repository.js';
import * as indicatorsService from './service.js';
import { env } from '../../config/env.js';
import type { AuthUser } from '../../types/index.js';

interface LinhaPlanilha {
  Nome?: string;
  Peso?: string | number;
  'Responsável (CPF)'?: string;
  Objetivo?: string;
  Detalhamento?: string;
  'Data Início'?: string;
  'Data Fim'?: string;
  Pilar?: string;
  'Função'?: string;
  Meta?: string;
  'Forma de Medição'?: string;
  'Evidência Obrigatória'?: string;
}

interface ErroImport {
  linha: number;
  nome?: string;
  erro: string;
}

export interface ImportResult {
  total_importados: number;
  sucesso: number;
  erros: number;
  detalhes: ErroImport[];
}

function parseDataBR(valor: string | undefined): Date | null {
  if (!valor) return null;
  const data = parseDate(valor.trim(), 'dd/MM/yyyy', new Date());
  return isValidDate(data) ? data : null;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isXlsxBuffer(buffer: Buffer): boolean {
  // Assinatura ZIP (PK\x03\x04) — .xlsx é um ZIP por dentro. CSV puro não tem
  // esse cabeçalho, então tratamos como texto UTF-8 nesse caso.
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

export function parsePlanilha(buffer: Buffer): LinhaPlanilha[] {
  // Ler CSV como `type: 'buffer'` faz o SheetJS adivinhar a codepage e
  // corrompe acentos ("Responsável" -> "ResponsÃ¡vel"). Decodificar nós
  // mesmos como UTF-8 e entregar `type: 'string'` evita esse chute.
  const workbook = isXlsxBuffer(buffer)
    ? XLSX.read(buffer, { type: 'buffer' })
    : XLSX.read(buffer.toString('utf8').replace(/^﻿/, ''), { type: 'string' });

  const primeiraAba = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[primeiraAba];
  // `raw: false` faz células que parecem data (ex: "01/05/2026") voltarem
  // como o texto original em vez de serem convertidas em serial date do Excel.
  return XLSX.utils.sheet_to_json<LinhaPlanilha>(worksheet, { raw: false, defval: '' });
}

// Colunas e validações exatas de files/backend-etapa-2.1-completo/IMPORT_PLANILHA_TEMPLATE.md.
// Cada linha é processada isoladamente — uma linha inválida não derruba o
// import inteiro, só entra em `detalhes` com o motivo.
export async function importarIndicadores(user: AuthUser, buffer: Buffer): Promise<ImportResult> {
  const linhas = parsePlanilha(buffer);
  if (linhas.length > env.import.maxRows) {
    throw Object.assign(new Error(`Planilha excede o limite de ${env.import.maxRows} linhas`), { status: 400 });
  }

  const detalhes: ErroImport[] = [];
  let sucesso = 0;

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i];
    const numeroLinha = i + 2; // +1 pelo índice 0-based, +1 pelo cabeçalho
    const nome = String(linha.Nome ?? '').trim();

    try {
      if (!nome) throw new Error('Nome é obrigatório');

      const peso = Number(String(linha.Peso ?? '').replace(',', ''));
      if (Number.isNaN(peso) || peso < 0 || peso > 100) {
        throw new Error('Peso deve ser um número entre 0 e 100 (use ponto, não vírgula)');
      }

      const cpf = String(linha['Responsável (CPF)'] ?? '').trim();
      if (!cpf) throw new Error('Responsável (CPF) é obrigatório');
      const responsavel = await usersRepository.findByCpf(cpf);
      if (!responsavel) throw new Error(`Responsável com CPF '${cpf}' não encontrado no sistema`);

      const objetivo = String(linha.Objetivo ?? '').trim();
      if (!objetivo) throw new Error('Objetivo é obrigatório');

      const dataInicio = parseDataBR(String(linha['Data Início'] ?? ''));
      if (!dataInicio) throw new Error('Data Início inválida — use o formato DD/MM/AAAA');
      const dataFim = parseDataBR(String(linha['Data Fim'] ?? ''));
      if (!dataFim) throw new Error('Data Fim inválida — use o formato DD/MM/AAAA');
      if (isBefore(dataFim, dataInicio)) throw new Error('Data Fim deve ser maior ou igual à Data Início');

      await indicatorsService.createIndicador(user, {
        departamento_id: responsavel.departamento_id,
        usuario_responsavel_id: responsavel.id,
        nome,
        peso,
        objetivo,
        detalhamento: String(linha.Detalhamento ?? '').trim() || null,
        data_inicio: toISODate(dataInicio),
        data_fim: toISODate(dataFim),
        pilar: String(linha.Pilar ?? '').trim() || null,
        funcao: String(linha['Função'] ?? '').trim() || null,
        meta: String(linha.Meta ?? '').trim() || null,
        forma_medicao: String(linha['Forma de Medição'] ?? '').trim() || null,
        evidencia_obrigatoria: String(linha['Evidência Obrigatória'] ?? '').trim() || null,
      });
      sucesso += 1;
    } catch (err) {
      detalhes.push({ linha: numeroLinha, nome: nome || undefined, erro: err instanceof Error ? err.message : String(err) });
    }
  }

  return { total_importados: linhas.length, sucesso, erros: detalhes.length, detalhes };
}
