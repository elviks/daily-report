import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user and get tenant info
    const authResult = await adminAuthMiddleware(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { request: authenticatedRequest } = authResult;
    const tenantId = getTenantIdFromRequest(authenticatedRequest);
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant information not found" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    if (!client) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
    const db = client.db("daily-report");

    // Get all non-admin users for this tenant
    const users = await db.collection("users")
      .find({
        tenantId: new ObjectId(tenantId),
        isAdmin: { $ne: true },
        isActive: { $ne: false }
      })
      .sort({ name: 1 })
      .project({
        _id: 1,
        name: 1,
        email: 1,
        department: 1,
        role: 1
      })
      .toArray();

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      }))
    });

  } catch (error) {
    console.error("Error fetching non-admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
