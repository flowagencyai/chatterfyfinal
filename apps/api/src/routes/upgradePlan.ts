import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { stripe, ensureStripeCustomer } from '../util/stripe';

/**
 * POST /v1/user/upgrade - Faz upgrade do plano do usuário via Stripe
 * Body: { planCode: string, email: string, name?: string }
 */
export async function routeUpgradePlan(req: Request, res: Response) {
  try {
    const orgId = req.headers['x-org-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { planCode, email, name } = req.body;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    if (!planCode || !email) {
      return res.status(400).json({ error: 'Plan code and email are required' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    // Verificar se o plano existe e tem Stripe Price ID
    const targetPlan = await prisma.plan.findUnique({ 
      where: { code: planCode } 
    });

    if (!targetPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Plano FREE não precisa de Stripe - pode ser atribuído diretamente
    const isFreeplan = targetPlan.code.toLowerCase() === 'free';
    
    if (!isFreeplan && !targetPlan.stripePriceId) {
      return res.status(400).json({ error: 'Plan not configured for Stripe billing' });
    }

    // Verificar se a organização existe
    let org = await prisma.organization.findUnique({ 
      where: { id: orgId } 
    });

    if (!org) {
      // Criar organização se não existir
      org = await prisma.organization.create({ 
        data: { id: orgId, name: name || email.split('@')[0] } 
      });
    }

    // Verificar plano atual
    const currentSubscription = await prisma.subscription.findFirst({
      where: { orgId, active: true },
      include: { plan: true }
    });

    if (currentSubscription && currentSubscription.plan.code === planCode) {
      return res.status(400).json({ 
        error: 'Organization is already on this plan',
        currentPlan: currentSubscription.plan.code
      });
    }

    // Se for plano FREE, não precisar do Stripe
    if (isFreeplan) {
      // Desativar assinaturas anteriores
      await prisma.subscription.updateMany({
        where: { orgId, active: true },
        data: { active: false }
      });

      // Cancelar subscription no Stripe se existir
      if (currentSubscription?.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(currentSubscription.stripeSubscriptionId);
        } catch (error) {
          console.error('Error cancelling Stripe subscription:', error);
        }
      }

      // Criar nova assinatura FREE (sem cobrança)
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano
      
      const newSubscription = await prisma.subscription.create({
        data: {
          orgId,
          planId: targetPlan.id,
          active: true,
          periodStart: now,
          periodEnd,
          stripeStatus: 'active'
        },
        include: { plan: true }
      });

      return res.json({
        success: true,
        message: `Successfully downgraded to ${targetPlan.name} plan`,
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
    }

    // Para planos pagos, processar via Stripe
    try {
      // Garantir que o cliente existe no Stripe
      const stripeCustomerId = await ensureStripeCustomer(orgId, email, name);

      // Criar checkout session do Stripe
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: targetPlan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard?success=true&plan=${planCode}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pricing?cancelled=true`,
        metadata: {
          orgId,
          planCode,
          userId: userId || ''
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        customer_update: {
          address: 'auto'
        }
      });

      res.json({
        success: true,
        message: 'Checkout session created',
        checkoutUrl: session.url,
        sessionId: session.id
      });

    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      res.status(500).json({ 
        error: 'Failed to create Stripe checkout session',
        details: stripeError.message 
      });
    }

  } catch (error) {
    console.error('Error upgrading plan:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
}