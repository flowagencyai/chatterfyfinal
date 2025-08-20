// apps/api/src/util/alertEngine.ts
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

export interface AlertMetrics {
  daily_tokens: number;
  monthly_tokens: number;
  error_rate_5min: number;
  error_rate_1hour: number;
  storage_usage_mb: number;
  failed_payments: number;
  active_users_1hour: number;
  api_response_time_avg: number;
}

export class AlertEngine {
  private emailTransporter?: nodemailer.Transporter;

  constructor() {
    this.initializeEmailTransporter();
  }

  private initializeEmailTransporter() {
    const emailServer = process.env.EMAIL_SERVER;
    if (emailServer) {
      try {
        this.emailTransporter = nodemailer.createTransport(emailServer);
        console.log('✅ [ALERT_ENGINE] Email transporter initialized');
      } catch (error) {
        console.error('❌ [ALERT_ENGINE] Failed to initialize email transporter:', error);
      }
    }
  }

  // Main method to run alert checks
  async runAlertChecks(): Promise<void> {
    try {
      console.log('🔍 [ALERT_ENGINE] Starting alert checks...');
      
      // Get all enabled alert rules
      const alertRules = await prisma.alertRule.findMany({
        where: { enabled: true },
        include: {
          org: {
            select: { id: true, name: true }
          }
        }
      });

      console.log(`📋 [ALERT_ENGINE] Found ${alertRules.length} enabled alert rules`);

      // Check each rule
      for (const rule of alertRules) {
        try {
          await this.checkAlertRule(rule);
        } catch (error) {
          console.error(`❌ [ALERT_ENGINE] Error checking rule ${rule.name}:`, error);
        }
      }

      // Clean up old alert metrics (keep last 7 days)
      await this.cleanupOldMetrics();

      console.log('✅ [ALERT_ENGINE] Alert checks completed');
    } catch (error) {
      console.error('❌ [ALERT_ENGINE] Critical error in alert checks:', error);
    }
  }

  // Check a specific alert rule
  private async checkAlertRule(rule: any): Promise<void> {
    // Check cooldown period
    if (rule.lastTriggered) {
      const cooldownEnd = new Date(rule.lastTriggered.getTime() + (rule.cooldownMinutes * 60000));
      if (new Date() < cooldownEnd) {
        console.log(`⏳ [ALERT_ENGINE] Rule ${rule.name} is in cooldown period`);
        return;
      }
    }

    // Calculate metric value based on rule configuration
    const metricValue = await this.calculateMetricValue(rule);
    
    if (metricValue === null) {
      console.log(`⚠️  [ALERT_ENGINE] Could not calculate metric for rule ${rule.name}`);
      return;
    }

    // Cache the metric value
    await this.cacheMetricValue(rule, metricValue);

    // Check if threshold is exceeded
    const thresholdExceeded = this.evaluateThreshold(metricValue, rule.operator, rule.threshold);

    if (thresholdExceeded) {
      console.log(`🚨 [ALERT_ENGINE] Threshold exceeded for rule ${rule.name}: ${metricValue} ${rule.operator} ${rule.threshold}`);
      await this.triggerAlert(rule, metricValue);
    }
  }

  // Calculate metric value based on rule configuration
  private async calculateMetricValue(rule: any): Promise<number | null> {
    const timeWindowStart = new Date(Date.now() - (rule.timeWindow * 60000));
    
    try {
      switch (rule.metric) {
        case 'daily_tokens':
          return await this.calculateDailyTokens(rule.orgId, timeWindowStart);
          
        case 'monthly_tokens':
          return await this.calculateMonthlyTokens(rule.orgId);
          
        case 'error_rate_5min':
        case 'error_rate_1hour':
          return await this.calculateErrorRate(rule.orgId, timeWindowStart);
          
        case 'storage_usage_mb':
          return await this.calculateStorageUsage(rule.orgId);
          
        case 'failed_payments':
          return await this.calculateFailedPayments(rule.orgId, timeWindowStart);
          
        case 'active_users_1hour':
          return await this.calculateActiveUsers(rule.orgId, timeWindowStart);
          
        case 'api_response_time_avg':
          return await this.calculateAvgResponseTime(rule.orgId, timeWindowStart);
          
        default:
          console.error(`❌ [ALERT_ENGINE] Unknown metric: ${rule.metric}`);
          return null;
      }
    } catch (error) {
      console.error(`❌ [ALERT_ENGINE] Error calculating metric ${rule.metric}:`, error);
      return null;
    }
  }

