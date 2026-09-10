import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export type AuthUser = { id: string; roles: string[]; stationId?: string };
export function verifyJwt(token: string, secret = process.env.JWT_SECRET || 'development-only-secret'): AuthUser | null {
  const [head, payload, signature] = token.split('.');
  if (!head || !payload || !signature) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${head}.${payload}`).digest('base64url');
  if (expected !== signature) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: String(claims.sub), roles: Array.isArray(claims.roles) ? claims.roles : [], stationId: claims.stationId };
  } catch { return null; }
}
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const user = token ? verifyJwt(token) : null;
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  (req as Request & { user: AuthUser }).user = user; next();
}
export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user || !roles.some((role) => user.roles.includes(role))) return res.status(403).json({ error: 'Insufficient permissions' });
  next();
};
