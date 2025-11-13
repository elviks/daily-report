import { jwtVerify, SignJWT } from "jose";

/**
 * Edge-compatible JWT verification for middleware
 * Uses jose library which works in Edge Runtime
 */
export async function verifyJWT(token: string): Promise<any> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === "fallback-secret") {
      console.error("JWT_SECRET not properly configured");
      return null;
    }

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error(
      "JWT verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

/**
 * Generate JWT token (Edge-compatible)
 */
export async function generateJWT(
  payload: any,
  expiresIn: string | number = "24h"
): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "fallback-secret") {
    throw new Error("JWT_SECRET not properly configured");
  }

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  // Convert expiresIn string to seconds (e.g., "24h" -> 86400)
  const expirationSeconds =
    typeof expiresIn === "string" ? parseExpiration(expiresIn) : expiresIn;

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationSeconds)
    .sign(secretKey);

  return jwt;
}

/**
 * Parse expiration string to seconds
 */
function parseExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 86400; // Default 24 hours

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 86400;
  }
}
