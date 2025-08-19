// Script para criar os planos básicos no banco de dados
import { PrismaClient } from '@prisma/client';

async function seedPlans() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Criando planos básicos...');

    // Verificar se já existem planos
    const existingPlans = await prisma.plan.findMany();
    if (existingPlans.length > 0) {
      console.log('ℹ️  Planos já existem no banco de dados');
      existingPlans.forEach(plan => {
        console.log(`  - ${plan.name} (${plan.code})`);
      });
      return;
    }

    // Criar plano FREE
    const freePlan = await prisma.plan.create({
      data: {
        code: 'FREE',
        name: 'Chatterfy Free',
        monthlyCreditsTokens: 2000000, // 2M tokens
        dailyTokenLimit: 100000, // 100K tokens/dia
        storageLimitMB: 200, // 200MB
        maxFileSizeMB: 5, // 5MB por arquivo
        features: JSON.stringify({
          anonymousMessages: 5,
          models: ['basic'],
          support: 'email',
          api: false
        })
      }
    });

    // Criar plano PRO
    const proPlan = await prisma.plan.create({
      data: {
        code: 'PRO',
        name: 'Chatterfy Pro',
        monthlyCreditsTokens: 10000000, // 10M tokens
        dailyTokenLimit: 500000, // 500K tokens/dia
        storageLimitMB: 2048, // 2GB
        maxFileSizeMB: 50, // 50MB por arquivo
        features: JSON.stringify({
          models: ['all', 'premium'],
          fileUpload: true,
          history: 'unlimited',
          api: true,
          support: 'priority',
          backup: 'auto'
        })
      }
    });

    console.log('✅ Planos criados com sucesso!');
    console.log(`  - FREE: ${freePlan.id}`);
    console.log(`  - PRO: ${proPlan.id}`);

  } catch (error) {
    console.error('❌ Erro ao criar planos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlans();