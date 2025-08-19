import { getServerSession } from "next-auth";
import { authConfig } from "../../auth/auth.config";
import prisma from "../../../../server/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Buscar informações completas do usuário e org
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        org: {
          include: {
            subscriptions: {
              where: { active: true },
              include: { plan: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const activeSub = user.org.subscriptions[0];

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        orgName: user.org.name,
        plan: activeSub ? {
          code: activeSub.plan.code,
          name: activeSub.plan.name,
          dailyTokenLimit: activeSub.plan.dailyTokenLimit,
          storageLimitMB: activeSub.plan.storageLimitMB,
          maxFileSizeMB: activeSub.plan.maxFileSizeMB
        } : null
      }
    });
  } catch (error) {
    console.error("Session error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}