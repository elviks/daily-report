import { getDb } from './db';

// Security alert configuration
export interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'suspicious_ip' | 'rate_limit' | 'failed_auth' | 'database_access' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  ip?: string;
  userId?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  brute_force: { attempts: 3, window: 5 * 60 * 1000 }, // 3 attempts in 5 minutes
  suspicious_ip: { events: 5, window: 15 * 60 * 1000 }, // 5 events in 15 minutes
  rate_limit: { violations: 3, window: 10 * 60 * 1000 }, // 3 violations in 10 minutes
  failed_auth: { attempts: 10, window: 30 * 60 * 1000 }, // 10 attempts in 30 minutes
  database_access: { failed: 5, window: 5 * 60 * 1000 }, // 5 failed DB access in 5 minutes
  admin_action: { always: true } // Always alert on admin actions
};

// Alert severity levels
export const ALERT_SEVERITY = {
  low: { color: 'green', icon: 'ℹ️', priority: 1 },
  medium: { color: 'yellow', icon: '⚠️', priority: 2 },
  high: { color: 'orange', icon: '🚨', priority: 3 },
  critical: { color: 'red', icon: '💥', priority: 4 }
};

// Create security alert
export async function createSecurityAlert(
  type: SecurityAlert['type'],
  severity: SecurityAlert['severity'],
  message: string,
  details: any,
  ip?: string,
  userId?: string
): Promise<void> {
  try {
    const db = await getDb();
    
    const alert: Omit<SecurityAlert, 'id'> = {
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      ip,
      userId,
      resolved: false
    };

    await db.collection('security_alerts').insertOne(alert);
    
    // Log the alert
    console.log(`🚨 Security Alert [${severity.toUpperCase()}]: ${message}`);
    
    // Send notification if critical or high severity
    if (severity === 'critical' || severity === 'high') {
      await sendSecurityNotification(alert);
    }
    
    // Check if we need to escalate
    await checkAlertEscalation(type, ip, userId);
    
  } catch (error) {
    console.error('Failed to create security alert:', error);
  }
}

// Check if alerts need escalation
async function checkAlertEscalation(type: string, ip?: string, userId?: string): Promise<void> {
  try {
    const db = await getDb();
    const now = Date.now();
    
    switch (type) {
      case 'brute_force':
        if (ip) {
          const recentAttempts = await db.collection('failed_logins')
            .find({ 
              ip, 
              timestamp: { $gte: new Date(now - ALERT_THRESHOLDS.brute_force.window) }
            })
            .count();
          
          if (recentAttempts >= ALERT_THRESHOLDS.brute_force.attempts) {
            await createSecurityAlert(
              'brute_force',
              'critical',
              `Brute force attack detected from IP ${ip}`,
              { attempts: recentAttempts, window: ALERT_THRESHOLDS.brute_force.window },
              ip
            );
          }
        }
        break;
        
      case 'suspicious_ip':
        if (ip) {
          const recentEvents = await db.collection('security_events')
            .find({ 
              ip, 
              timestamp: { $gte: new Date(now - ALERT_THRESHOLDS.suspicious_ip.window) }
            })
            .count();
          
          if (recentEvents >= ALERT_THRESHOLDS.suspicious_ip.events) {
            await createSecurityAlert(
              'suspicious_ip',
              'high',
              `Suspicious activity from IP ${ip}`,
              { events: recentEvents, window: ALERT_THRESHOLDS.suspicious_ip.window },
              ip
            );
          }
        }
        break;
        
      case 'rate_limit':
        if (ip) {
          const recentViolations = await db.collection('security_events')
            .find({ 
              ip, 
              event: 'rate_limit_exceeded',
              timestamp: { $gte: new Date(now - ALERT_THRESHOLDS.rate_limit.window) }
            })
            .count();
          
          if (recentViolations >= ALERT_THRESHOLDS.rate_limit.violations) {
            await createSecurityAlert(
              'rate_limit',
              'high',
              `Rate limit violations from IP ${ip}`,
              { violations: recentViolations, window: ALERT_THRESHOLDS.rate_limit.window },
              ip
            );
          }
        }
        break;
    }
  } catch (error) {
    console.error('Failed to check alert escalation:', error);
  }
}

// Send security notification
async function sendSecurityNotification(alert: SecurityAlert): Promise<void> {
  try {
    // This would integrate with your notification system
    // For now, we'll just log it
    
    const notification = {
      type: 'security_alert',
      title: `Security Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp,
      details: alert.details
    };
    
    console.log('📧 Security Notification:', notification);
    
    // TODO: Integrate with your notification service
    // await sendEmail(notification);
    // await sendSlack(notification);
    // await sendSMS(notification);
    
  } catch (error) {
    console.error('Failed to send security notification:', error);
  }
}

// Get active security alerts
export async function getActiveSecurityAlerts(
  severity?: SecurityAlert['severity'],
  type?: SecurityAlert['type'],
  limit: number = 50
): Promise<SecurityAlert[]> {
  try {
    const db = await getDb();
    
    const filter: any = { resolved: false };
    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    
    const alerts = await db.collection('security_alerts')
      .find(filter)
      .sort({ timestamp: -1, severity: -1 })
      .limit(limit)
      .toArray();
    
    return alerts as SecurityAlert[];
  } catch (error) {
    console.error('Failed to get active security alerts:', error);
    return [];
  }
}

// Resolve security alert
export async function resolveSecurityAlert(
  alertId: string,
  resolvedBy: string,
  resolutionNotes?: string
): Promise<boolean> {
  try {
    const db = await getDb();
    
    const result = await db.collection('security_alerts').updateOne(
      { _id: alertId },
      {
        $set: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
          resolutionNotes
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      // Log resolution
      await db.collection('audit_logs').insertOne({
        timestamp: new Date(),
        event: 'security_alert_resolved',
        userId: resolvedBy,
        details: { alertId, resolutionNotes }
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to resolve security alert:', error);
    return false;
  }
}

// Get security alert statistics
export async function getSecurityAlertStats(): Promise<{
  total: number;
  active: number;
  resolved: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
}> {
  try {
    const db = await getDb();
    
    const [total, active, resolved] = await Promise.all([
      db.collection('security_alerts').countDocuments(),
      db.collection('security_alerts').countDocuments({ resolved: false }),
      db.collection('security_alerts').countDocuments({ resolved: true })
    ]);
    
    // Get counts by severity
    const severityStats = await db.collection('security_alerts').aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]).toArray();
    
    const bySeverity: Record<string, number> = {};
    severityStats.forEach(stat => {
      bySeverity[stat._id] = stat.count;
    });
    
    // Get counts by type
    const typeStats = await db.collection('security_alerts').aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]).toArray();
    
    const byType: Record<string, number> = {};
    typeStats.forEach(stat => {
      byType[stat._id] = stat.count;
    });
    
    return {
      total,
      active,
      resolved,
      bySeverity,
      byType
    };
  } catch (error) {
    console.error('Failed to get security alert statistics:', error);
    return {
      total: 0,
      active: 0,
      resolved: 0,
      bySeverity: {},
      byType: {}
    };
  }
}

// Clean up old resolved alerts
export async function cleanupOldAlerts(daysToKeep: number = 30): Promise<number> {
  try {
    const db = await getDb();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await db.collection('security_alerts').deleteMany({
      resolved: true,
      resolvedAt: { $lt: cutoffDate }
    });
    
    console.log(`🧹 Cleaned up ${result.deletedCount} old security alerts`);
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old alerts:', error);
    return 0;
  }
}

// Export alert thresholds for external use
export { ALERT_THRESHOLDS };
