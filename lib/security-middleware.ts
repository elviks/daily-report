import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './db';
import { ObjectId } from 'mongodb';

// Security configuration
const SECURITY_CONFIG = {
  maxFailedLogins: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
  rateLimitWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerWindow: 100,
  suspiciousIPs: new Set<string>(),
  blockedIPs: new Set<string>(),
  failedLoginAttempts: new Map<string, { count: number; lastAttempt: number }>()
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup rate limiting store periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Security event logging - optimized for performance
const securityEventQueue: Array<{event: string, details: any, severity: 'low' | 'medium' | 'high', ip: string}> = [];
let isProcessingQueue = false;

async function logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'low') {
  // Add to queue instead of blocking request
  securityEventQueue.push({
    event,
    details,
    severity,
    ip: details.ip || 'unknown'
  });
  
  // Process queue asynchronously
  if (!isProcessingQueue) {
    processSecurityEventQueue();
  }
}

async function processSecurityEventQueue() {
  if (isProcessingQueue || securityEventQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    const events = securityEventQueue.splice(0, 10); // Process up to 10 events at once
    
    if (events.length > 0) {
      const db = await getDb();
      await db.collection('security_events').insertMany(
        events.map(e => ({
          timestamp: new Date(),
          event: e.event,
          details: e.details,
          severity: e.severity,
          ip: e.ip
        }))
      );
    }
  } catch (error) {
    console.error('Failed to log security events:', error);
    // Re-add failed events to the front of the queue
    securityEventQueue.unshift(...events);
  } finally {
    isProcessingQueue = false;
    
    // Continue processing if there are more events
    if (securityEventQueue.length > 0) {
      setTimeout(processSecurityEventQueue, 100);
    }
  }
}

// IP blocking middleware
export async function ipBlockingMiddleware(request: NextRequest) {
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Check if IP is blocked
  if (SECURITY_CONFIG.blockedIPs.has(clientIP)) {
    await logSecurityEvent('blocked_ip_access', { ip: clientIP }, 'high');
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Check if IP is suspicious
  if (SECURITY_CONFIG.suspiciousIPs.has(clientIP)) {
    await logSecurityEvent('suspicious_ip_access', { ip: clientIP }, 'medium');
  }
  
  return null; // Continue to next middleware
}

// Rate limiting middleware
export async function rateLimitMiddleware(request: NextRequest) {
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Get current rate limit data
  const rateLimitData = rateLimitStore.get(clientIP);
  
  if (rateLimitData && now < rateLimitData.resetTime) {
    // Within rate limit window
    if (rateLimitData.count >= SECURITY_CONFIG.maxRequestsPerWindow) {
      await logSecurityEvent('rate_limit_exceeded', { ip: clientIP, count: rateLimitData.count }, 'medium');
      
      // Add to suspicious IPs
      SECURITY_CONFIG.suspiciousIPs.add(clientIP);
      
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Increment request count
    rateLimitData.count++;
  } else {
    // New rate limit window
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.rateLimitWindow
    });
  }
  
  return null; // Continue to next middleware
}

// Brute force protection middleware
export async function bruteForceProtectionMiddleware(request: NextRequest) {
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Check failed login attempts
  const failedAttempts = SECURITY_CONFIG.failedLoginAttempts.get(clientIP);
  
  if (failedAttempts) {
    const timeSinceLastAttempt = now - failedAttempts.lastAttempt;
    
    // Check if still in lockout period
    if (timeSinceLastAttempt < SECURITY_CONFIG.lockoutDuration) {
      await logSecurityEvent('brute_force_attempt', { 
        ip: clientIP, 
        failedAttempts: failedAttempts.count 
      }, 'high');
      
      return NextResponse.json(
        { error: 'Account temporarily locked due to multiple failed login attempts' },
        { status: 423 }
      );
    } else {
      // Reset failed attempts after lockout period
      SECURITY_CONFIG.failedLoginAttempts.delete(clientIP);
    }
  }
  
  return null; // Continue to next middleware
}

// Security headers middleware
export function securityHeadersMiddleware(response: NextResponse) {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  
  return response;
}

// Failed login tracking
export async function trackFailedLogin(email: string, ip: string) {
  const now = Date.now();
  const failedAttempts = SECURITY_CONFIG.failedLoginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  
  failedAttempts.count++;
  failedAttempts.lastAttempt = now;
  
  SECURITY_CONFIG.failedLoginAttempts.set(ip, failedAttempts);
  
  // Log failed login attempt
  try {
    const db = await getDb();
    await db.collection('failed_logins').insertOne({
      timestamp: new Date(),
      email,
      ip,
      attemptCount: failedAttempts.count
    });
  } catch (error) {
    console.error('Failed to log failed login:', error);
  }
  
  // Block IP if too many failed attempts
  if (failedAttempts.count >= SECURITY_CONFIG.maxFailedLogins) {
    SECURITY_CONFIG.blockedIPs.add(ip);
    await logSecurityEvent('ip_blocked', { 
      ip, 
      email, 
      reason: 'brute_force_attack' 
    }, 'high');
  }
}

// Security monitoring
export async function getSecurityStatus() {
  try {
    const db = await getDb();
    
    // Get recent security events
    const recentEvents = await db.collection('security_events')
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    // Get failed login statistics
    const failedLogins = await db.collection('failed_logins')
      .find({})
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();
    
    // Get blocked IPs count
    const blockedIPsCount = SECURITY_CONFIG.blockedIPs.size;
    const suspiciousIPsCount = SECURITY_CONFIG.suspiciousIPs.size;
    
    return {
      recentEvents,
      failedLogins,
      blockedIPsCount,
      suspiciousIPsCount,
      securityConfig: SECURITY_CONFIG
    };
  } catch (error) {
    console.error('Failed to get security status:', error);
    return null;
  }
}

// Cleanup old data
export async function cleanupSecurityData() {
  try {
    const db = await getDb();
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Clean up old failed login attempts
    await db.collection('failed_logins').deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    // Clean up old security events (keep only high severity)
    await db.collection('security_events').deleteMany({
      timestamp: { $lt: cutoffDate },
      severity: { $ne: 'high' }
    });
    
    console.log('Security data cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup security data:', error);
  }
}

// Schedule periodic cleanup
setInterval(async () => {
  try {
    await cleanupSecurityData();
  } catch (error) {
    console.error('Scheduled security cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run cleanup every 24 hours

// Export security configuration
export { SECURITY_CONFIG };
