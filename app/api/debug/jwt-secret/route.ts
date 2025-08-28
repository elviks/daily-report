import { NextResponse } from "next/server";

export async function GET() {
  const jwtSecret = process.env.JWT_SECRET;
  
  return NextResponse.json({
    jwtSecretExists: !!jwtSecret,
    jwtSecretLength: jwtSecret?.length || 0,
    jwtSecretPreview: jwtSecret ? jwtSecret.substring(0, 10) + "..." : "Not set",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
