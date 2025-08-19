import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { DEFAULT_PLANS } from '@shared/plans';

export async function routeAdminSeedPlans(_req: Request, res: Response) {
  for (const p of DEFAULT_PLANS) {
    await prisma.plan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        monthlyCreditsTokens: p.monthlyCreditsTokens,
        dailyTokenLimit: p.dailyTokenLimit,
        storageLimitMB: p.storageLimitMB,
        maxFileSizeMB: p.maxFileSizeMB,
        features: JSON.stringify(p.features)
      },
      create: {
        code: p.code,
        name: p.name,
        monthlyCreditsTokens: p.monthlyCreditsTokens,
        dailyTokenLimit: p.dailyTokenLimit,
        storageLimitMB: p.storageLimitMB,
        maxFileSizeMB: p.maxFileSizeMB,
        features: JSON.stringify(p.features)
      }
    });
  }
  return res.json({ ok: true, seeded: DEFAULT_PLANS.map(p=>p.code) });
}
