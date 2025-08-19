#!/usr/bin/env node
// Script para importar dados do SQLite para PostgreSQL

import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const postgresClient = new PrismaClient();

async function importData() {
  console.log('🔄 Importando dados do SQLite...');
  
  // Conectar ao SQLite
  const sqliteDb = await open({
    filename: './prisma/dev.db',
    driver: sqlite3.Database
  });

  try {
    await postgresClient.$connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Importar Organizations
    const organizations = await sqliteDb.all('SELECT * FROM Organization');
    console.log(`📋 Importando ${organizations.length} organizações...`);
    
    for (const org of organizations) {
      await postgresClient.organization.create({
        data: {
          id: org.id,
          name: org.name,
          stripeCustomerId: org.stripeCustomerId,
          createdAt: new Date(org.createdAt)
        }
      });
    }

    // Importar Users
    const users = await sqliteDb.all('SELECT * FROM User');
    console.log(`👥 Importando ${users.length} usuários...`);
    
    for (const user of users) {
      await postgresClient.user.create({
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

    // Importar Plans
    const plans = await sqliteDb.all('SELECT * FROM Plan');
    console.log(`💰 Importando ${plans.length} planos...`);
    
    for (const plan of plans) {
      await postgresClient.plan.create({
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

    // Importar outros dados...
    console.log('✅ Importação concluída!');

  } catch (error) {
    console.error('❌ Erro na importação:', error);
    throw error;
  } finally {
    await sqliteDb.close();
    await postgresClient.$disconnect();
  }
}

importData().catch(console.error);
