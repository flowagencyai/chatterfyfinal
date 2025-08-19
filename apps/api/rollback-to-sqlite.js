#!/usr/bin/env node
// Script para voltar ao SQLite em caso de problemas

import fs from 'fs';

console.log('🔄 Revertendo para SQLite...');

// Restaurar .env
if (fs.existsSync('.env.sqlite.backup')) {
  fs.copyFileSync('.env.sqlite.backup', '.env');
  console.log('✅ Arquivo .env restaurado');
}

// Restaurar schema
if (fs.existsSync('prisma/schema.sqlite.backup')) {
  fs.copyFileSync('prisma/schema.sqlite.backup', 'prisma/schema.prisma');
  console.log('✅ Schema Prisma restaurado');
}

console.log('✅ Rollback concluído! Execute: npm run prisma:generate');
