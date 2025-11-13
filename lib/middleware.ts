import { NextRequest, NextResponse } from "next/server";
import { findTenantBySlug } from "./db";
import { verifyJWT } from "./jwt";
import {
  ipBlockingMiddleware,
  rateLimitMiddleware,
  bruteForceProtectionMiddleware,
  securityHeadersMiddleware,
  trackFailedLogin,
} from "./security-middleware";

// Helper function to add headers to request without consuming body
function addHeadersToRequest(
  request: NextRequest,
  newHeaders: Record<string, string>
): NextRequest {
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

// Enhanced middleware chain for security
export async function securityMiddlewareChain(request: NextRequest) {
  // 1. IP Blocking Check
  const ipBlockResult = await ipBlockingMiddleware(request);
  if (ipBlockResult) return ipBlockResult;

  // 2. Rate Limiting
  const rateLimitResult = await rateLimitMiddleware(request);
  if (rateLimitResult) return rateLimitResult;

  // 3. Brute Force Protection
  const bruteForceResult = await bruteForceProtectionMiddleware(request);
  if (bruteForceResult) return bruteForceResult;

  return null; // Continue to next middleware
}

// Middleware to load tenant from company code
export async function loadTenantMiddleware(request: NextRequest) {
  try {
    // Apply security middleware first
    const securityResult = await securityMiddlewareChain(request);
    if (securityResult) return securityResult;

    const body = await request.json();
    const { companyCode } = body;

    if (!companyCode) {
      return NextResponse.json(
        { error: "Company code is required" },
        { status: 400 }
      );
    }

    const tenant = await findTenantBySlug(companyCode);
    if (!tenant) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Add tenant info to request headers for downstream use
    const newRequest = addHeadersToRequest(request, {
      "x-tenant-id": tenant._id!.toString(),
      "x-tenant-slug": tenant.slug,
    });

    return { request: newRequest, tenant };
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Middleware to verify JWT and extract user info
export async function authMiddleware(request: NextRequest) {
  try {
    // Apply security middleware first
    const securityResult = await securityMiddlewareChain(request);
    if (securityResult) return securityResult;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Add user info to request headers
    const newRequest = addHeadersToRequest(request, {
      "x-user-id": payload.uid,
      "x-user-email": payload.email,
      "x-user-role": payload.role,
      "x-user-is-admin": payload.isAdmin.toString(),
      "x-tenant-id": payload.tid,
    });

    return { request: newRequest, user: payload };
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

// Enhanced login middleware with security
export async function loginSecurityMiddleware(request: NextRequest) {
  try {
    // Apply security middleware first
    const securityResult = await securityMiddlewareChain(request);
    if (securityResult) return securityResult;

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Track login attempt for security monitoring
    const clientIP =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";

    // Add security context to request
    const newRequest = addHeadersToRequest(request, {
      "x-login-attempt": "true",
      "x-client-ip": clientIP,
      "x-login-email": email,
    });

    return { request: newRequest, loginData: { email, password, clientIP } };
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// Helper function to get tenant ID from request headers
export function getTenantIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id");
}

// Helper function to get user ID from request headers
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-user-id");
}

// Helper function to check if user is admin
export function isUserAdmin(request: NextRequest): boolean {
  return request.headers.get("x-user-is-admin") === "true";
}

// Helper function to get client IP from request
export function getClientIP(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Helper function to apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  return securityHeadersMiddleware(response);
}
