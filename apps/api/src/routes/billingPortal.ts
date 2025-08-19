import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { stripe } from '../util/stripe';

/**
 * POST /v1/user/billing-portal - Cria sessão do portal de cobrança Stripe
 */
export async function routeBillingPortal(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const { returnUrl } = req.body;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe integration not available' });
    }

    // Buscar organização e assinatura
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: {
          where: { active: true },
          include: { plan: true }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Verificar se tem customer ID do Stripe e assinatura ativa
    const activeSubscription = organization.subscriptions.find(sub => sub.active);
    
    if (!organization.stripeCustomerId || !activeSubscription) {
      console.log('Organization without Stripe customer or subscription:', orgId);
      
      // Para usuários FREE: redirecionar para página de upgrade
      return res.status(400).json({ 
        error: 'No active subscription found',
        details: 'Para acessar o portal de cobrança, você precisa ter uma assinatura ativa. Faça upgrade para PRO primeiro.',
        action: 'upgrade_required',
        currentPlan: activeSubscription?.plan?.code || 'FREE',
        availablePlans: ['PRO']
      });
    }

    // Criar sessão do portal de cobrança
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard`,
    });

    res.json({
      success: true,
      url: portalSession.url,
      sessionId: portalSession.id
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ 
      error: 'Failed to create billing portal session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}