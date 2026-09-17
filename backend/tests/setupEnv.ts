// Roda antes de qualquer import do app em cada arquivo de teste — garante que
// os testes usam um banco isolado (metas_db_test) e nunca o de desenvolvimento.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'metas_db_test';
process.env.JWT_SECRET = 'test-secret-32-characters-minimum-please';
// Os testes existentes de RBAC/aprovação usam o login dev-mode (só email) —
// ver env.auth.devLoginEnabled em config/env.ts.
process.env.DEV_LOGIN_ENABLED = 'true';
process.env.CORPORATE_EMAIL_DOMAINS = 'corp.teste.com';
// Evita precisar de um token Entra ID real (JWKS de verdade) nos testes —
// ver env.auth.msal.modoLocal em config/env.ts.
process.env.MSAL_MODO_LOCAL = 'true';
