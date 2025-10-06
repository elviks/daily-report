import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check MongoDB connection
    let dbStatus = 'disconnected';
    let dbResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      const client = await Promise.race([
        clientPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )
      ]);
      
      if (client) {
        await client.db('daily-report').admin().ping();
        dbStatus = 'connected';
        dbResponseTime = Date.now() - dbStartTime;
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      dbStatus = 'error';
    }
    
    const totalResponseTime = Date.now() - startTime;
    
    const health = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        }
      },
      responseTime: totalResponseTime,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      responseTime: Date.now() - startTime
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}
