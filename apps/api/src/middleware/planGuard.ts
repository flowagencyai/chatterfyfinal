import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';

/**
 * Verifica limites do plano da organização (tokens por dia e storage).
 * Exige tenant middleware antes.
 */
export async function planGuard(req: Request, res: Response, next: NextFunction) {
  const t = (req as any).tenant || { orgId: 'public' };
  const orgId = t.orgId;
  if (!orgId) return res.status(401).json({ error: 'No org' });

  // Get organization with subscription and custom limits
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      subscriptions: {
        where: { active: true },
        orderBy: { periodStart: 'desc' },
        include: { plan: true },
        take: 1
      }
    }
  });

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const subscription = org.subscriptions[0];
  const plan = subscription?.plan;
  if (!plan) {
    return res.status(402).json({ error: 'No active plan. Assign a plan to this org.' });
  }

  // Calculate effective limits (custom limits override plan defaults)
  const effectiveLimits = {
    dailyTokenLimit: org.customDailyTokens ?? plan.dailyTokenLimit,
    storageLimitMB: org.customStorageMB ?? plan.storageLimitMB,
    maxFileSizeMB: org.customMaxFileSizeMB ?? plan.maxFileSizeMB,
    monthlyCreditsTokens: org.customMonthlyTokens ?? plan.monthlyCreditsTokens
  };

  // Checa tokens do dia
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const usage = await prisma.usage.groupBy({
    by: ['day'],
    where: { orgId, day },
    _sum: { total_tokens: true }
  });
  const usedToday = usage[0]?._sum.total_tokens || 0;
  if (effectiveLimits.dailyTokenLimit && usedToday >= effectiveLimits.dailyTokenLimit) {
    const limitType = org.customDailyTokens ? 'custom daily' : 'plan daily';
    return res.status(429).json({ 
      error: `Daily token limit reached (${limitType}: ${effectiveLimits.dailyTokenLimit} tokens).` 
    });
  }

  // Checa storage total
  const storage = await prisma.fileAsset.aggregate({
    where: { orgId },
    _sum: { sizeBytes: true }
  });
  const sizeMB = Math.floor((storage._sum.sizeBytes || 0) / (1024*1024));
  if (effectiveLimits.storageLimitMB && sizeMB >= effectiveLimits.storageLimitMB) {
    const limitType = org.customStorageMB ? 'custom storage' : 'plan storage';
    return res.status(413).json({ 
      error: `Storage limit reached (${limitType}: ${effectiveLimits.storageLimitMB} MB).` 
    });
  }

  // Attach both plan and effective limits to request
  (req as any).plan = plan;
  (req as any).effectiveLimits = effectiveLimits;
  (req as any).organization = org;
  next();
}
