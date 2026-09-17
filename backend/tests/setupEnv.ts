// Roda antes de qualquer import do app em cada arquivo de teste — garante que
// os testes usam um banco isolado (metas_db_test) e nunca o de desenvolvimento.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'metas_db_test';
process.env.JWT_SECRET = 'test-secret-32-characters-minimum-please';
