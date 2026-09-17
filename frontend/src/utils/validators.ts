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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email é obrigatório';
  if (!EMAIL_REGEX.test(email)) return 'Email inválido';
  return null;
}

// Campo opcional (ex.: importação de planilha, onde nem todo mundo já tem
// email corporativo) — só valida o formato quando algo foi digitado.
export function validateEmailOpcional(email: string): string | null {
  if (!email.trim()) return null;
  if (!EMAIL_REGEX.test(email)) return 'Email inválido';
  return null;
}

// Planilhas Excel guardam CPF como número quando a célula não está formatada
// como texto — isso derruba zeros à esquerda (ex.: "02793397121" vira
// "2793397121"). CPF tem sempre 11 dígitos, então completa à esquerda antes
// de validar/comparar. Usar só em leitura de planilha (import) — nunca em
// digitação manual, onde um CPF de 10 dígitos é erro de digitação, não zero
// perdido, e "corrigir" sozinho esconderia o erro.
export function normalizarCpfDigitos(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '');
  if (!digitos || digitos.length >= 11) return digitos;
  return digitos.padStart(11, '0');
}

// Algoritmo oficial de validação do CPF (módulo 11 nos dois dígitos
// verificadores) — rejeita também sequências de dígito repetido (111.111.111-11
// etc.), que passariam no cálculo do dígito verificador mas não são CPFs reais.
export function validateCPF(cpf: string): string | null {
  const digitos = cpf.replace(/\D/g, '');
  if (!digitos) return null; // campo opcional

  if (digitos.length !== 11) return 'CPF deve ter 11 dígitos';
  if (/^(\d)\1{10}$/.test(digitos)) return 'CPF inválido';

  const calcularDigito = (base: string): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i += 1) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const digito1 = calcularDigito(digitos.slice(0, 9));
  const digito2 = calcularDigito(digitos.slice(0, 9) + digito1);
  if (`${digito1}${digito2}` !== digitos.slice(9)) return 'CPF inválido';

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
