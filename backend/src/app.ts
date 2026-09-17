import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/routes.js';
import { usersRouter } from './modules/users/routes.js';
import { departamentosRouter } from './modules/departamentos/routes.js';
import { cargosRouter } from './modules/cargos/routes.js';
import { trilhasRouter } from './modules/trilhas/routes.js';
import { pprRouter } from './modules/ppr/routes.js';
import { indicatorsRouter } from './modules/indicators/routes.js';
import { dashboardRouter } from './modules/dashboard/routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/departamentos', departamentosRouter);
app.use('/api/cargos', cargosRouter);
app.use('/api/trilhas', trilhasRouter);
app.use('/api/ppr', pprRouter);
app.use('/api/indicators', indicatorsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

app.use(errorHandler);
