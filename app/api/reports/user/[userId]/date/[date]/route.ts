import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware"

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string; date: string } }
) {
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

        const { userId, date } = params
        console.log("API: Fetching report for userId:", userId, "date:", date)

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

            const report = await db
                .collection("reports")
                .findOne({
                    userId: userIdObj,
                    date: date,
                    tenantId: new ObjectId(tenantId)
                });

            if (!report) {
                console.log(`API: No report found for user ${userId} on date ${date}`);
                return NextResponse.json({ report: null });
            }

            console.log(`API: Found report for user ${userId} on date ${date}`);

            return NextResponse.json({
                report: {
                    ...report,
                    id: report._id.toString(),
                    _id: undefined
                },
            })
        } catch (mongoError) {
            console.error("MongoDB connection failed:", mongoError);
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 503 }
            );
        }
    } catch (error) {
        console.error("Error fetching user report for date:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 })
    }
}
