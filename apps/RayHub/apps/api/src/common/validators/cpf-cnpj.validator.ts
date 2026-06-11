/**
 * Validador de CPF e CNPJ — Algoritmo Módulo 11
 * 
 * Conforme regulamentação da Receita Federal do Brasil.
 * CPF: Instrução Normativa RFB nº 1.548/2015
 * CNPJ: Instrução Normativa RFB nº 2.119/2022
 */

/**
 * Remove todos os caracteres não numéricos de um documento.
 */
export function sanitizeDocument(doc: string): string {
  return (doc || '').replace(/\D/g, '');
}

/**
 * Valida um CPF (11 dígitos) usando o algoritmo módulo 11.
 * 
 * @param cpf - CPF com ou sem formatação (ex: "123.456.789-09" ou "12345678909")
 * @returns true se o CPF é válido
 */
export function isValidCpf(cpf: string): boolean {
  const cleaned = sanitizeDocument(cpf);

  if (cleaned.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

/**
 * Valida um CNPJ (14 dígitos) usando o algoritmo módulo 11.
 * 
 * @param cnpj - CNPJ com ou sem formatação (ex: "12.345.678/0001-95" ou "12345678000195")
 * @returns true se o CNPJ é válido
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleaned = sanitizeDocument(cnpj);

  if (cleaned.length !== 14) return false;

  // Rejeita CNPJs com todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Pesos para o cálculo dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned.charAt(12))) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned.charAt(13))) return false;

  return true;
}

/**
 * Valida CPF ou CNPJ automaticamente baseado no tamanho.
 * 
 * @param doc - CPF (11 dígitos) ou CNPJ (14 dígitos) com ou sem formatação
 * @returns { valid: boolean; type: 'cpf' | 'cnpj' | 'unknown'; cleaned: string }
 */
export function validateDocument(doc: string): {
  valid: boolean;
  type: 'cpf' | 'cnpj' | 'unknown';
  cleaned: string;
  formatted: string;
} {
  const cleaned = sanitizeDocument(doc);

  if (cleaned.length === 11) {
    return {
      valid: isValidCpf(cleaned),
      type: 'cpf',
      cleaned,
      formatted: formatCpf(cleaned),
    };
  }

  if (cleaned.length === 14) {
    return {
      valid: isValidCnpj(cleaned),
      type: 'cnpj',
      cleaned,
      formatted: formatCnpj(cleaned),
    };
  }

  return {
    valid: false,
    type: 'unknown',
    cleaned,
    formatted: cleaned,
  };
}

/**
 * Formata um CPF: 123.456.789-09
 */
export function formatCpf(cpf: string): string {
  const c = sanitizeDocument(cpf);
  if (c.length !== 11) return c;
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
}

/**
 * Formata um CNPJ: 12.345.678/0001-95
 */
export function formatCnpj(cnpj: string): string {
  const c = sanitizeDocument(cnpj);
  if (c.length !== 14) return c;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}
