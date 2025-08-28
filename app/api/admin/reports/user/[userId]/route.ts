import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";

export async function GET(
     request: NextRequest,
     { params }: { params: { userId: string } }
) {
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
          if (client) {
               const db = client.db("daily-report");
               const userId = params.userId;
               const userIdObj = ObjectId.isValid(userId)
                    ? new ObjectId(userId)
                    : userId;
               
               // Filter reports by both userId and tenantId
               const reports = await db
                    .collection("reports")
                    .find({ 
                         userId: userIdObj,
                         tenantId: new ObjectId(tenantId)
                    })
                    .sort({ date: -1 })
                    .toArray();
               
               return NextResponse.json({
                    reports: Array.isArray(reports)
                         ? reports.map((report: any) => ({
                              ...report,
                              id: report._id?.toString?.() || String(report._id),
                              _id: undefined,
                         }))
                         : [],
               });
          }
          
          return NextResponse.json({ reports: [] });
     } catch (error) {
          console.error(error);
          return NextResponse.json(
               { reports: [] },
               { status: 500 }
          );
     }
}
