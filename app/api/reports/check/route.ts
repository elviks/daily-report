import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
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

          const { searchParams } = new URL(request.url);
          const userId = searchParams.get('userId');
          const date = searchParams.get('date');

          if (!userId || !date) {
               return NextResponse.json(
                    { error: "Missing userId or date parameter" },
                    { status: 400 }
               );
          }

          const client = await clientPromise;
          if (!client) {
               return NextResponse.json(
                    { error: "Database client not available" },
                    { status: 500 }
               );
          }
          const db = client.db("daily-report");

          // Convert userId to ObjectId if it's valid, otherwise keep as string
          const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

          const report = await db.collection("reports").findOne({ 
               userId: userIdObj, 
               date,
               tenantId: new ObjectId(tenantId)
          });

          return NextResponse.json({ exists: !!report, report: report || null });
     } catch (error) {
          console.error("Error in check endpoint:", error);
          return NextResponse.json({ error: "Failed to check report" }, { status: 500 });
     }
}

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

          const { userId, date } = await request.json();

          const client = await clientPromise;
          if (!client) {
               return NextResponse.json(
                    { error: "Database client not available" },
                    { status: 500 }
               );
          }
          const db = client.db("daily-report");

          // Convert userId to ObjectId if it's valid, otherwise keep as string
          const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

          const report = await db.collection("reports").findOne({ 
               userId: userIdObj, 
               date,
               tenantId: new ObjectId(tenantId)
          });

          return NextResponse.json({ exists: !!report, report: report || null });
     } catch (error) {
          console.error("Error in check endpoint:", error);
          return NextResponse.json({ error: "Failed to check report" }, { status: 500 });
     }
}