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

    // Get period from query parameters
    const { searchParams } = new URL(authenticatedRequest.url);
    const period = searchParams.get('period') || 'This Week';

    const client = await clientPromise;
    if (!client) {
      throw new Error("Database client is null");
    }
    const db = client.db("daily-report");

    // Calculate date range based on period
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    let days: string[] = [];

    switch (period) {
      case 'Last Week':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() - 7); // End of last week
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6); // Start of last week
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        // Generate days for this month
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          days.push(d.toISOString().split('T')[0]);
        }
        break;
      case 'This Week':
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6); // Include today, so 6 days ago
        endDate = new Date(today);
        // Generate array of last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          days.push(date.toISOString().split('T')[0]);
        }
        break;
    }

    // If days array is empty (for This Month), generate it
    if (days.length === 0) {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push(d.toISOString().split('T')[0]);
      }
    }

    // Get all non-admin user IDs for this tenant (do this once for efficiency)
    const nonAdminUsers = await db.collection("users").find({
      tenantId: new ObjectId(tenantId),
      isAdmin: { $ne: true }
    }).toArray();
    
    const nonAdminUserIds = nonAdminUsers.map(user => user._id);

    // Get report counts for each day (excluding admin users)
    const chartData = await Promise.all(
      days.map(async (date) => {
        const count = await db.collection("reports").countDocuments({
          date: date,
          tenantId: new ObjectId(tenantId),
          userId: { $in: nonAdminUserIds }
        });
        
        return {
          date,
          count,
          dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: new Date(date).getDate()
        };
      })
    );

    // Calculate total reports for the period
    const totalReports = chartData.reduce((sum, day) => sum + day.count, 0);

    // Calculate average reports per day
    const averageReports = days.length > 0 ? Math.round((totalReports / days.length) * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        chartData,
        totalReports,
        averageReports,
        period,
        daysCount: days.length,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      }
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
