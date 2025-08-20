import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminRequest } from '../middleware/adminAuth';

const prisma = new PrismaClient();

// GET /admin/organizations/:orgId/custom-limits - Get custom limits for organization
export async function getCustomLimits(req: AdminRequest, res: Response) {
  try {
    const { orgId } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        customMonthlyTokens: true,
        customDailyTokens: true,
        customStorageMB: true,
        customMaxFileSizeMB: true,
        customLimitsUpdatedAt: true,
        customLimitsUpdatedBy: true,
        customLimitsReason: true,
        subscriptions: {
          where: { active: true },
          include: {
            plan: {
              select: {
                name: true,
                code: true,
                monthlyCreditsTokens: true,
                dailyTokenLimit: true,
                storageLimitMB: true,
                maxFileSizeMB: true
              }
            }
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Get current plan limits as defaults
    const currentPlan = organization.subscriptions[0]?.plan;
    const defaultLimits = currentPlan ? {
      monthlyTokens: currentPlan.monthlyCreditsTokens,
      dailyTokens: currentPlan.dailyTokenLimit,
      storageMB: currentPlan.storageLimitMB,
      maxFileSizeMB: currentPlan.maxFileSizeMB
    } : null;

    // Calculate effective limits (custom or plan defaults)
    const effectiveLimits = {
      monthlyTokens: organization.customMonthlyTokens ?? defaultLimits?.monthlyTokens ?? 0,
      dailyTokens: organization.customDailyTokens ?? defaultLimits?.dailyTokens ?? 0,
      storageMB: organization.customStorageMB ?? defaultLimits?.storageMB ?? 0,
      maxFileSizeMB: organization.customMaxFileSizeMB ?? defaultLimits?.maxFileSizeMB ?? 0
    };

    res.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          currentPlan: currentPlan?.name || 'No Plan'
        },
        defaultLimits,
        customLimits: {
          monthlyTokens: organization.customMonthlyTokens,
          dailyTokens: organization.customDailyTokens,
          storageMB: organization.customStorageMB,
          maxFileSizeMB: organization.customMaxFileSizeMB,
          updatedAt: organization.customLimitsUpdatedAt,
          updatedBy: organization.customLimitsUpdatedBy,
          reason: organization.customLimitsReason
        },
        effectiveLimits,
        hasCustomLimits: !!(
          organization.customMonthlyTokens ||
          organization.customDailyTokens ||
          organization.customStorageMB ||
          organization.customMaxFileSizeMB
        )
      }
    });

  } catch (error) {
    console.error('Error fetching custom limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch custom limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// PUT /admin/organizations/:orgId/custom-limits - Set custom limits for organization
export async function setCustomLimits(req: AdminRequest, res: Response) {
  try {
    const { orgId } = req.params;
    const {
      monthlyTokens,
      dailyTokens,
      storageMB,
      maxFileSizeMB,
      reason
    } = req.body;

    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Validate input (all should be positive numbers or null)
    const validateLimit = (value: any, name: string) => {
      if (value !== null && value !== undefined) {
        const num = parseInt(value);
        if (isNaN(num) || num < 0) {
          throw new Error(`${name} must be a positive number or null`);
        }
        return num;
      }
      return null;
    };

    const validatedLimits = {
      customMonthlyTokens: validateLimit(monthlyTokens, 'Monthly tokens'),
      customDailyTokens: validateLimit(dailyTokens, 'Daily tokens'),
      customStorageMB: validateLimit(storageMB, 'Storage MB'),
      customMaxFileSizeMB: validateLimit(maxFileSizeMB, 'Max file size MB'),
      customLimitsUpdatedAt: new Date(),
      customLimitsUpdatedBy: req.adminUser?.email || 'Unknown Admin',
      customLimitsReason: reason || null
    };

    // Update organization with custom limits
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: validatedLimits,
      select: {
        id: true,
        name: true,
        customMonthlyTokens: true,
        customDailyTokens: true,
        customStorageMB: true,
        customMaxFileSizeMB: true,
        customLimitsUpdatedAt: true,
        customLimitsUpdatedBy: true,
        customLimitsReason: true
      }
    });

    res.json({
      success: true,
      message: 'Custom limits updated successfully',
      data: {
        organization: updatedOrg,
        hasCustomLimits: !!(
          updatedOrg.customMonthlyTokens ||
          updatedOrg.customDailyTokens ||
          updatedOrg.customStorageMB ||
          updatedOrg.customMaxFileSizeMB
        )
      }
    });

  } catch (error) {
    console.error('Error setting custom limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set custom limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// DELETE /admin/organizations/:orgId/custom-limits - Remove custom limits (revert to plan defaults)
export async function removeCustomLimits(req: AdminRequest, res: Response) {
  try {
    const { orgId } = req.params;

    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Clear all custom limits
    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        customMonthlyTokens: null,
        customDailyTokens: null,
        customStorageMB: null,
        customMaxFileSizeMB: null,
        customLimitsUpdatedAt: new Date(),
        customLimitsUpdatedBy: req.adminUser?.email || 'Unknown Admin',
        customLimitsReason: 'Custom limits removed - reverted to plan defaults'
      },
      select: {
        id: true,
        name: true,
        customLimitsUpdatedAt: true,
        customLimitsUpdatedBy: true,
        customLimitsReason: true
      }
    });

    res.json({
      success: true,
      message: 'Custom limits removed successfully - organization reverted to plan defaults',
      data: {
        organization: updatedOrg
      }
    });

  } catch (error) {
    console.error('Error removing custom limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove custom limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// GET /admin/organizations/with-custom-limits - List all organizations with custom limits
export async function listOrganizationsWithCustomLimits(req: AdminRequest, res: Response) {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { customMonthlyTokens: { not: null } },
          { customDailyTokens: { not: null } },
          { customStorageMB: { not: null } },
          { customMaxFileSizeMB: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        customMonthlyTokens: true,
        customDailyTokens: true,
        customStorageMB: true,
        customMaxFileSizeMB: true,
        customLimitsUpdatedAt: true,
        customLimitsUpdatedBy: true,
        customLimitsReason: true,
        subscriptions: {
          where: { active: true },
          include: {
            plan: {
              select: {
                name: true,
                code: true,
                monthlyCreditsTokens: true,
                dailyTokenLimit: true,
                storageLimitMB: true,
                maxFileSizeMB: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        customLimitsUpdatedAt: 'desc'
      }
    });

    const enrichedOrganizations = organizations.map(org => {
      const currentPlan = org.subscriptions[0]?.plan;
      const defaultLimits = currentPlan ? {
        monthlyTokens: currentPlan.monthlyCreditsTokens,
        dailyTokens: currentPlan.dailyTokenLimit,
        storageMB: currentPlan.storageLimitMB,
        maxFileSizeMB: currentPlan.maxFileSizeMB
      } : null;

      return {
        id: org.id,
        name: org.name,
        userCount: org._count.users,
        currentPlan: currentPlan?.name || 'No Plan',
        defaultLimits,
        customLimits: {
          monthlyTokens: org.customMonthlyTokens,
          dailyTokens: org.customDailyTokens,
          storageMB: org.customStorageMB,
          maxFileSizeMB: org.customMaxFileSizeMB,
          updatedAt: org.customLimitsUpdatedAt,
          updatedBy: org.customLimitsUpdatedBy,
          reason: org.customLimitsReason
        },
        customFields: [
          org.customMonthlyTokens && 'Monthly Tokens',
          org.customDailyTokens && 'Daily Tokens',
          org.customStorageMB && 'Storage',
          org.customMaxFileSizeMB && 'Max File Size'
        ].filter(Boolean)
      };
    });

    res.json({
      success: true,
      data: {
        organizations: enrichedOrganizations,
        total: enrichedOrganizations.length
      }
    });

  } catch (error) {
    console.error('Error listing organizations with custom limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list organizations with custom limits',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}