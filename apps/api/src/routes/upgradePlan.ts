import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * POST /v1/user/upgrade - Faz upgrade do plano do usuário
 * Body: { planCode: string }
 */
export async function routeUpgradePlan(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { planCode } = req.body;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (!planCode) {
      return res.status(400).json({ error: 'Plan code required' });
    }

    // Verificar se o plano existe
    const targetPlan = await prisma.plan.findUnique({ 
      where: { code: planCode } 
    });

    if (!targetPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verificar se a organização existe
    let org = await prisma.organization.findUnique({ 
      where: { id: orgId } 
    });

    if (!org) {
      // Criar organização se não existir
      org = await prisma.organization.create({ 
        data: { id: orgId, name: orgId } 
      });
    }

    // Verificar plano atual
    const currentSubscription = await prisma.subscription.findFirst({
      where: { orgId, active: true },
      include: { plan: true }
    });

    if (currentSubscription && currentSubscription.plan.code === planCode) {
      return res.status(400).json({ 
        error: 'User is already on this plan',
        currentPlan: currentSubscription.plan.code
      });
    }

    // Desativar assinaturas anteriores
    await prisma.subscription.updateMany({
      where: { orgId, active: true },
      data: { active: false }
    });

    // Criar nova assinatura (30 dias)
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const newSubscription = await prisma.subscription.create({
      data: {
        orgId,
        planId: targetPlan.id,
        active: true,
        periodStart: now,
        periodEnd
      },
      include: {
        plan: true
      }
    });

    res.json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.name} plan`,
      subscription: {
        id: newSubscription.id,
        plan: {
          ...newSubscription.plan,
          features: JSON.parse(newSubscription.plan.features)
        },
        periodStart: newSubscription.periodStart,
        periodEnd: newSubscription.periodEnd
      }
    });

  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
}