import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createReport, findReportsByTenant } from "@/lib/db";
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware";

export async function POST(request: NextRequest) {
     try {
          // Authenticate user and get tenant info
          const authResult = await authMiddleware(request);
          if (authResult instanceof NextResponse) {
               return authResult;
          }

          const { request: authenticatedRequest, user } = authResult;
          const tenantId = getTenantIdFromRequest(authenticatedRequest);
          
          if (!tenantId) {
               return NextResponse.json(
                    { error: "Tenant information not found" },
                    { status: 400 }
               );
          }

          const data = await request.json();

          const report = await createReport({
               tenantId: new ObjectId(tenantId),
               userId: new ObjectId(user.uid),
               date: data.date,
               content: data.content
          });

          return NextResponse.json({
               success: true,
               id: report._id?.toString(),
               report
          });
     } catch (error) {
          console.error("Report creation error:", error);
          return NextResponse.json(
               { error: "Failed to add report" },
               { status: 500 }
          );
     }
}

export async function GET(request: NextRequest) {
     try {
          // Authenticate user and get tenant info
          const authResult = await authMiddleware(request);
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

          const reports = await findReportsByTenant(new ObjectId(tenantId));

          return NextResponse.json({
               success: true,
               reports
          });
     } catch (error) {
          console.error("Report fetch error:", error);
          return NextResponse.json(
               { error: "Failed to fetch reports" },
               { status: 500 }
          );
     }
}
