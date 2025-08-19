import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const baseAdapter = PrismaAdapter(prisma);
  
  return {
    ...baseAdapter,
    async createUser(data) {
      // Create organization first
      const org = await prisma.organization.create({
        data: {
          name: `${data.name || data.email?.split('@')[0] || 'User'}'s Organization`,
        }
      });
      
      // Create user with organization
      const user = await prisma.user.create({
        data: {
          ...data,
          orgId: org.id,
        }
      });
      
      return user;
    },
  };
}