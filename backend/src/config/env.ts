import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST ?? 'localhost',
    // 5433, não 5432 — a máquina já tem um PostgreSQL nativo na porta padrão
    // (ver docker-compose.yml).
    port: Number(process.env.DB_PORT ?? 5433),
    name: process.env.DB_NAME ?? 'metas_db',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres123',
    poolMin: Number(process.env.DB_POOL_MIN ?? 2),
    poolMax: Number(process.env.DB_POOL_MAX ?? 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-only-secret-troque-em-producao-32-chars',
    expiry: process.env.JWT_EXPIRY ?? '8h',
  },

  storage: {
    localPath: process.env.STORAGE_LOCAL_PATH ?? './uploads',
    maxFileSize: Number(process.env.MAX_FILE_SIZE ?? 10 * 1024 * 1024),
  },

  import: {
    maxFileSize: Number(process.env.IMPORT_MAX_FILE_SIZE ?? 5 * 1024 * 1024),
    maxRows: Number(process.env.IMPORT_MAX_ROWS ?? 1000),
  },
};
