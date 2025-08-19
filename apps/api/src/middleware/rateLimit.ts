import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limit (requests-per-minute) por IP.
 * Não use em produção sem um store distribuído (Redis etc.).
 */
type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

const RPM = Number(process.env.RATE_LIMIT_RPM || 120);
const REFILL_MS = 60_000;

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { tokens: RPM, updatedAt: now };
    buckets.set(ip, bucket);
  } else {
    // refill proporcional
    const elapsed = now - bucket.updatedAt;
    const refill = Math.floor((elapsed / REFILL_MS) * RPM);
    if (refill > 0) {
      bucket.tokens = Math.min(RPM, bucket.tokens + refill);
      bucket.updatedAt = now;
    }
  }
  if (bucket.tokens <= 0) {
    res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
    return;
  }
  bucket.tokens -= 1;
  next();
}
