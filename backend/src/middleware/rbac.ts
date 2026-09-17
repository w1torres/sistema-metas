import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import type { Role } from '../types/index.js';

// Só garante o papel mínimo para acessar a rota — o escopo por
// departamento_id (GESTOR só vê o próprio departamento) é responsabilidade de
// cada service, não deste middleware, porque endpoints como GET
// /api/indicators são compartilhados entre MASTER e GESTOR com resultados
// diferentes, não um bloqueio binário de acesso.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(`Acesso restrito a: ${roles.join(', ')}`);
    }
    next();
  };
}
