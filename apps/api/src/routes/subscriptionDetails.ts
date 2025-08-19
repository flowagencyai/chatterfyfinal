import { Request, Response } from 'express';
import prisma from '../db/prisma';

/**
 * GET /v1/user/subscription-detailed - Retorna informações detalhadas da assinatura
 */
export async function routeSubscriptionDetails(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Buscar assinatura atual (ativa ou cancelada mas não expirada)
    const subscription = await prisma.subscription.findFirst({
      where: {
        orgId,
        active: true
      },
      include: {
        plan: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      // Buscar plano free padrão
      const freePlan = await prisma.plan.findUnique({ 
        where: { code: 'free' } 
      });
      
      return res.json({
        currentPlan: freePlan ? {
          ...freePlan,
          features: JSON.parse(freePlan.features)
        } : null,
        subscription: null,
        status: 'no_subscription',
        billingInfo: null
      });
    }

    const now = new Date();
    const periodEnd = subscription.currentPeriodEnd || subscription.periodEnd;
    const isExpired = now > periodEnd;

    // Determinar status da assinatura
    let status: string;
    if (isExpired) {
      status = 'expired';
    } else if (subscription.cancelAtPeriodEnd) {
      status = 'cancelled_end_of_cycle';
    } else {
      status = subscription.stripeStatus || 'active';
    }

    // Calcular dias até expiração/renovação
    const daysUntilPeriodEnd = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      currentPlan: {
        ...subscription.plan,
        features: JSON.parse(subscription.plan.features)
      },
      subscription: {
        id: subscription.id,
        status,
        active: subscription.active && !isExpired,
        
        // Períodos
        currentPeriodStart: subscription.currentPeriodStart || subscription.periodStart,
        currentPeriodEnd: subscription.currentPeriodEnd || subscription.periodEnd,
        daysUntilPeriodEnd: Math.max(0, daysUntilPeriodEnd),
        
        // Cancelamento
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        cancellationReason: subscription.cancellationReason,
        canReactivate: subscription.cancelAtPeriodEnd && !isExpired,
        
        // Retenção
        retentionOffersCount: subscription.retentionOffersCount,
        canOfferRetention: subscription.retentionOffersCount < 3, // Max 3 ofertas
        
        // Stripe
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripeCustomerId: subscription.stripeCustomerId
      },
      billingInfo: {
        nextBillingDate: subscription.cancelAtPeriodEnd ? null : periodEnd,
        lastPaymentDate: subscription.currentPeriodStart || subscription.periodStart,
        amount: getAmountFromPlan(subscription.plan.code), // Helper function
        currency: 'BRL'
      },
      actions: {
        canCancel: !subscription.cancelAtPeriodEnd && !isExpired,
        canReactivate: subscription.cancelAtPeriodEnd && !isExpired,
        canUpgrade: !isExpired,
        canDowngrade: !subscription.cancelAtPeriodEnd && !isExpired
      }
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch subscription details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper para obter preço do plano (em produção virá do Stripe)
function getAmountFromPlan(planCode: string): number {
  const prices: Record<string, number> = {
    'free': 0,
    'pro': 4990, // R$ 49,90 em centavos
    'enterprise': 9990 // R$ 99,90 em centavos
  };
  
  return prices[planCode] || 0;
}