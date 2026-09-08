import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from './constants';

export function validateNome(nome: string): string | null {
  if (!nome.trim()) return 'Nome é obrigatório';
  if (nome.trim().length < 10) return 'Nome deve ter no mínimo 10 caracteres';
  return null;
}

export function validatePeso(peso: number): string | null {
  if (Number.isNaN(peso)) return 'Peso é obrigatório';
  if (peso < 0 || peso > 100) return 'Peso deve estar entre 0 e 100';
  return null;
}

export function validateEmail(email: string): string | null {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return 'Email é obrigatório';
  if (!regex.test(email)) return 'Email inválido';
  return null;
}

export function validateFile(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return 'Tipo de arquivo não aceito. Use PDF, DOC, DOCX, JPG ou PNG.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Arquivo excede o tamanho máximo de 10 MB.';
  }
  return null;
}
