// Script to create an admin user for testing
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user and organization...');

    // First, create an organization for the admin
    const adminOrg = await prisma.organization.create({
      data: {
        name: 'Chatterfy Admin',
        stripeCustomerId: null
      }
    });

    console.log('✅ Admin organization created:', adminOrg.name);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@chatterfy.com',
        name: 'Admin User',
        role: 'ADMIN',
        orgId: adminOrg.id,
        emailVerified: new Date()
      }
    });

    console.log('✅ Admin user created:', adminUser.email);
    console.log('📋 User ID:', adminUser.id);
    console.log('🏢 Organization ID:', adminOrg.id);

    // Also create a test user for comparison
    const testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        name: 'Test User',
        role: 'USER',
        orgId: adminOrg.id,
        emailVerified: new Date()
      }
    });

    console.log('✅ Test user created:', testUser.email);

    console.log('\n🎉 Admin setup completed!');
    console.log('\nTo access admin dashboard:');
    console.log('1. Login with: admin@chatterfy.com');
    console.log('2. Or use these headers for API testing:');
    console.log('   x-user-email: admin@chatterfy.com');
    console.log('   x-user-id:', adminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();