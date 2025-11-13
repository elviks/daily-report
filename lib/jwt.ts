import jwt from "jsonwebtoken";

/**
 * Edge-compatible JWT verification for middleware
 * Does not import MongoDB or other Node.js-specific modules
 */
export function verifyJWT(token: string): any {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === "fallback-secret") {
      console.error("JWT_SECRET not properly configured");
      return null;
    }
    return jwt.verify(token, secret);
  } catch (error) {
    console.error(
      "JWT verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * Generate JWT token
 */
export function generateJWT(payload: any, expiresIn: string | number = "24h"): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "fallback-secret") {
    throw new Error("JWT_SECRET not properly configured");
  }
  return jwt.sign(payload, secret, { expiresIn });
}
