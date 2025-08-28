import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { findReportsByTenant } from "@/lib/db";
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

          // Get reports for this specific tenant only
          const reports = await findReportsByTenant(new ObjectId(tenantId));

          // Get user information for all reports
          const client = await clientPromise;
          const db = client.db("daily-report");
          const usersCollection = db.collection("users");

          // Get all unique user IDs from reports
          const userIds = [...new Set(reports.map(report => report.userId))];
          
          // Fetch user information
          const users = await usersCollection.find({
               _id: { $in: userIds.map(id => new ObjectId(id)) },
               tenantId: new ObjectId(tenantId)
          }).toArray();

          // Create a map of user ID to user data
          const userMap = new Map();
          users.forEach(user => {
               userMap.set(user._id.toString(), user);
          });

          return NextResponse.json({ 
               reports: reports.map(report => {
                    const user = userMap.get(report.userId?.toString());
                    return {
                         id: report._id?.toString(),
                         userId: report.userId?.toString(),
                         userName: user?.name || 'Unknown User',
                         userEmail: user?.email || 'No Email',
                         department: user?.department || 'No Department',
                         date: report.date,
                         content: report.content,
                         createdAt: report.createdAt,
                         updatedAt: report.updatedAt
                    };
               })
          });
     } catch (error) {
          console.error("Error fetching reports:", error);
          return NextResponse.json({ reports: [] }, { status: 500 });
     }
}