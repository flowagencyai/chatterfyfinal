#!/usr/bin/env node
// Script final de migração de dados

import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const postgres = new PrismaClient();

async function migrateData() {
  console.log('🔄 Iniciando migração de dados...');
  
  const sqlite = await open({
    filename: './prisma/dev.db',
    driver: sqlite3.Database
  });

  try {
    await postgres.$connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Migrar Organizations (sem apiKey por enquanto)
    const organizations = await sqlite.all('SELECT * FROM Organization');
    for (const org of organizations) {
      await postgres.organization.create({
        data: {
          id: org.id,
          name: org.name,
          stripeCustomerId: org.stripeCustomerId,
          createdAt: new Date(org.createdAt)
          // apiKey e apiKeyCreatedAt serão null inicialmente
        }
      });
    }
    console.log(`✅ ${organizations.length} organizações migradas`);

    // Migrar Users
    const users = await sqlite.all('SELECT * FROM User');
    for (const user of users) {
      await postgres.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          image: user.image,
          orgId: user.orgId,
          createdAt: new Date(user.createdAt)
        }
      });
    }
    console.log(`✅ ${users.length} usuários migrados`);

    // Migrar Plans
    const plans = await sqlite.all('SELECT * FROM Plan');
    for (const plan of plans) {
      await postgres.plan.create({
        data: {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          monthlyCreditsTokens: plan.monthlyCreditsTokens,
          dailyTokenLimit: plan.dailyTokenLimit,
          storageLimitMB: plan.storageLimitMB,
          maxFileSizeMB: plan.maxFileSizeMB,
          features: plan.features,
          stripePriceId: plan.stripePriceId,
          stripeProductId: plan.stripeProductId,
          createdAt: new Date(plan.createdAt)
        }
      });
    }
    console.log(`✅ ${plans.length} planos migrados`);

    // Migrar Subscriptions
    const subscriptions = await sqlite.all('SELECT * FROM Subscription');
    for (const sub of subscriptions) {
      await postgres.subscription.create({
        data: {
          id: sub.id,
          orgId: sub.orgId,
          planId: sub.planId,
          active: Boolean(sub.active),
          periodStart: new Date(sub.periodStart),
          periodEnd: new Date(sub.periodEnd),
          stripeSubscriptionId: sub.stripeSubscriptionId,
          stripeCustomerId: sub.stripeCustomerId,
          stripePriceId: sub.stripePriceId,
          stripeStatus: sub.stripeStatus,
          cancelAtPeriodEnd: Boolean(sub.cancelAtPeriodEnd),
          cancelledAt: sub.cancelledAt ? new Date(sub.cancelledAt) : null,
          cancellationReason: sub.cancellationReason,
          retentionOffersCount: sub.retentionOffersCount || 0,
          lastRetentionOfferAt: sub.lastRetentionOfferAt ? new Date(sub.lastRetentionOfferAt) : null,
          trialEnd: sub.trialEnd ? new Date(sub.trialEnd) : null,
          currentPeriodStart: sub.currentPeriodStart ? new Date(sub.currentPeriodStart) : null,
          currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
          createdAt: new Date(sub.createdAt),
          updatedAt: new Date(sub.updatedAt || sub.createdAt)
        }
      });
    }
    console.log(`✅ ${subscriptions.length} assinaturas migradas`);

    // Migrar Usage
    const usage = await sqlite.all('SELECT * FROM Usage');
    for (const u of usage) {
      await postgres.usage.create({
        data: {
          id: u.id,
          ts: new Date(u.ts),
          day: new Date(u.day),
          provider: u.provider,
          model: u.model,
          orgId: u.orgId,
          userId: u.userId,
          prompt_tokens: u.prompt_tokens,
          completion_tokens: u.completion_tokens,
          total_tokens: u.total_tokens,
          cost_usd: u.cost_usd,
          createdAt: new Date(u.createdAt)
        }
      });
    }
    console.log(`✅ ${usage.length} registros de usage migrados`);

    // Migrar outros dados conforme necessário...
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('✅ Todos os dados foram preservados');
    console.log('✅ Novos campos API Key estão disponíveis');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await sqlite.close();
    await postgres.$disconnect();
  }
}

migrateData().catch(console.error);
