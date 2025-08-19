import { Request, Response, NextFunction } from 'express';

/**
 * Extrai orgId/userId de headers simples.
 * Em produção: substitua por Auth real (JWT, Clerk, etc.).
 */
export function tenant(req: Request, _res: Response, next: NextFunction) {
  (req as any).tenant = {
    orgId: (req.headers['x-org-id'] as string) || 'public',
    userId: (req.headers['x-user-id'] as string) || 'anonymous'
  };
  next();
}
