import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const dashboardRouter = Router();

dashboardRouter.use(authMiddleware, requireRole('MASTER', 'GESTOR'));
dashboardRouter.get('/stats', controller.stats);
