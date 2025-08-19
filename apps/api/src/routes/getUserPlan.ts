import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * GET /v1/user/plan - Retorna o plano atual do usuário
 */
export async function routeGetUserPlan(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Buscar assinatura ativa da organização
    const subscription = await prisma.subscription.findFirst({
      where: {
        orgId,
        active: true
      },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      // Se não tem assinatura, retorna plano free como padrão
      const freePlan = await prisma.plan.findUnique({ 
        where: { code: 'free' } 
      });
      
      if (!freePlan) {
        return res.status(404).json({ error: 'No plans configured' });
      }

      return res.json({
        plan: {
          ...freePlan,
          features: JSON.parse(freePlan.features)
        },
        subscription: null
      });
    }

    res.json({
      plan: {
        ...subscription.plan,
        features: JSON.parse(subscription.plan.features)
      },
      subscription: {
        id: subscription.id,
        active: subscription.active,
        periodStart: subscription.periodStart,
        periodEnd: subscription.periodEnd
      }
    });
  } catch (error) {
    console.error('Error fetching user plan:', error);
    res.status(500).json({ error: 'Failed to fetch user plan' });
  }
}