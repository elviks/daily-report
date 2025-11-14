import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./jwt";

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

export async function adminAuthMiddleware(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    console.log(
      "Admin middleware - Auth header:",
      authHeader ? "Present" : "Missing"
    );

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Admin middleware - Invalid auth header format");
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log("Admin middleware - Token length:", token?.length);
    console.log(
      "Admin middleware - Token preview:",
      token?.substring(0, 20) + "..."
    );

    const payload = await verifyJWT(token);
    console.log("Admin middleware - JWT payload:", payload);

    if (!payload) {
      console.log("Admin middleware - JWT verification failed");
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if user is admin
    console.log("Admin middleware - Checking admin status:", {
      isAdmin: payload.isAdmin,
      role: payload.role,
      email: payload.email,
    });

    if (
      !payload.isAdmin &&
      payload.role !== "admin" &&
      payload.role !== "superadmin"
    ) {
      console.log("Admin middleware - Admin access denied");
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("Admin middleware - Admin access granted");

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
    console.error("Admin middleware error:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 401 }
    );
  }
}

// Helper function to check if user is admin
export function isUserAdmin(request: NextRequest): boolean {
  const isAdmin = request.headers.get("x-user-is-admin") === "true";
  const role = request.headers.get("x-user-role");
  return isAdmin || role === "admin" || role === "superadmin";
}

// Helper function to get tenant ID from request headers
export function getTenantIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-tenant-id");
}

// Helper function to get user ID from request headers
export function getUserIdFromRequest(request: NextRequest): string | null {
  return request.headers.get("x-user-id");
}
