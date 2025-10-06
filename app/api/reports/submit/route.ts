import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/db";

// Custom auth function that bypasses rate limiting
async function authWithoutRateLimit(request: NextRequest) {
     try {
          const authHeader = request.headers.get('authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
               return NextResponse.json(
                    { error: 'Authorization header required' },
                    { status: 401 }
               );
          }
          
          const token = authHeader.substring(7);
          const payload = verifyJWT(token);
          
          if (!payload) {
               return NextResponse.json(
                    { error: 'Invalid or expired token' },
                    { status: 401 }
               );
          }
          
          return { user: payload, tenantId: payload.tid };
     } catch (error) {
          return NextResponse.json(
               { error: 'Authentication failed' },
               { status: 401 }
          );
     }
}

export async function POST(request: NextRequest) {
     try {
          // Authenticate user without rate limiting
          const authResult = await authWithoutRateLimit(request);
          if (authResult instanceof NextResponse) {
               return authResult;
          }

          const { user, tenantId } = authResult;
          
          if (!tenantId) {
               return NextResponse.json(
                    { error: "Tenant information not found" },
                    { status: 400 }
               );
          }

          const data = await request.json();

          // Validate incoming data
          if (!data.content || !data.date) {
               return NextResponse.json(
                    {
                         error: "Missing required fields: date or content",
                    },
                    { status: 400 }
               );
          }

          // Validate photos if provided
          const photos = data.photos || [];
          if (photos.length > 10) {
               return NextResponse.json(
                    {
                         error: "Maximum 10 photos allowed per report",
                    },
                    { status: 400 }
               );
          }

          // Use the authenticated user's ID from the token
          const originalUserId: string = user.uid;
          const normalizedDate: string = data.date;

          // Convert userId to ObjectId if it's valid, otherwise keep as string (for MongoDB queries)
          const mongoUserId = ObjectId.isValid(originalUserId)
               ? new ObjectId(originalUserId)
               : originalUserId;

          // Try MongoDB first
          try {
               const client = await clientPromise;
               if (client) {
                    const db = client.db("daily-report");
                    const reportsCol = db.collection("reports");

                    // Check existing report for this user and date
                    const existing = await reportsCol.findOne({
                         userId: mongoUserId,
                         date: normalizedDate,
                         tenantId: new ObjectId(tenantId)
                    });

                    if (existing) {
                         await reportsCol.updateOne(
                              { _id: existing._id },
                              { $set: { content: data.content, photos: photos, updatedAt: new Date() } }
                         );
                         return NextResponse.json({ success: true, id: existing._id.toString(), updated: true });
                    }

                    // Insert new report
                    const insertResult = await reportsCol.insertOne({
                         userId: mongoUserId,
                         content: data.content,
                         photos: photos,
                         date: normalizedDate,
                         tenantId: new ObjectId(tenantId),
                         createdAt: new Date(),
                         updatedAt: new Date(),
                    });
                    return NextResponse.json({ success: true, id: insertResult.insertedId, created: true });
               }
          } catch (dbError) {
               // Fall through to mock fallback if Mongo isn't available
               // console.warn("DB not available, using mock fallback", dbError);
          }

          // CRITICAL: Mock data fallback disabled for security
          // Reports must be stored in database to maintain user isolation
          console.error("SUBMIT: Database not available - cannot store report securely");
          return NextResponse.json(
               { error: "Database not available - cannot store report securely" },
               { status: 503 }
          );
     } catch (error) {
          console.error("Error submitting report:", error);
          return NextResponse.json(
               { error: "Failed to submit report" },
               { status: 500 }
          );
     }
}