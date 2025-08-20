import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function adminGetOrganizations(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, search, plan } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { id: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (plan) {
      whereClause.subscriptions = {
        some: {
          active: true,
          plan: { code: plan as string }
        }
      };
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where: whereClause,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          },
          subscriptions: {
            include: {
              plan: true
            },
            where: { active: true }
          },
          _count: {
            select: {
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit)
      }),
      prisma.organization.count({ where: whereClause })
    ]);

    // Buscar estatísticas de uso para cada organização
    const orgIds = organizations.map(org => org.id);
    const usageStats = await prisma.usage.groupBy({
      by: ['orgId'],
      where: {
        orgId: { in: orgIds },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
        }
      },
      _sum: {
        total_tokens: true,
        cost_usd: true
      },
      _count: {
        id: true
      }
    });

    const enrichedOrganizations = organizations.map(org => {
      const usage = usageStats.find(u => u.orgId === org.id);
      return {
        ...org,
        usage: {
          totalTokens: usage?._sum.total_tokens || 0,
          totalCost: usage?._sum.cost_usd || 0,
          apiCalls: usage?._count.id || 0
        }
      };
    });

    res.json({
      success: true,
      data: {
        organizations: enrichedOrganizations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function adminUpdateOrganization(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const { name, suspended, notes } = req.body;

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name,
        ...(suspended !== undefined && { 
          // Add suspended field to schema if needed
          // suspended 
        }),
        ...(notes !== undefined && { 
          // Add notes field to schema if needed
          // notes 
        })
      },
      include: {
        users: true,
        subscription: {
          include: { plan: true }
        }
      }
    });

    res.json({
      success: true,
      data: updatedOrg
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

export async function adminDeleteOrganization(req: Request, res: Response) {
  try {
    const { orgId } = req.params;

    // Verificar se é seguro deletar (sem assinaturas ativas, etc.)
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscription: { where: { active: true } },
        users: true
      }
    });

    if (!org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    if (org.subscription.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete organization with active subscriptions'
      });
    }

    // Deletar usuários associados primeiro
    await prisma.user.deleteMany({
      where: { organizationId: orgId }
    });

    // Deletar usage logs
    await prisma.usage.deleteMany({
      where: { orgId }
    });

    // Deletar organização
    await prisma.organization.delete({
      where: { id: orgId }
    });

    res.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}