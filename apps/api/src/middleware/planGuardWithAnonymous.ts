import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';

/**
 * Verifica limites do plano da organização (tokens por dia e storage).
 * Suporta usuários anônimos com limites especiais.
 * Exige tenant middleware antes.
 */
export async function planGuardWithAnonymous(req: Request, res: Response, next: NextFunction) {
  const t = (req as any).tenant || { orgId: 'public' };
  const orgId = t.orgId;
  if (!orgId) return res.status(401).json({ error: 'No org' });

  // Handle anonymous users with special limits
  if (orgId === 'anonymous') {
    (req as any).plan = {
      dailyTokenLimit: 1000, // Low limit for anonymous
      storageLimitMB: 0, // No file uploads for anonymous
      name: 'Anonymous'
    };
    
    // Store anonymous session info for usage tracking
    (req as any).isAnonymous = true;
    return next();
  }

  // Subscription ativa mais recente para usuários registrados
  const sub = await prisma.subscription.findFirst({
    where: { orgId, active: true },
    orderBy: { periodStart: 'desc' },
    include: { plan: true }
  });
  const plan = sub?.plan;
  if (!plan) {
    return res.status(402).json({ error: 'No active plan. Assign a plan to this org.' });
  }

  // Checa tokens do dia
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const usage = await prisma.usage.groupBy({
    by: ['day'],
    where: { orgId, day },
    _sum: { total_tokens: true }
  });
  const usedToday = usage[0]?._sum.total_tokens || 0;
  if (plan.dailyTokenLimit && usedToday >= plan.dailyTokenLimit) {
    return res.status(429).json({ error: 'Daily token limit reached for plan.' });
  }

  // Checa storage total
  const storage = await prisma.fileAsset.aggregate({
    where: { orgId },
    _sum: { sizeBytes: true }
  });
  const sizeMB = Math.floor((storage._sum.sizeBytes || 0) / (1024*1024));
  if (plan.storageLimitMB && sizeMB >= plan.storageLimitMB) {
    return res.status(413).json({ error: 'Storage limit reached for plan.' });
  }

  (req as any).plan = plan;
  (req as any).isAnonymous = false;
  next();
}