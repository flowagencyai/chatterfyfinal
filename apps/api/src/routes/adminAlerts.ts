// apps/api/src/routes/adminAlerts.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all alerts with filtering
export const adminGetAlerts = async (req: Request, res: Response) => {
  try {
    const { 
      status = 'ACTIVE', 
      orgId, 
      severity,
      limit = '50',
      offset = '0'
    } = req.query;

    const where: any = {};
    
    if (status !== 'ALL') {
      where.status = status;
    }
    if (orgId) {
      where.orgId = orgId;
    }
    if (severity) {
      where.severity = severity;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        alertRule: {
          select: {
            id: true,
            name: true,
            alertType: true,
            metric: true,
            operator: true
          }
        },
        org: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Get count for pagination
    const totalCount = await prisma.alert.count({ where });

    res.json({
      success: true,
      data: alerts,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('[ADMIN_ALERTS] Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
};

// Get alert details
export const adminGetAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id: alertId },
      include: {
        alertRule: {
          select: {
            id: true,
            name: true,
            description: true,
            alertType: true,
            metric: true,
            operator: true,
            threshold: true,
            timeWindow: true
          }
        },
        org: {
          select: { id: true, name: true }
        }
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('[ADMIN_ALERTS] Error fetching alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert'
    });
  }
};

// Acknowledge alert
export const adminAcknowledgeAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const userEmail = req.headers['x-user-email'] as string;
    const userId = req.headers['x-user-id'] as string;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedBy: userId || userEmail || 'unknown'
      },
      include: {
        alertRule: {
          select: { name: true }
        },
        org: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: alert
    });
  } catch (error) {
    console.error('[ADMIN_ALERTS] Error acknowledging alert:', error);
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert'
      });
    }
  }
};

// Resolve alert
export const adminResolveAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;
    const userEmail = req.headers['x-user-email'] as string;
    const userId = req.headers['x-user-id'] as string;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: userId || userEmail || 'unknown',
        resolution: resolution || 'Manually resolved by admin'
      },
      include: {
        alertRule: {
          select: { name: true }
        },
        org: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: alert
    });
  } catch (error) {
    console.error('[ADMIN_ALERTS] Error resolving alert:', error);
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to resolve alert'
      });
    }
  }
};

// Bulk actions on alerts
export const adminBulkAlertAction = async (req: Request, res: Response) => {
  try {
    const { alertIds, action, resolution } = req.body;
    const userEmail = req.headers['x-user-email'] as string;
    const userId = req.headers['x-user-id'] as string;

    if (!alertIds || !Array.isArray(alertIds) || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: alertIds (array), action'
      });
    }

    let updateData: any = {};
    
    switch (action) {
      case 'acknowledge':
        updateData = {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId || userEmail || 'unknown'
        };
        break;
      case 'resolve':
        updateData = {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: userId || userEmail || 'unknown',
          resolution: resolution || 'Bulk resolved by admin'
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: acknowledge, resolve'
        });
    }

    const result = await prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
        status: 'ACTIVE' // Only update active alerts
      },
      data: updateData
    });

    res.json({
      success: true,
      message: `${result.count} alerts ${action}d successfully`,
      data: { updatedCount: result.count }
    });
  } catch (error) {
    console.error('[ADMIN_ALERTS] Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action on alerts'
    });
  }
};

// Get alert statistics
export const adminGetAlertStats = async (req: Request, res: Response) => {
  try {
    const { orgId, days = '7' } = req.query;
    const daysAgo = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const where: any = {
      createdAt: { gte: startDate }
    };
    
    if (orgId) {
      where.orgId = orgId;
    }

    const [
      totalAlerts,
      activeAlerts,
      acknowledgedAlerts,
      resolvedAlerts,
      alertsBySeverity,
      alertsByType
    ] = await Promise.all([
      // Total alerts in period
      prisma.alert.count({ where }),
      
      // Active alerts
      prisma.alert.count({ where: { ...where, status: 'ACTIVE' } }),
      
      // Acknowledged alerts
      prisma.alert.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
      
      // Resolved alerts
      prisma.alert.count({ where: { ...where, status: 'RESOLVED' } }),
      
      // Alerts by severity
      prisma.alert.groupBy({
        by: ['severity'],
        where,
        _count: true
      }),
      
      // Alerts by type (via alert rule) - simplified for now
      Promise.resolve([])
    ]);

    // Get daily trend - simplified for now
    const dailyAlerts = [];

    res.json({
      success: true,
      data: {
        summary: {
          total: totalAlerts,
          active: activeAlerts,
          acknowledged: acknowledgedAlerts,
          resolved: resolvedAlerts
        },
        bySeverity: alertsBySeverity,
        dailyTrend: dailyAlerts,
        period: {
          days: daysAgo,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('[ADMIN_ALERTS] Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics'
    });
  }
};