  // Metric calculation methods
  private async calculateDailyTokens(orgId: string | null, since: Date): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      day: { gte: today },
      ts: { gte: since }
    };
    
    if (orgId) {
      where.orgId = orgId;
    }

    const result = await prisma.usage.aggregate({
      where,
      _sum: { total_tokens: true }
    });

    return result._sum.total_tokens || 0;
  }

  private async calculateMonthlyTokens(orgId: string | null): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const where: any = {
      day: { gte: monthStart }
    };
    
    if (orgId) {
      where.orgId = orgId;
    }

    const result = await prisma.usage.aggregate({
      where,
      _sum: { total_tokens: true }
    });

    return result._sum.total_tokens || 0;
  }

  private async calculateErrorRate(orgId: string | null, since: Date): Promise<number> {
    // This would need to be implemented based on your error logging
    // For now, return a placeholder
    return 0;
  }

  private async calculateStorageUsage(orgId: string | null): Promise<number> {
    const where: any = {};
    if (orgId) {
      where.orgId = orgId;
    }

    const result = await prisma.fileAsset.aggregate({
      where,
      _sum: { sizeBytes: true }
    });

    return Math.round((result._sum.sizeBytes || 0) / (1024 * 1024)); // Convert to MB
  }

  private async calculateFailedPayments(orgId: string | null, since: Date): Promise<number> {
    const where: any = {
      createdAt: { gte: since },
      eventType: { in: ['invoice.payment_failed', 'payment_intent.payment_failed'] }
    };

    const failedPayments = await prisma.stripeWebhook.count({ where });
    return failedPayments;
  }

  private async calculateActiveUsers(orgId: string | null, since: Date): Promise<number> {
    const where: any = {
      ts: { gte: since }
    };
    
    if (orgId) {
      where.orgId = orgId;
    }

    const activeUsers = await prisma.usage.groupBy({
      by: ['userId'],
      where,
      _count: true
    });

    return activeUsers.length;
  }

  private async calculateAvgResponseTime(orgId: string | null, since: Date): Promise<number> {
    // This would need to be implemented based on your performance logging
    // For now, return a placeholder
    return 0;
  }

  // Evaluate if threshold is exceeded
  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      default:
        console.error(`❌ [ALERT_ENGINE] Unknown operator: ${operator}`);
        return false;
    }
  }

  // Trigger an alert
  private async triggerAlert(rule: any, metricValue: number): Promise<void> {
    try {
      // Create alert record
      const alert = await prisma.alert.create({
        data: {
          alertRuleId: rule.id,
          title: `Alert: ${rule.name}`,
          message: this.generateAlertMessage(rule, metricValue),
          severity: this.determineSeverity(rule, metricValue),
          orgId: rule.orgId,
          metricValue,
          threshold: rule.threshold,
          status: 'ACTIVE'
        }
      });

      // Update rule's lastTriggered timestamp
      await prisma.alertRule.update({
        where: { id: rule.id },
        data: { lastTriggered: new Date() }
      });

      // Send notifications
      await this.sendNotifications(rule, alert);

      console.log(`🔔 [ALERT_ENGINE] Alert triggered: ${alert.title}`);
    } catch (error) {
      console.error(`❌ [ALERT_ENGINE] Error triggering alert for rule ${rule.name}:`, error);
    }
  }

  // Generate alert message
  private generateAlertMessage(rule: any, metricValue: number): string {
    const orgText = rule.org ? ` for organization ${rule.org.name}` : ' (global)';
    
    return `The metric "${rule.metric}" has ${rule.operator === 'gt' ? 'exceeded' : 'fallen below'} ` +
           `the threshold of ${rule.threshold}. Current value: ${metricValue}${orgText}. ` +
           `Time window: ${rule.timeWindow} minutes.`;
  }

  // Determine alert severity based on how much threshold is exceeded
  private determineSeverity(rule: any, metricValue: number): string {
    const percentOver = Math.abs((metricValue - rule.threshold) / rule.threshold * 100);
    
    if (percentOver >= 200) return 'CRITICAL';
    if (percentOver >= 100) return 'HIGH';
    if (percentOver >= 50) return 'MEDIUM';
    return 'LOW';
  }

  // Send notifications
  private async sendNotifications(rule: any, alert: any): Promise<void> {
    const channels = JSON.parse(rule.notificationChannels || '[]');
    const recipients = rule.recipients ? JSON.parse(rule.recipients) : [];

    const notificationResults = [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (this.emailTransporter && recipients.length > 0) {
              await this.sendEmailNotification(rule, alert, recipients);
              notificationResults.push({ channel: 'email', status: 'sent', recipients: recipients.length });
            }
            break;
            
          case 'dashboard':
            // Dashboard notifications are handled by storing the alert in the database
            notificationResults.push({ channel: 'dashboard', status: 'sent' });
            break;
            
          case 'webhook':
            if (recipients.length > 0) {
              await this.sendWebhookNotifications(rule, alert, recipients);
              notificationResults.push({ channel: 'webhook', status: 'sent', endpoints: recipients.length });
            }
            break;
        }
      } catch (error) {
        console.error(`❌ [ALERT_ENGINE] Failed to send ${channel} notification:`, error);
        notificationResults.push({ channel, status: 'failed', error: error.message });
      }
    }

    // Update alert with notification results
    await prisma.alert.update({
      where: { id: alert.id },
      data: {
        notificationsSent: JSON.stringify(notificationResults)
      }
    });
  }

  // Send email notification
  private async sendEmailNotification(rule: any, alert: any, recipients: string[]): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    const subject = `🚨 Alert: ${rule.name}`;
    const html = `
      <h2>Alert Triggered</h2>
      <p><strong>Rule:</strong> ${rule.name}</p>
      <p><strong>Description:</strong> ${rule.description || 'N/A'}</p>
      <p><strong>Message:</strong> ${alert.message}</p>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Metric Value:</strong> ${alert.metricValue}</p>
      <p><strong>Threshold:</strong> ${alert.threshold}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <p><a href="${process.env.NEXT_PUBLIC_API_BASE?.replace(':8787', ':3001')}/admin">View in Admin Dashboard</a></p>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@chatterfy.com',
      to: recipients,
      subject,
      html
    });
  }

  // Send webhook notifications
  private async sendWebhookNotifications(rule: any, alert: any, webhookUrls: string[]): Promise<void> {
    const payload = {
      event: 'alert.triggered',
      alert: {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        metricValue: alert.metricValue,
        threshold: alert.threshold,
        orgId: alert.orgId,
        createdAt: alert.createdAt
      },
      rule: {
        id: rule.id,
        name: rule.name,
        alertType: rule.alertType,
        metric: rule.metric
      }
    };

    for (const url of webhookUrls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Chatterfy-AlertEngine/1.0'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ [ALERT_ENGINE] Webhook notification failed for ${url}:`, error);
        throw error;
      }
    }
  }

  // Cache metric value for performance and historical tracking
  private async cacheMetricValue(rule: any, value: number): Promise<void> {
    try {
      await prisma.alertMetric.create({
        data: {
          metricName: rule.metric,
          orgId: rule.orgId,
          value,
          timestamp: new Date(),
          metadata: JSON.stringify({
            ruleId: rule.id,
            timeWindow: rule.timeWindow
          })
        }
      });
    } catch (error) {
      console.error('❌ [ALERT_ENGINE] Error caching metric value:', error);
    }
  }

  // Clean up old metrics (keep last 7 days)
  private async cleanupOldMetrics(): Promise<void> {
    try {
      const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      
      const deleted = await prisma.alertMetric.deleteMany({
        where: {
          timestamp: { lt: sevenDaysAgo }
        }
      });

      if (deleted.count > 0) {
        console.log(`🧹 [ALERT_ENGINE] Cleaned up ${deleted.count} old metric records`);
      }
    } catch (error) {
      console.error('❌ [ALERT_ENGINE] Error cleaning up metrics:', error);
    }
  }
}

// Singleton instance
export const alertEngine = new AlertEngine();