import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";
import { createReport, findUserById } from "@/lib/db";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { userId, date, content, reason } = body;

    // Validate required fields
    if (!userId || !date || !content) {
      return NextResponse.json(
        { error: "User ID, date, and content are required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Verify the user exists and belongs to the same tenant
    const targetUser = await findUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.tenantId.toString() !== tenantId) {
      return NextResponse.json(
        { error: "User does not belong to your organization" },
        { status: 403 }
      );
    }

    // Check if user is admin (admins shouldn't have reports submitted for them)
    if (targetUser.isAdmin) {
      return NextResponse.json(
        { error: "Cannot submit reports for admin users" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("daily-report");

    // Check if a report already exists for this user and date
    const existingReport = await db.collection("reports").findOne({
      userId: new ObjectId(userId),
      date: date,
      tenantId: new ObjectId(tenantId)
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "A report already exists for this user on this date" },
        { status: 409 }
      );
    }

    // Create the report with admin submission metadata
    const reportData = {
      tenantId: new ObjectId(tenantId),
      userId: new ObjectId(userId),
      date: date,
      content: content,
      submittedByAdmin: true,
      adminReason: reason || "Submitted by admin on behalf of employee",
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("reports").insertOne(reportData);

    // Get the created report with user info for response
    const createdReport = await db.collection("reports")
      .aggregate([
        {
          $match: { _id: result.insertedId }
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
          $project: {
            _id: 1,
            date: 1,
            content: 1,
            submittedByAdmin: 1,
            adminReason: 1,
            submittedAt: 1,
            createdAt: 1,
            userName: "$user.name",
            userEmail: "$user.email"
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      message: `Report successfully submitted for ${targetUser.name}`,
      report: createdReport[0]
    });

  } catch (error) {
    console.error("Error submitting admin report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}


