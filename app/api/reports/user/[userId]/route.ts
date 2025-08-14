import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getReportsByUserId } from "@/lib/mock-data"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    // Try MongoDB first, fallback to mock data
    if (clientPromise) {
      try {
        // Convert userId to ObjectId if it's valid
        let userIdObj;
        if (ObjectId.isValid(userId)) {
          userIdObj = new ObjectId(userId);
        } else {
          // If it's not a valid ObjectId, try to find by string userId
          userIdObj = userId;
        }

        const client = await clientPromise;
        const db = client.db("daily-report");

        const userReports = await db
          .collection("reports")
          .find({ userId: userIdObj })
          .sort({ date: -1 })
          .toArray();

        return NextResponse.json({
          reports: userReports.map(report => ({
            ...report,
            id: report._id.toString(),
            _id: undefined
          })),
        })
      } catch (mongoError) {
        console.warn("MongoDB connection failed, using mock data:", mongoError);
      }
    }

    // Fallback to mock data
    const userReports = getReportsByUserId(userId);

    return NextResponse.json({
      reports: userReports,
    })
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
