import { Request, Response, NextFunction } from 'express';

/**
 * Rate limit por organização/usuário (in-memory).
 * Use Redis em produção e resete por janela.
 */
type Bucket = { tokens: number; updatedAt: number };

const orgBuckets = new Map<string, Bucket>();
const userBuckets = new Map<string, Bucket>();

const ORG_RPM = Number(process.env.ORG_RATE_LIMIT_RPM || 600);
const USER_RPM = Number(process.env.USER_RATE_LIMIT_RPM || 240);
const REFILL_MS = 60_000;

function tryConsume(map: Map<string, Bucket>, key: string, limit: number): boolean {
  const now = Date.now();
  let b = map.get(key);
  if (!b) { b = { tokens: limit, updatedAt: now }; map.set(key, b); }
  const elapsed = now - b.updatedAt;
  const refill = Math.floor((elapsed / REFILL_MS) * limit);
  if (refill > 0) {
    b.tokens = Math.min(limit, b.tokens + refill);
    b.updatedAt = now;
  }
  if (b.tokens <= 0) return false;
  b.tokens -= 1;
  return true;
}

export function orgUserRateLimit(req: Request, res: Response, next: NextFunction) {
  const tenant = (req as any).tenant || { orgId: 'public', userId: 'anonymous' };
  if (!tryConsume(orgBuckets, tenant.orgId, ORG_RPM)) {
    return res.status(429).json({ error: 'Org rate limit exceeded' });
  }
  if (!tryConsume(userBuckets, `${tenant.orgId}:${tenant.userId}`, USER_RPM)) {
    return res.status(429).json({ error: 'User rate limit exceeded' });
  }
  next();
}
