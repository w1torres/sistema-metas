import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => {
  logger.info(`Sistema de Metas API rodando em http://localhost:${env.port} (${env.nodeEnv})`);
});
