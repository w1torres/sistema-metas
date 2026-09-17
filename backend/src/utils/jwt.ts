import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/index.js';

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.jwt.secret, { expiresIn: env.jwt.expiry } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, env.jwt.secret) as AuthUser;
}
