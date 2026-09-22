import { BrowserAuthError, PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_MSAL_CLIENT_ID ?? '';
const tenantId = import.meta.env.VITE_MSAL_TENANT_ID ?? '';
// Página dedicada (redirect.html), não a raiz do app: o popup precisa carregar
// só o redirect bridge do MSAL — ver src/redirect.ts.
const redirectUri = import.meta.env.VITE_MSAL_REDIRECT_URI ?? `${window.location.origin}/redirect.html`;

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
  // select_account: sem isso, com uma sessão Microsoft já ativa no navegador
  // (SSO), o popup devolve direto essa conta — nunca deixa escolher outra
  // (ex.: uma conta de serviço como ti@tcheagricola.com.br).
  const request = { scopes: ['openid', 'profile', 'email'], prompt: 'select_account' };
  try {
    return (await msal.loginPopup(request)).idToken;
  } catch (err) {
    // Um popup fechado/com erro antes (ex.: redirect URI ainda não cadastrado)
    // pode deixar a flag "interaction in progress" presa no sessionStorage e
    // bloquear qualquer nova tentativa até fechar a aba. Limpa e tenta uma vez.
    if (err instanceof BrowserAuthError && err.errorCode === 'interaction_in_progress') {
      limparInteracaoPendente();
      return (await msal.loginPopup(request)).idToken;
    }
    throw err;
  }
}

function limparInteracaoPendente(): void {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.includes('interaction.status'))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // sessionStorage indisponível — nada a limpar
  }
}
