import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env.js';

// O backend só VALIDA o token que o frontend já obteve via MSAL
// (@azure/msal-browser) — não faz nenhum fluxo de confidential client, por
// isso não precisa do client secret (ver .env.example). A verificação é
// puramente contra a chave pública do Entra ID (JWKS), checando também que o
// token foi emitido pro nosso Client ID (audience) e pelo nosso tenant
// (issuer) — sem isso, qualquer token válido de QUALQUER app Entra ID
// passaria na checagem.
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${env.auth.msal.tenantId}/discovery/v2.0/keys`,
});

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error('Chave de assinatura do Entra ID não encontrada'));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

export interface EntraIdClaims {
  email?: string;
  preferred_username?: string;
  oid?: string;
  name?: string;
}

export function validarTokenEntraId(idToken: string): Promise<EntraIdClaims> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      getSigningKey,
      {
        audience: env.auth.msal.clientId,
        issuer: `https://login.microsoftonline.com/${env.auth.msal.tenantId}/v2.0`,
      },
      (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
          reject(err ?? new Error('Token do Entra ID inválido'));
          return;
        }
        resolve(decoded as EntraIdClaims);
      },
    );
  });
}
