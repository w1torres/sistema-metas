import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as controller from './controller.js';

export const usersRouter = Router();

usersRouter.use(authMiddleware);
// Listar é liberado pra qualquer papel autenticado — o resto do frontend
// (escolher responsável por indicador, exibir nome/departamento de colega
// etc.) sempre pôde ler a lista inteira de usuários, mock ou real; só
// criar/editar/desativar/excluir é exclusivo de quem administra usuários.
usersRouter.get('/', controller.list);
usersRouter.post('/', requireRole('MASTER', 'ADMIN'), controller.create);
usersRouter.put('/:id', requireRole('MASTER', 'ADMIN'), controller.update);
usersRouter.patch('/:id/ativo', requireRole('MASTER', 'ADMIN'), controller.toggleAtivo);
usersRouter.delete('/:id', requireRole('MASTER', 'ADMIN'), controller.remove);
