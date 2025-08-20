import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function adminStripeMetrics(_req: Request, res: Response) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. MRR Atual - buscar todas as assinaturas ativas no Stripe
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.data.price']
    });

    let currentMRR = 0;
    activeSubscriptions.data.forEach(sub => {
      sub.items.data.forEach(item => {
        if (item.price?.recurring?.interval === 'month') {
          currentMRR += (item.price.unit_amount || 0) / 100;
        }
      });
    });

    // 2. Receita do mês atual
    const currentMonthRevenue = await stripe.invoices.list({
      created: {
        gte: Math.floor(startOfMonth.getTime() / 1000)
      },
      status: 'paid',
      limit: 100
    });

    const revenueThisMonth = currentMonthRevenue.data.reduce(
      (sum, invoice) => sum + (invoice.amount_paid || 0) / 100, 0
    );

    // 3. Receita do mês passado
    const lastMonthRevenue = await stripe.invoices.list({
      created: {
        gte: Math.floor(startOfLastMonth.getTime() / 1000),
        lt: Math.floor(endOfLastMonth.getTime() / 1000)
      },
      status: 'paid',
      limit: 100
    });

    const revenueLastMonth = lastMonthRevenue.data.reduce(
      (sum, invoice) => sum + (invoice.amount_paid || 0) / 100, 0
    );

    // 4. Novas assinaturas este mês
    const newSubscriptionsThisMonth = await stripe.subscriptions.list({
      created: {
        gte: Math.floor(startOfMonth.getTime() / 1000)
      },
      limit: 100
    });

    // 5. Cancelamentos este mês - filtrar manualmente
    const allCancelledSubs = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100
    });
    
    const cancelledThisMonth = {
      data: allCancelledSubs.data.filter(sub => 
        sub.canceled_at && sub.canceled_at * 1000 >= startOfMonth.getTime()
      )
    };

    // 6. Clientes Stripe
    const customers = await stripe.customers.list({ limit: 100 });
    const newCustomersThisMonth = customers.data.filter(
      customer => customer.created * 1000 >= startOfMonth.getTime()
    );

    // 7. Falhas de pagamento recentes - buscar todos e filtrar
    const allCharges = await stripe.charges.list({
      created: {
        gte: Math.floor(thirtyDaysAgo.getTime() / 1000)
      },
      limit: 100
    });
    
    const failedPayments = {
      data: allCharges.data.filter(charge => 
        charge.outcome?.type === 'issuer_declined' || 
        charge.status === 'failed'
      )
    };

    // 8. Disputas/Chargebacks
    const disputes = await stripe.disputes.list({
      created: {
        gte: Math.floor(thirtyDaysAgo.getTime() / 1000)
      },
      limit: 50
    });

    // 9. Top Customers por receita
    const topCustomersByRevenue = await stripe.invoices.list({
      created: {
        gte: Math.floor(thirtyDaysAgo.getTime() / 1000)
      },
      status: 'paid',
      limit: 100
    });

    const customerRevenue = new Map();
    topCustomersByRevenue.data.forEach(invoice => {
      const customerId = invoice.customer as string;
      const current = customerRevenue.get(customerId) || 0;
      customerRevenue.set(customerId, current + (invoice.amount_paid || 0) / 100);
    });

    const sortedCustomers = Array.from(customerRevenue.entries())
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);

    // 10. Calcular churn rate
    const totalActiveSubscriptions = activeSubscriptions.data.length;
    const churnRate = totalActiveSubscriptions > 0 
      ? (cancelledThisMonth.data.length / totalActiveSubscriptions) * 100 
      : 0;

    // 11. Growth rate da receita
    const revenueGrowthRate = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

    res.json({
      success: true,
      data: {
        mrr: {
          current: Math.round(currentMRR * 100) / 100,
          projected_arr: Math.round(currentMRR * 12 * 100) / 100
        },
        revenue: {
          thisMonth: Math.round(revenueThisMonth * 100) / 100,
          lastMonth: Math.round(revenueLastMonth * 100) / 100,
          growthRate: Math.round(revenueGrowthRate * 100) / 100
        },
        subscriptions: {
          active: totalActiveSubscriptions,
          newThisMonth: newSubscriptionsThisMonth.data.length,
          cancelledThisMonth: cancelledThisMonth.data.length,
          churnRate: Math.round(churnRate * 100) / 100
        },
        customers: {
          total: customers.data.length,
          newThisMonth: newCustomersThisMonth.length
        },
        health: {
          failedPayments: failedPayments.data.length,
          disputes: disputes.data.length,
          failureRate: failedPayments.data.length > 0 
            ? Math.round((failedPayments.data.length / (failedPayments.data.length + currentMonthRevenue.data.length)) * 100 * 100) / 100
            : 0
        },
        topCustomers: await Promise.all(
          sortedCustomers.map(async ([customerId, revenue]) => {
            try {
              const customer = await stripe.customers.retrieve(customerId);
              return {
                customerId,
                revenue: Math.round((revenue as number) * 100) / 100,
                email: (customer as any).email || 'N/A',
                name: (customer as any).name || 'N/A'
              };
            } catch {
              return {
                customerId,
                revenue: Math.round((revenue as number) * 100) / 100,
                email: 'Unknown',
                name: 'Unknown'
              };
            }
          })
        ),
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching Stripe metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Stripe metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function adminSubscriptionActions(req: Request, res: Response) {
  try {
    const { action, subscriptionId, customerId } = req.body;

    switch (action) {
      case 'pause_subscription':
        const pausedSub = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'mark_uncollectible'
          }
        });
        res.json({ success: true, data: pausedSub });
        break;

      case 'resume_subscription':
        const resumedSub = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null as any
        });
        res.json({ success: true, data: resumedSub });
        break;

      case 'cancel_subscription':
        const cancelledSub = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
        res.json({ success: true, data: cancelledSub });
        break;

      case 'refund_latest_payment':
        // Buscar último pagamento bem-sucedido
        const charges = await stripe.charges.list({
          customer: customerId,
          limit: 1
        });

        if (charges.data.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No charges found for customer'
          });
        }

        const refund = await stripe.refunds.create({
          charge: charges.data[0].id,
          reason: 'requested_by_customer'
        });

        res.json({ success: true, data: refund });
        break;

      default:
        res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

  } catch (error) {
    console.error('Error performing subscription action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform action',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}