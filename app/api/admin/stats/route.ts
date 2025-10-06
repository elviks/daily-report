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

          // Filter all queries by tenant ID
          const totalUsers = await db.collection("users").countDocuments({ 
               tenantId: new ObjectId(tenantId) 
          });
          const totalReports = await db.collection("reports").countDocuments({ 
               tenantId: new ObjectId(tenantId) 
          });

          // Get today's reports for this tenant
          const today = new Date().toISOString().split("T")[0];
          const reportsToday = await db
               .collection("reports")
               .countDocuments({ 
                    date: today,
                    tenantId: new ObjectId(tenantId)
               });

          // Get active users (non-admin users who submitted reports in last 7 days) for this tenant
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          // First get all non-admin user IDs for this tenant
          const nonAdminUsers = await db.collection("users").find({
               tenantId: new ObjectId(tenantId),
               isAdmin: { $ne: true }
          }).toArray();
          
          const nonAdminUserIds = nonAdminUsers.map(user => user._id);

          const activeUsers = await db
               .collection("reports")
               .distinct("userId", {
                    createdAt: { $gte: sevenDaysAgo },
                    tenantId: new ObjectId(tenantId),
                    userId: { $in: nonAdminUserIds }
               });

          return NextResponse.json({
               stats: {
                    totalUsers: totalUsers,
                    totalReports: totalReports,
                    reportsToday: reportsToday,
                    activeUsers: activeUsers.length,
               }
          });

     } catch (error) {
          console.error("Error fetching admin stats:", error);
          return NextResponse.json(
               {
                    stats: {
                         totalUsers: 0,
                         totalReports: 0,
                         reportsToday: 0,
                         activeUsers: 0,
                    }
               },
               { status: 500 }
          );
     }
}