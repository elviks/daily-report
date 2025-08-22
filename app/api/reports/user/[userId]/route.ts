import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    console.log("API: Fetching reports for userId:", userId)

    // Check if MongoDB connection is available
    if (!clientPromise) {
      console.error("API: MongoDB connection not initialized");
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 503 }
      );
    }

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

      console.log(`API: Found ${userReports.length} reports for user ${userId}`);

      return NextResponse.json({
        reports: userReports.map(report => ({
          ...report,
          id: report._id.toString(),
          _id: undefined
        })),
      })
    } catch (mongoError) {
      console.error("MongoDB connection failed:", mongoError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
