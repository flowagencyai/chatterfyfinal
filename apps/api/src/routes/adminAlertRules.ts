// apps/api/src/routes/adminAlertRules.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all alert rules
export const adminGetAlertRules = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.query;
    
    const where = orgId ? { orgId: orgId as string } : {};
    
    const alertRules = await prisma.alertRule.findMany({
      where,
      include: {
        org: {
          select: { id: true, name: true }
        },
        alerts: {
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: alertRules
    });
  } catch (error) {
    console.error('[ADMIN_ALERT_RULES] Error fetching alert rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert rules'
    });
  }
};

// Create alert rule
export const adminCreateAlertRule = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      alertType,
      metric,
      operator,
      threshold,
      timeWindow,
      notificationChannels,
      recipients,
      orgId,
      cooldownMinutes = 60
    } = req.body;

    const userEmail = req.headers['x-user-email'] as string;
    const userId = req.headers['x-user-id'] as string;

    // Validate required fields
    if (!name || !alertType || !metric || !operator || threshold === undefined || !timeWindow) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, alertType, metric, operator, threshold, timeWindow'
      });
    }

    // Validate notification channels
    let parsedChannels;
    try {
      parsedChannels = typeof notificationChannels === 'string' ? 
        JSON.parse(notificationChannels) : notificationChannels;
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid notificationChannels format (must be valid JSON array)'
      });
    }

    // Validate recipients if provided
    let parsedRecipients = null;
    if (recipients) {
      try {
        parsedRecipients = typeof recipients === 'string' ? 
          JSON.parse(recipients) : recipients;
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid recipients format (must be valid JSON array)'
        });
      }
    }

    const alertRule = await prisma.alertRule.create({
      data: {
        name,
        description,
        alertType,
        metric,
        operator,
        threshold: parseFloat(threshold),
        timeWindow: parseInt(timeWindow),
        notificationChannels: JSON.stringify(parsedChannels),
        recipients: parsedRecipients ? JSON.stringify(parsedRecipients) : null,
        orgId: orgId || null,
        cooldownMinutes: parseInt(cooldownMinutes),
        createdBy: userId || userEmail || 'unknown'
      },
      include: {
        org: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      data: alertRule
    });
  } catch (error) {
    console.error('[ADMIN_ALERT_RULES] Error creating alert rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert rule'
    });
  }
};

// Update alert rule
export const adminUpdateAlertRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const {
      name,
      description,
      enabled,
      alertType,
      metric,
      operator,
      threshold,
      timeWindow,
      notificationChannels,
      recipients,
      orgId,
      cooldownMinutes
    } = req.body;

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = Boolean(enabled);
    if (alertType !== undefined) updateData.alertType = alertType;
    if (metric !== undefined) updateData.metric = metric;
    if (operator !== undefined) updateData.operator = operator;
    if (threshold !== undefined) updateData.threshold = parseFloat(threshold);
    if (timeWindow !== undefined) updateData.timeWindow = parseInt(timeWindow);
    if (orgId !== undefined) updateData.orgId = orgId || null;
    if (cooldownMinutes !== undefined) updateData.cooldownMinutes = parseInt(cooldownMinutes);
    
    if (notificationChannels !== undefined) {
      try {
        const parsed = typeof notificationChannels === 'string' ? 
          JSON.parse(notificationChannels) : notificationChannels;
        updateData.notificationChannels = JSON.stringify(parsed);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid notificationChannels format'
        });
      }
    }
    
    if (recipients !== undefined) {
      if (recipients) {
        try {
          const parsed = typeof recipients === 'string' ? 
            JSON.parse(recipients) : recipients;
          updateData.recipients = JSON.stringify(parsed);
        } catch {
          return res.status(400).json({
            success: false,
            error: 'Invalid recipients format'
          });
        }
      } else {
        updateData.recipients = null;
      }
    }

    const alertRule = await prisma.alertRule.update({
      where: { id: ruleId },
      data: updateData,
      include: {
        org: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      data: alertRule
    });
  } catch (error) {
    console.error('[ADMIN_ALERT_RULES] Error updating alert rule:', error);
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update alert rule'
      });
    }
  }
};

// Delete alert rule
export const adminDeleteAlertRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    await prisma.alertRule.delete({
      where: { id: ruleId }
    });

    res.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN_ALERT_RULES] Error deleting alert rule:', error);
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete alert rule'
      });
    }
  }
};

// Test alert rule (trigger a test alert)
export const adminTestAlertRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const userEmail = req.headers['x-user-email'] as string;
    const userId = req.headers['x-user-id'] as string;

    const alertRule = await prisma.alertRule.findUnique({
      where: { id: ruleId },
      include: {
        org: {
          select: { id: true, name: true }
        }
      }
    });

    if (!alertRule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found'
      });
    }

    // Create a test alert
    const testAlert = await prisma.alert.create({
      data: {
        alertRuleId: ruleId,
        title: `TEST: ${alertRule.name}`,
        message: `This is a test alert for rule: ${alertRule.name}. Triggered manually for testing purposes.`,
        severity: 'LOW',
        orgId: alertRule.orgId,
        metricValue: alertRule.threshold,
        threshold: alertRule.threshold,
        status: 'ACKNOWLEDGED' // Auto-acknowledge test alerts
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
      message: 'Test alert created successfully',
      data: testAlert
    });
  } catch (error) {
    console.error('[ADMIN_ALERT_RULES] Error creating test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test alert'
    });
  }
};