// Script para atualizar os planos com IDs do Stripe
// Execute depois de criar os produtos no Stripe

import { PrismaClient } from '@prisma/client';

async function updateStripePlans() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Atualizando planos com IDs do Stripe...');

    // IDs dos produtos criados no Stripe
    const STRIPE_FREE_PRICE_ID = process.env.STRIPE_FREE_PRICE_ID || 'price_1RxtyxBIe5afQs219axTXInV';
    const STRIPE_FREE_PRODUCT_ID = process.env.STRIPE_FREE_PRODUCT_ID || 'prod_SthNTZXOmvBSbf';
    const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'price_1RxtyxBIe5afQs21EeEke3mT';
    const STRIPE_PRO_PRODUCT_ID = process.env.STRIPE_PRO_PRODUCT_ID || 'prod_SthNcjxc65tUzV';

    // Atualizar plano FREE
    await prisma.plan.updateMany({
      where: { code: 'FREE' },
      data: {
        stripePriceId: STRIPE_FREE_PRICE_ID,
        stripeProductId: STRIPE_FREE_PRODUCT_ID
      }
    });

    // Atualizar plano PRO  
    await prisma.plan.updateMany({
      where: { code: 'PRO' },
      data: {
        stripePriceId: STRIPE_PRO_PRICE_ID,
        stripeProductId: STRIPE_PRO_PRODUCT_ID
      }
    });

    console.log('✅ Planos atualizados com sucesso!');

    // Verificar atualizações
    const updatedPlans = await prisma.plan.findMany({
      select: {
        code: true,
        name: true,
        stripePriceId: true,
        stripeProductId: true
      }
    });

    console.log('\n📋 Planos atualizados:');
    updatedPlans.forEach(plan => {
      console.log(`  ${plan.code}: Product=${plan.stripeProductId}, Price=${plan.stripePriceId}`);
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar planos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStripePlans();