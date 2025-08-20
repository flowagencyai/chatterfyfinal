import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário flowagencyai@gmail.com...');
    
    const user = await prisma.user.findUnique({
      where: { email: 'flowagencyai@gmail.com' },
      include: {
        org: {
          select: { name: true }
        }
      }
    });
    
    if (user) {
      console.log('✅ Usuário encontrado:');
      console.log('  Email:', user.email);
      console.log('  Nome:', user.name || 'N/A');
      console.log('  Role:', user.role);
      console.log('  ID:', user.id);
      console.log('  Organização:', user.org?.name || 'N/A');
      console.log('  Verificado:', user.emailVerified ? 'Sim' : 'Não');
      
      if (user.role !== 'ADMIN') {
        console.log('\n🔧 Atualizando para ADMIN...');
        await prisma.user.update({
          where: { email: 'flowagencyai@gmail.com' },
          data: { role: 'ADMIN' }
        });
        console.log('✅ Role atualizada para ADMIN!');
      } else {
        console.log('\n✅ Usuário já é ADMIN!');
      }
    } else {
      console.log('❌ Usuário flowagencyai@gmail.com não encontrado no banco');
      
      // Listar todos os usuários para verificar
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, name: true, id: true }
      });
      
      console.log('\n📋 Usuários no banco:');
      if (allUsers.length === 0) {
        console.log('  (Nenhum usuário encontrado)');
      } else {
        allUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.role}) - ${u.name || 'Sem nome'} [ID: ${u.id}]`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();