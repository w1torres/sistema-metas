import { env } from '../config/env.js';

// Corporativo = login via Microsoft Entra ID; qualquer outro domínio = senha
// (ver env.auth.corporateEmailDomains, configurável sem mudar código).
export function isCorporateEmail(email: string): boolean {
  const dominio = email.trim().toLowerCase().split('@')[1];
  if (!dominio) return false;
  return env.auth.corporateEmailDomains.includes(dominio);
}
