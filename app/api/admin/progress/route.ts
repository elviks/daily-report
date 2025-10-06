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
      throw new Error("Database client is null");
    }
    const db = client.db("daily-report");

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get total active non-admin users for this tenant
    const totalUsers = await db.collection("users").countDocuments({
      tenantId: new ObjectId(tenantId),
      isActive: { $ne: false }, // Include users where isActive is not explicitly false
      isAdmin: { $ne: true } // Exclude admin users
    });

    // Get non-admin users who submitted reports today
    const nonAdminUsers = await db.collection("users").find({
      tenantId: new ObjectId(tenantId),
      isAdmin: { $ne: true }
    }).toArray();
    
    const nonAdminUserIds = nonAdminUsers.map(user => user._id);
    
    const submittedToday = await db.collection("reports").distinct("userId", {
      date: today,
      tenantId: new ObjectId(tenantId),
      userId: { $in: nonAdminUserIds }
    });

    // Calculate progress percentage
    const submittedCount = submittedToday.length;
    const pendingCount = Math.max(0, totalUsers - submittedCount);
    const progressPercentage = totalUsers > 0 ? Math.round((submittedCount / totalUsers) * 100) : 0;

    // Get recent submissions (last 5) from non-admin users only
    const recentSubmissions = await db.collection("reports")
      .aggregate([
        {
          $match: {
            tenantId: new ObjectId(tenantId),
            date: today,
            userId: { $in: nonAdminUserIds }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $match: {
            "user.isAdmin": { $ne: true }
          }
        },
        {
          $project: {
            _id: 1,
            date: 1,
            content: 1,
            createdAt: 1,
            userName: "$user.name",
            userEmail: "$user.email"
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 5
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      progress: {
        totalUsers,
        submittedCount,
        pendingCount,
        progressPercentage,
        status: submittedCount === totalUsers ? "All reports submitted" : 
                submittedCount > 0 ? "Reports submitted" : "No reports yet",
        recentSubmissions
      }
    });

  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}
