import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { findReportsByTenant } from "@/lib/db";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";

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

          return NextResponse.json({ 
               reports: reports.map(report => ({
                    id: report._id?.toString(),
                    userId: report.userId?.toString(),
                    date: report.date,
                    content: report.content,
                    createdAt: report.createdAt,
                    updatedAt: report.updatedAt
               }))
          });
     } catch (error) {
          console.error("Error fetching reports:", error);
          return NextResponse.json({ reports: [] }, { status: 500 });
     }
}