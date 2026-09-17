import { Router } from 'express';
import * as controller from './controller.js';

export const authRouter = Router();

// Dev-mode antigo — mantido só até o frontend terminar de migrar pro login
// real (ver env.auth.devLoginEnabled, nunca ligado em produção).
authRouter.post('/login', controller.loginDevMode);

authRouter.post('/login-senha', controller.loginSenha);
authRouter.post('/entra', controller.loginEntraId);
authRouter.post('/solicitar-senha', controller.solicitarDefinicaoSenha);
authRouter.post('/definir-senha', controller.definirSenha);
