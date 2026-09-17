import { PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID ?? '';
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID ?? '';
const redirectUri = import.meta.env.VITE_MSAL_REDIRECT_URI ?? window.location.origin;

const corporateEmailDomains = (import.meta.env.VITE_CORPORATE_EMAIL_DOMAINS ?? '')
  .split(',')
  .map((d: string) => d.trim().toLowerCase())
  .filter(Boolean);

// Espelha MSAL_MODO_LOCAL do backend — só faz sentido true enquanto o
// redirect URI desta app (SPA) ainda não foi registrado no Azure AD. Com
// isso true, o botão "Entrar com Microsoft" não abre popup nenhum: manda o
// email digitado direto pro backend, que aceita sem validar token (nunca em
// produção, ver env.auth.msal.modoLocal no backend).
export const msalModoLocal = import.meta.env.VITE_MSAL_MODO_LOCAL === 'true';

// Só decide qual formulário mostrar (senha vs. Microsoft) — quem valida de
// verdade é sempre o backend (env.auth.corporateEmailDomains).
export function isCorporateEmail(email: string): boolean {
  const dominio = email.trim().toLowerCase().split('@')[1];
  if (!dominio) return false;
  return corporateEmailDomains.includes(dominio);
}

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri,
      },
      cache: { cacheLocation: 'sessionStorage' },
    });
    await msalInstance.initialize();
  }
  return msalInstance;
}

// Popup em vez de redirect: mais simples aqui (não precisa tratar a
// promise de retorno de redirect na inicialização do App).
export async function loginComEntraId(): Promise<string> {
  if (!clientId || !tenantId) {
    throw new Error('Login com Microsoft não configurado (VITE_MSAL_CLIENT_ID/VITE_MSAL_TENANT_ID ausentes).');
  }
  const msal = await getMsalInstance();
  const result = await msal.loginPopup({ scopes: ['openid', 'profile', 'email'] });
  return result.idToken;
}
