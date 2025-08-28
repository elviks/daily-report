import { NextRequest, NextResponse } from 'next/server';
import { findTenantBySlug } from './db';
import { verifyJWT } from './db';

// Helper function to add headers to request without consuming body
function addHeadersToRequest(request: NextRequest, newHeaders: Record<string, string>): NextRequest {
  const requestHeaders = new Headers(request.headers);
  Object.entries(newHeaders).forEach(([key, value]) => {
    requestHeaders.set(key, value);
  });
  
  // Create a new request with the updated headers but preserve the original body
  return new NextRequest(request.url, {
    method: request.method,
    headers: requestHeaders,
    body: request.body,
    cache: request.cache,
    credentials: request.credentials,
    integrity: request.integrity,
    keepalive: request.keepalive,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
    signal: request.signal,
  });
}

// Middleware to load tenant from company code
export async function loadTenantMiddleware(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyCode } = body;
    
    if (!companyCode) {
      return NextResponse.json(
        { error: 'Company code is required' },
        { status: 400 }
      );
    }
    
    const tenant = await findTenantBySlug(companyCode);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    // Add tenant info to request headers for downstream use
    const newRequest = addHeadersToRequest(request, {
      'x-tenant-id': tenant._id!.toString(),
      'x-tenant-slug': tenant.slug
    });
    
    return { request: newRequest, tenant };
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// Middleware to verify JWT and extract user info
export async function authMiddleware(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Add user info to request headers
    const newRequest = addHeadersToRequest(request, {
      'x-user-id': payload.uid,
      'x-user-email': payload.email,
      'x-user-role': payload.role,
      'x-user-is-admin': payload.isAdmin.toString(),
      'x-tenant-id': payload.tid
    });
    
    return { request: newRequest, user: payload };
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

// Helper function to get tenant ID from request headers
export function getTenantIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-tenant-id');
}

// Helper function to get user ID from request headers
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id');
}

// Helper function to check if user is admin
export function isUserAdmin(request: NextRequest): boolean {
  return request.headers.get('x-user-is-admin') === 'true';
}
