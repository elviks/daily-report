import { type NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  findTenantBySlug,
  findUserByEmailAndTenant,
  verifyPassword,
  generateJWT,
} from "@/lib/db";
import { ensureInitialization } from "@/lib/db-init";
import {
  rateLimitMiddleware,
  bruteForceProtectionMiddleware,
} from "@/lib/security-middleware";

// Track failed login attempts per IP and email combination
const loginAttempts = new Map<
  string,
  { count: number; lastAttempt: number; blockedUntil?: number }
>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) return rateLimitResult;

    // Apply brute force protection
    const bruteForceResult = await bruteForceProtectionMiddleware(request);
    if (bruteForceResult) return bruteForceResult;

    // Initialize database in background (non-blocking)
    ensureInitialization().catch((err) => console.error("Init error:", err));

    const { email, password, companyCode } = await request.json();
    const clientIP =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const attemptKey = `${clientIP}:${email?.toLowerCase()}`;

    if (!email || !password || !companyCode) {
      return NextResponse.json(
        {
          message: "Email, password, and company code are required",
        },
        { status: 400 }
      );
    }

    // Check if account is locked out
    const attempt = loginAttempts.get(attemptKey);
    if (attempt?.blockedUntil && Date.now() < attempt.blockedUntil) {
      const remainingMinutes = Math.ceil(
        (attempt.blockedUntil - Date.now()) / 60000
      );
      console.warn(
        `Login attempt on locked account: ${email} from IP ${clientIP}`
      );
      return NextResponse.json(
        {
          message: `Account temporarily locked. Try again in ${remainingMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Find tenant by company code
    const tenant = await findTenantBySlug(companyCode);
    if (!tenant) {
      // Don't reveal whether company exists
      console.warn(
        `Login attempt with invalid company code: ${companyCode} from IP ${clientIP}`
      );
      return NextResponse.json(
        {
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Find user by email and tenant
    const user = await findUserByEmailAndTenant(email, tenant._id!);

    if (!user) {
      // Track failed attempt
      const current = loginAttempts.get(attemptKey) || {
        count: 0,
        lastAttempt: 0,
      };
      current.count++;
      current.lastAttempt = Date.now();

      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.blockedUntil = Date.now() + LOCKOUT_DURATION;
        console.warn(
          `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts: ${email} from IP ${clientIP}`
        );
      }

      loginAttempts.set(attemptKey, current);

      return NextResponse.json(
        {
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // Track failed attempt
      const current = loginAttempts.get(attemptKey) || {
        count: 0,
        lastAttempt: 0,
      };
      current.count++;
      current.lastAttempt = Date.now();

      if (current.count >= MAX_LOGIN_ATTEMPTS) {
        current.blockedUntil = Date.now() + LOCKOUT_DURATION;
        console.warn(
          `Account locked after ${MAX_LOGIN_ATTEMPTS} failed password attempts: ${email} from IP ${clientIP}`
        );
      }

      loginAttempts.set(attemptKey, current);

      return NextResponse.json(
        {
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(attemptKey);
    console.log(`Successful login: ${email} from IP ${clientIP}`);

    // Generate JWT token
    const token = await generateJWT(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Create response with cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
      tenant: {
        id: tenant._id?.toString(),
        name: tenant.name,
        slug: tenant.slug,
      },
    });

    // Set HTTP-only cookie for middleware authentication
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Cleanup old login attempts every 30 minutes
setInterval(() => {
  const now = Date.now();
  const expiry = 30 * 60 * 1000; // 30 minutes

  for (const [key, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > expiry) {
      loginAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);
