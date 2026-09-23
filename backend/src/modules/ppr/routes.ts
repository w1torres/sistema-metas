import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const pprRouter = Router();

pprRouter.use(authMiddleware);
pprRouter.get('/faixas', controller.list);
// Registrada ANTES de '/faixas/:id' — mais específica, sem :id.
pprRouter.put('/faixas', requireRole('MASTER'), controller.atualizarBandas);
pprRouter.patch('/faixas/:id', requireRole('MASTER'), controller.updateMultiplo);
