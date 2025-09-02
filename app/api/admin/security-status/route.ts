import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/admin-middleware';
import { getSecurityStatus } from '@/lib/security-middleware';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await adminAuthMiddleware(request);
    if ('error' in authResult) {
      return authResult;
    }

    // Get security status from middleware
    const securityStatus = await getSecurityStatus();
    
    if (!securityStatus) {
      return NextResponse.json(
        { error: 'Failed to retrieve security status' },
        { status: 500 }
      );
    }

    // Get additional database security information
    const db = await getDb();
    
    // Get recent audit logs
    const auditLogs = await db.collection('audit_logs')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Get database statistics
    const dbStats = await db.stats();
    
    // Get collection sizes
    const collections = await db.listCollections().toArray();
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const stats = await db.collection(collection.name).stats();
        return {
          name: collection.name,
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize
        };
      })
    );

    // Enhanced security status with database information
    const enhancedStatus = {
      ...securityStatus,
      auditLogs,
      databaseStats: {
        collections: collectionStats,
        totalSize: dbStats.dataSize,
        totalDocuments: dbStats.objects,
        indexes: dbStats.indexes
      },
      systemInfo: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    return NextResponse.json(enhancedStatus);
  } catch (error) {
    console.error('Security status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await adminAuthMiddleware(request);
    if ('error' in authResult) {
      return authResult;
    }

    const body = await request.json();
    const { action, data } = body;

    const db = await getDb();

    switch (action) {
      case 'block_ip':
        // Manually block an IP address
        if (!data.ip) {
          return NextResponse.json(
            { error: 'IP address required' },
            { status: 400 }
          );
        }

        await db.collection('security_events').insertOne({
          timestamp: new Date(),
          event: 'manual_ip_block',
          details: { ip: data.ip, reason: data.reason || 'Manual block' },
          severity: 'high',
          ip: data.ip,
          adminUserId: authResult.user.uid
        });

        return NextResponse.json({ 
          success: true, 
          message: `IP ${data.ip} blocked successfully` 
        });

      case 'unblock_ip':
        // Unblock an IP address
        if (!data.ip) {
          return NextResponse.json(
            { error: 'IP address required' },
            { status: 400 }
          );
        }

        await db.collection('security_events').insertOne({
          timestamp: new Date(),
          event: 'manual_ip_unblock',
          details: { ip: data.ip, reason: data.reason || 'Manual unblock' },
          severity: 'medium',
          ip: data.ip,
          adminUserId: authResult.user.uid
        });

        return NextResponse.json({ 
          success: true, 
          message: `IP ${data.ip} unblocked successfully` 
        });

      case 'update_security_config':
        // Update security configuration
        const { maxFailedLogins, lockoutDuration, rateLimitWindow, maxRequestsPerWindow } = data;
        
        await db.collection('security_config').updateOne(
          { _id: 'security_settings' },
          {
            $set: {
              maxFailedLogins: maxFailedLogins || 5,
              lockoutDuration: lockoutDuration || 30,
              rateLimitWindow: rateLimitWindow || 900000,
              maxRequestsPerWindow: maxRequestsPerWindow || 100,
              updatedAt: new Date(),
              updatedBy: authResult.user.uid
            }
          },
          { upsert: true }
        );

        return NextResponse.json({ 
          success: true, 
          message: 'Security configuration updated successfully' 
        });

      case 'clear_failed_logins':
        // Clear failed login attempts for a specific IP or email
        const filter: any = {};
        if (data.ip) filter.ip = data.ip;
        if (data.email) filter.email = data.email;

        if (Object.keys(filter).length === 0) {
          return NextResponse.json(
            { error: 'IP or email required' },
            { status: 400 }
          );
        }

        const result = await db.collection('failed_logins').deleteMany(filter);

        await db.collection('security_events').insertOne({
          timestamp: new Date(),
          event: 'clear_failed_logins',
          details: { filter, deletedCount: result.deletedCount },
          severity: 'low',
          ip: data.ip || 'N/A',
          adminUserId: authResult.user.uid
        });

        return NextResponse.json({ 
          success: true, 
          message: `Cleared ${result.deletedCount} failed login attempts` 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
