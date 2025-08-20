// Script to create a sample alert rule for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleAlertRule() {
  try {
    console.log('🚀 Creating sample alert rule...');

    // Create a sample alert rule
    const alertRule = await prisma.alertRule.create({
      data: {
        name: 'Alto Uso de Tokens Diário',
        description: 'Alerta quando tokens diários excedem 50,000 para qualquer organização',
        alertType: 'USAGE',
        metric: 'daily_tokens',
        operator: 'gt',
        threshold: 50000,
        timeWindow: 60, // 1 hour window
        notificationChannels: JSON.stringify(['dashboard', 'email']),
        recipients: JSON.stringify(['admin@chatterfy.com']),
        orgId: null, // Global rule
        cooldownMinutes: 60,
        enabled: true,
        createdBy: 'system-setup'
      }
    });

    console.log('✅ Sample alert rule created:', alertRule.name);
    console.log('📋 Rule ID:', alertRule.id);

    // Create another rule for storage
    const storageRule = await prisma.alertRule.create({
      data: {
        name: 'Limite de Storage Atingido',
        description: 'Alerta quando storage ultrapassa 80% do limite do plano',
        alertType: 'USAGE',
        metric: 'storage_usage_mb',
        operator: 'gt',
        threshold: 80, // 80MB for testing
        timeWindow: 30,
        notificationChannels: JSON.stringify(['dashboard']),
        recipients: null,
        orgId: null,
        cooldownMinutes: 120,
        enabled: true,
        createdBy: 'system-setup'
      }
    });

    console.log('✅ Storage alert rule created:', storageRule.name);
    console.log('📋 Rule ID:', storageRule.id);

    // Create a test alert to show in the UI
    const testAlert = await prisma.alert.create({
      data: {
        alertRuleId: alertRule.id,
        title: 'Teste: Alto Uso de Tokens',
        message: 'Este é um alerta de teste para demonstrar o sistema funcionando. Uma organização fictícia excedeu o limite de 50,000 tokens diários.',
        severity: 'MEDIUM',
        orgId: null,
        metricValue: 75000,
        threshold: 50000,
        status: 'ACTIVE'
      }
    });

    console.log('🚨 Test alert created:', testAlert.title);
    console.log('📋 Alert ID:', testAlert.id);

    console.log('\n🎉 Sample data created successfully!');
    console.log('Now you can test the alerts system in the admin dashboard.');

  } catch (error) {
    console.error('❌ Error creating sample alert rule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleAlertRule();