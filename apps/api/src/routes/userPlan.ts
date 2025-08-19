import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * GET /v1/user/plan - Get current user's plan
 * Retorna o plano atual do usuário autenticado
 */
export async function routeGetUserPlan(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!orgId || !userId) {
      return res.status(400).json({
        error: 'Missing organization or user ID in headers'
      });
    }

    console.log(`🔍 [USER PLAN] Buscando plano para org: ${orgId}, user: ${userId}`);

    // Buscar organização e seu plano/subscription
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        plan: {
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
        },
        subscriptions: {
          where: { 
            active: true,
            stripeStatus: { in: ['active', 'trialing'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            plan: {
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
            }
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Priorizar plano da subscription ativa, senão usar plano da organização
    let currentPlan = null;
    let subscriptionStatus = null;

    if (organization.subscriptions.length > 0) {
      const activeSubscription = organization.subscriptions[0];
      currentPlan = activeSubscription.plan;
      subscriptionStatus = {
        stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
        stripeStatus: activeSubscription.stripeStatus,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd
      };
    } else if (organization.plan) {
      currentPlan = organization.plan;
    }

    if (!currentPlan) {
      // Se não há plano definido, atribuir plano FREE por padrão
      console.log(`⚠️ [USER PLAN] Organização sem plano, atribuindo FREE`);
      
      const freePlan = await prisma.plan.findFirst({
        where: { code: 'free' }
      });

      if (freePlan) {
        // Atualizar organização com plano FREE
        await prisma.organization.update({
          where: { id: orgId },
          data: { planId: freePlan.id }
        });

        currentPlan = freePlan;
      }
    }

    if (!currentPlan) {
      return res.status(500).json({
        error: 'Unable to determine user plan'
      });
    }

    console.log(`✅ [USER PLAN] Plano encontrado: ${currentPlan.code} (${currentPlan.name})`);

    res.json({
      success: true,
      plan: currentPlan,
      subscription: subscriptionStatus,
      organization: {
        id: organization.id,
        name: organization.name
      }
    });

  } catch (error) {
    console.error('❌ [USER PLAN] Erro ao buscar plano do usuário:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}