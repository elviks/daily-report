import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
     try {
          const userId = params.userId

          // Convert userId to ObjectId if it's valid
          let userIdObj;
          if (ObjectId.isValid(userId)) {
               userIdObj = new ObjectId(userId);
          } else {
               userIdObj = userId;
          }

          const client = await clientPromise;
          if (!client) {
               throw new Error("Database client is not available");
          }
          const db = client.db("daily-report");

          const userReports = await db
               .collection("reports")
               .find({ userId: userIdObj })
               .sort({ date: -1 })
               .limit(10)
               .toArray();

          return NextResponse.json({
               reports: userReports.map(report => ({
                    ...report,
                    id: report._id.toString(),
                    _id: undefined
               })),
          })
     } catch (error) {
          console.error("Error fetching user reports:", error);
          return NextResponse.json({ reports: [] }, { status: 500 })
     }
}