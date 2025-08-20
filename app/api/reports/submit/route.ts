import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
     try {
          const data = await request.json();

          // Validate incoming data
          if (!data.userId || !data.content || !data.date) {
               return NextResponse.json(
                    {
                         error: "Missing required fields: userId, date or content",
                    },
                    { status: 400 }
               );
          }

          // Prepare identifiers
          const originalUserId: string = data.userId;
          const normalizedDate: string = data.date;

          // Convert userId to ObjectId if it's valid, otherwise keep as string (for MongoDB queries)
          const mongoUserId = ObjectId.isValid(originalUserId)
               ? new ObjectId(originalUserId)
               : originalUserId;

          // Try MongoDB first
          try {
               const client = await clientPromise;
               if (client) {
                    const db = client.db("dailyreport");
                    const reportsCol = db.collection("reports");

                    // Check existing report for this user and date
                    const existing = await reportsCol.findOne({
                         userId: mongoUserId,
                         date: normalizedDate,
                    });

                    if (existing) {
                         await reportsCol.updateOne(
                              { _id: existing._id },
                              { $set: { content: data.content, updatedAt: new Date() } }
                         );
                         return NextResponse.json({ success: true, id: existing._id.toString(), updated: true });
                    }

                    // Insert new report
                    const insertResult = await reportsCol.insertOne({
                         userId: mongoUserId,
                         content: data.content,
                         date: normalizedDate,
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