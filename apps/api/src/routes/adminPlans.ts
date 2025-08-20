import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { AdminRequest } from '../middleware/adminAuth';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// GET /admin/plans - Listar todos os planos
export async function adminGetPlans(req: AdminRequest, res: Response) {
  try {
    const { active, search } = req.query;

    let whereClause: any = {};
    
    if (active !== undefined) {
      // Considerar um plano ativo se tem stripePriceId
      if (active === 'true') {
        whereClause.stripePriceId = { not: null };
      } else {
        whereClause.stripePriceId = null;
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const plans = await prisma.plan.findMany({
      where: whereClause,
      include: {
        subscriptions: {
          select: {
            id: true,
            active: true,
            orgId: true,
            org: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            subscriptions: {
              where: { active: true }
            }
          }
        }
      },
      orderBy: [
        { code: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Enriquecer com informações do Stripe se disponível
    const enrichedPlans = await Promise.all(plans.map(async (plan) => {
      let stripeData = null;
      
      if (plan.stripePriceId) {
        try {
          const stripePrice = await stripe.prices.retrieve(plan.stripePriceId, {
            expand: ['product']
          });
          stripeData = {
            priceId: stripePrice.id,
            productId: stripePrice.product,
            unitAmount: stripePrice.unit_amount,
            currency: stripePrice.currency,
            interval: stripePrice.recurring?.interval,
            active: stripePrice.active
          };
        } catch (err) {
          console.warn(`Failed to fetch Stripe data for plan ${plan.id}:`, err);
        }
      }

      return {
        ...plan,
        stripeData,
        activeSubscriptions: plan._count.subscriptions,
        features: JSON.parse(plan.features)
      };
    }));

    res.json({
      success: true,
      data: {
        plans: enrichedPlans,
        total: enrichedPlans.length
      }
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// POST /admin/plans - Criar novo plano
export async function adminCreatePlan(req: AdminRequest, res: Response) {
  try {
    const {
      code,
      name,
      monthlyCreditsTokens,
      dailyTokenLimit,
      storageLimitMB,
      maxFileSizeMB,
      features,
      price, // Em centavos (ex: 4990 = R$ 49,90)
      currency = 'brl',
      interval = 'month',
      createInStripe = true
    } = req.body;

    // Validações
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Code and name are required'
      });
    }

    // Verificar se o código já existe
    const existingPlan = await prisma.plan.findUnique({
      where: { code }
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        error: 'Plan already exists',
        message: `Plan with code '${code}' already exists`
      });
    }

    let stripePriceId = null;
    let stripeProductId = null;

    // Criar no Stripe se solicitado e tem preço
    if (createInStripe && price > 0) {
      try {
        // 1. Criar produto no Stripe
        const stripeProduct = await stripe.products.create({
          name: `Chatterfy ${name}`,
          description: `Plano ${name} - ${monthlyCreditsTokens.toLocaleString()} tokens/mês`,
          metadata: {
            planCode: code,
            tokensPerMonth: monthlyCreditsTokens.toString(),
            storageLimit: storageLimitMB.toString(),
            maxFileSize: maxFileSizeMB.toString(),
            source: 'admin_panel'
          }
        });

        stripeProductId = stripeProduct.id;

        // 2. Criar preço no Stripe
        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: price,
          currency: currency.toLowerCase(),
          recurring: {
            interval: interval as any
          },
          metadata: {
            planCode: code
          }
        });

        stripePriceId = stripePrice.id;

      } catch (stripeError) {
        console.error('Error creating plan in Stripe:', stripeError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create plan in Stripe',
          message: stripeError instanceof Error ? stripeError.message : 'Stripe error'
        });
      }
    }

    // Criar plano no banco de dados
    const newPlan = await prisma.plan.create({
      data: {
        code,
        name,
        monthlyCreditsTokens,
        dailyTokenLimit,
        storageLimitMB,
        maxFileSizeMB,
        features: JSON.stringify(features || {}),
        stripePriceId,
        stripeProductId
      }
    });

    res.status(201).json({
      success: true,
      data: {
        ...newPlan,
        features: JSON.parse(newPlan.features),
        stripeData: stripePriceId ? {
          priceId: stripePriceId,
          productId: stripeProductId,
          unitAmount: price,
          currency,
          interval
        } : null
      }
    });

  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// PUT /admin/plans/:planId - Atualizar plano
export async function adminUpdatePlan(req: AdminRequest, res: Response) {
  try {
    const { planId } = req.params;
    const {
      name,
      monthlyCreditsTokens,
      dailyTokenLimit,
      storageLimitMB,
      maxFileSizeMB,
      features,
      syncWithStripe = false
    } = req.body;

    // Buscar plano existente
    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Atualizar no Stripe se solicitado
    if (syncWithStripe && existingPlan.stripeProductId) {
      try {
        await stripe.products.update(existingPlan.stripeProductId, {
          name: name ? `Chatterfy ${name}` : undefined,
          description: `Plano ${name || existingPlan.name} - ${monthlyCreditsTokens || existingPlan.monthlyCreditsTokens} tokens/mês`,
          metadata: {
            planCode: existingPlan.code,
            tokensPerMonth: (monthlyCreditsTokens || existingPlan.monthlyCreditsTokens).toString(),
            storageLimit: (storageLimitMB || existingPlan.storageLimitMB).toString(),
            maxFileSize: (maxFileSizeMB || existingPlan.maxFileSizeMB).toString(),
            lastUpdated: new Date().toISOString()
          }
        });
      } catch (stripeError) {
        console.warn('Failed to update Stripe product:', stripeError);
      }
    }

    // Atualizar plano no banco
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        ...(name && { name }),
        ...(monthlyCreditsTokens && { monthlyCreditsTokens }),
        ...(dailyTokenLimit && { dailyTokenLimit }),
        ...(storageLimitMB && { storageLimitMB }),
        ...(maxFileSizeMB && { maxFileSizeMB }),
        ...(features && { features: JSON.stringify(features) })
      }
    });

    res.json({
      success: true,
      data: {
        ...updatedPlan,
        features: JSON.parse(updatedPlan.features)
      }
    });

  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// DELETE /admin/plans/:planId - Deletar/desativar plano
export async function adminDeletePlan(req: AdminRequest, res: Response) {
  try {
    const { planId } = req.params;
    const { forceDelete = false } = req.query;

    // Buscar plano existente
    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { active: true }
            }
          }
        }
      }
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    // Verificar se há assinaturas ativas
    if (existingPlan._count.subscriptions > 0 && !forceDelete) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete plan with active subscriptions',
        message: `Plan has ${existingPlan._count.subscriptions} active subscription(s). Use forceDelete=true to override.`
      });
    }

    // Desativar no Stripe se existe
    if (existingPlan.stripePriceId) {
      try {
        await stripe.prices.update(existingPlan.stripePriceId, {
          active: false
        });
      } catch (stripeError) {
        console.warn('Failed to deactivate Stripe price:', stripeError);
      }
    }

    if (forceDelete === 'true') {
      // Deletar completamente (cuidado!)
      await prisma.plan.delete({
        where: { id: planId }
      });
    } else {
      // Apenas remover IDs do Stripe (soft delete)
      await prisma.plan.update({
        where: { id: planId },
        data: {
          stripePriceId: null,
          stripeProductId: null
        }
      });
    }

    res.json({
      success: true,
      message: forceDelete === 'true' ? 'Plan deleted permanently' : 'Plan deactivated'
    });

  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET /admin/plans/sync-stripe - Sincronizar com Stripe
export async function adminSyncPlansWithStripe(req: AdminRequest, res: Response) {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        stripePriceId: { not: null }
      }
    });

    const syncResults = [];

    for (const plan of plans) {
      try {
        const stripePrice = await stripe.prices.retrieve(plan.stripePriceId!, {
          expand: ['product']
        });

        const stripeProduct = stripePrice.product as Stripe.Product;

        syncResults.push({
          planId: plan.id,
          code: plan.code,
          name: plan.name,
          stripe: {
            priceId: stripePrice.id,
            productId: stripeProduct.id,
            active: stripePrice.active,
            unitAmount: stripePrice.unit_amount,
            currency: stripePrice.currency,
            productName: stripeProduct.name,
            productActive: stripeProduct.active
          },
          status: 'synced'
        });

      } catch (err) {
        syncResults.push({
          planId: plan.id,
          code: plan.code,
          name: plan.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      data: {
        syncedPlans: syncResults.filter(r => r.status === 'synced').length,
        errors: syncResults.filter(r => r.status === 'error').length,
        results: syncResults
      }
    });

  } catch (error) {
    console.error('Error syncing plans with Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync plans with Stripe',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}