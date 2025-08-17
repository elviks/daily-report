import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    console.log("API: Fetching reports for userId:", userId)

    // Try MongoDB first, fallback to mock data
    if (clientPromise) {
      try {
        // Convert userId to ObjectId if it's valid
        let userIdObj;
        if (ObjectId.isValid(userId)) {
          userIdObj = new ObjectId(userId);
          console.log("API: Converted to ObjectId:", userIdObj)
        } else {
          // If it's not a valid ObjectId, try to find by string userId
          userIdObj = userId;
          console.log("API: Using string userId:", userIdObj)
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

    // CRITICAL: Mock data fallback disabled for security
    // Reports must be retrieved from database to maintain user isolation
    console.error("API: Database not available - cannot retrieve reports securely")
    return NextResponse.json(
      { error: "Database not available - cannot retrieve reports securely" },
      { status: 503 }
    )
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
