import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Authorization header required",
          received: authHeader
            ? "Header exists but not Bearer format"
            : "No authorization header",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    console.log("Debug: Token received:", token ? "Token exists" : "No token");
    console.log("Debug: Token length:", token?.length);
    console.log("Debug: Token preview:", token?.substring(0, 20) + "...");

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        {
          error: "Invalid or expired token",
          tokenExists: !!token,
          tokenLength: token?.length,
          tokenPreview: token?.substring(0, 20) + "...",
        },
        { status: 401 }
      );
    }

    console.log("Debug: JWT payload:", payload);

    // Check admin status
    const isAdmin =
      payload.isAdmin ||
      payload.role === "admin" ||
      payload.role === "superadmin";

    return NextResponse.json({
      success: true,
      payload: {
        uid: payload.uid,
        email: payload.email,
        role: payload.role,
        isAdmin: payload.isAdmin,
        tid: payload.tid,
      },
      adminCheck: {
        isAdmin: isAdmin,
        role: payload.role,
        isAdminFlag: payload.isAdmin,
      },
      tokenInfo: {
        exists: !!token,
        length: token?.length,
        preview: token?.substring(0, 20) + "...",
      },
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json(
      {
        error: "Authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
