#!/usr/bin/env node
// Script para exportar todos os dados do SQLite em formato JSON

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:../prisma/dev.db'
      }
    }
  });

  try {
    console.log('🔄 Exportando dados do SQLite...');

    // Exportar todas as tabelas
    const data = {
      exportedAt: new Date().toISOString(),
      databaseBackup: {
        organizations: await prisma.organization.findMany({
          include: {
            users: true,
            subscriptions: {
              include: {
                plan: true
              }
            },
            threads: {
              include: {
                messages: true
              }
            },
            files: true
          }
        }),
        users: await prisma.user.findMany({
          include: {
            accounts: true,
            sessions: true,
            messages: true
          }
        }),
        plans: await prisma.plan.findMany({
          include: {
            subscriptions: true
          }
        }),
        subscriptions: await prisma.subscription.findMany({
          include: {
            org: true,
            plan: true
          }
        }),
        threads: await prisma.thread.findMany({
          include: {
            messages: true,
            org: true
          }
        }),
        messages: await prisma.message.findMany({
          include: {
            thread: true,
            user: true
          }
        }),
        usage: await prisma.usage.findMany(),
        fileAssets: await prisma.fileAsset.findMany({
          include: {
            org: true
          }
        }),
        accounts: await prisma.account.findMany({
          include: {
            user: true
          }
        }),
        sessions: await prisma.session.findMany({
          include: {
            user: true
          }
        }),
        verificationTokens: await prisma.verificationToken.findMany(),
        stripeWebhooks: await prisma.stripeWebhook.findMany()
      }
    };

    // Salvar backup JSON
    const backupFile = `data-export-${new Date().toISOString().split('T')[0]}.json`;
    const backupPath = path.join(__dirname, backupFile);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    // Estatísticas
    console.log('\n📊 Dados exportados:');
    console.log(`Organizations: ${data.databaseBackup.organizations.length}`);
    console.log(`Users: ${data.databaseBackup.users.length}`);
    console.log(`Plans: ${data.databaseBackup.plans.length}`);
    console.log(`Subscriptions: ${data.databaseBackup.subscriptions.length}`);
    console.log(`Threads: ${data.databaseBackup.threads.length}`);
    console.log(`Messages: ${data.databaseBackup.messages.length}`);
    console.log(`Usage Records: ${data.databaseBackup.usage.length}`);
    console.log(`File Assets: ${data.databaseBackup.fileAssets.length}`);
    console.log(`Accounts: ${data.databaseBackup.accounts.length}`);
    console.log(`Sessions: ${data.databaseBackup.sessions.length}`);
    console.log(`Verification Tokens: ${data.databaseBackup.verificationTokens.length}`);
    console.log(`Stripe Webhooks: ${data.databaseBackup.stripeWebhooks.length}`);

    console.log(`\n✅ Dados exportados para: ${backupPath}`);
    
    return data;

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  exportData()
    .then(() => {
      console.log('\n🎉 Export completo!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha no export:', error);
      process.exit(1);
    });
}

export { exportData };