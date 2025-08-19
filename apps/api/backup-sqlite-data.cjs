const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createFullBackup() {
  try {
    console.log('🔄 Iniciando backup completo do SQLite...\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-sqlite-${timestamp}.json`;
    
    // Extrair todos os dados das tabelas principais
    console.log('📦 Extraindo dados das tabelas...');
    
    const backup = {
      timestamp: new Date().toISOString(),
      metadata: {
        version: '1.0',
        source: 'SQLite',
        target: 'PostgreSQL'
      },
      data: {}
    };

    // Users
    console.log('  - Usuários...');
    backup.data.users = await prisma.user.findMany();
    console.log(`    ✅ ${backup.data.users.length} usuários`);

    // Organizations
    console.log('  - Organizações...');
    backup.data.organizations = await prisma.organization.findMany();
    console.log(`    ✅ ${backup.data.organizations.length} organizações`);

    // Plans
    console.log('  - Planos...');
    backup.data.plans = await prisma.plan.findMany();
    console.log(`    ✅ ${backup.data.plans.length} planos`);

    // Usage
    console.log('  - Registros de Uso...');
    backup.data.usage = await prisma.usage.findMany();
    console.log(`    ✅ ${backup.data.usage.length} registros de uso`);

    // Threads
    console.log('  - Threads...');
    backup.data.threads = await prisma.thread.findMany();
    console.log(`    ✅ ${backup.data.threads.length} threads`);

    // Messages
    console.log('  - Mensagens...');
    backup.data.messages = await prisma.message.findMany();
    console.log(`    ✅ ${backup.data.messages.length} mensagens`);

    // Accounts (NextAuth)
    console.log('  - Contas (NextAuth)...');
    backup.data.accounts = await prisma.account.findMany();
    console.log(`    ✅ ${backup.data.accounts.length} contas`);

    // Sessions (NextAuth)
    console.log('  - Sessões (NextAuth)...');
    backup.data.sessions = await prisma.session.findMany();
    console.log(`    ✅ ${backup.data.sessions.length} sessões`);

    // Subscriptions
    console.log('  - Assinaturas...');
    backup.data.subscriptions = await prisma.subscription.findMany();
    console.log(`    ✅ ${backup.data.subscriptions.length} assinaturas`);

    // FileAssets
    console.log('  - Arquivos...');
    backup.data.fileAssets = await prisma.fileAsset.findMany();
    console.log(`    ✅ ${backup.data.fileAssets.length} arquivos`);

    // StripeWebhook
    console.log('  - Webhooks Stripe...');
    backup.data.stripeWebhooks = await prisma.stripeWebhook.findMany();
    console.log(`    ✅ ${backup.data.stripeWebhooks.length} webhooks`);

    // VerificationToken
    console.log('  - Tokens de Verificação...');
    backup.data.verificationTokens = await prisma.verificationToken.findMany();
    console.log(`    ✅ ${backup.data.verificationTokens.length} tokens`);

    // Salvar backup
    console.log(`\n💾 Salvando backup em ${backupFile}...`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    // Criar também uma cópia de segurança do arquivo .db
    const dbBackupFile = `sqlite-db-backup-${timestamp}.db`;
    fs.copyFileSync('./dev.db', dbBackupFile);
    console.log(`💾 Backup do arquivo .db salvo em ${dbBackupFile}`);

    // Estatísticas finais
    const totalRecords = Object.values(backup.data).reduce((sum, table) => sum + table.length, 0);
    
    console.log('\n📊 RESUMO DO BACKUP:');
    console.log('═══════════════════');
    console.log(`📁 Arquivo JSON: ${backupFile}`);
    console.log(`📁 Arquivo SQLite: ${dbBackupFile}`);
    console.log(`📊 Total de registros: ${totalRecords}`);
    console.log(`⏰ Timestamp: ${backup.timestamp}`);
    
    console.log('\n✅ Backup completo realizado com sucesso!');
    console.log('🔒 Todos os dados foram preservados e podem ser restaurados.');
    
    return {
      jsonBackup: backupFile,
      dbBackup: dbBackupFile,
      totalRecords
    };

  } catch (error) {
    console.error('❌ Erro durante o backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar backup se chamado diretamente
if (require.main === module) {
  createFullBackup().catch(console.error);
}

module.exports = { createFullBackup };