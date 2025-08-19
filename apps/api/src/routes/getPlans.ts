import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * GET /v1/plans - Lista todos os planos disponíveis
 */
export async function routeGetPlans(_req: Request, res: Response) {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        monthlyCreditsTokens: true,
        dailyTokenLimit: true,
        storageLimitMB: true,
        maxFileSizeMB: true,
        features: true
      }
    });

    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features)
    }));

    res.json({ plans: formattedPlans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
}