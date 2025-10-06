import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { verifyJWT } from "@/lib/db";
import { isWorkingDay } from "@/lib/utils";

// Custom auth function
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

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
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

        const userId = user.uid;
        const mongoUserId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

        // Get the number of days to check from query params (default 30 days)
        const url = new URL(request.url);
        const daysToCheck = parseInt(url.searchParams.get('days') || '30', 10);

        // Calculate date range - from N days ago until yesterday
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - daysToCheck);
        
        // Only check until yesterday (not today)
        const endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);

        // Get all working days in the range
        const workingDays: string[] = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            if (isWorkingDay(currentDate)) {
                workingDays.push(currentDate.toISOString().split("T")[0]);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Get all reports from the user in this date range
        const client = await clientPromise;
        if (!client) {
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        const db = client.db("daily-report");
        const reportsCol = db.collection("reports");

        const existingReports = await reportsCol.find({
            userId: mongoUserId,
            tenantId: new ObjectId(tenantId),
            date: { $in: workingDays }
        }).toArray();

        // Find missing dates
        const submittedDates = new Set(existingReports.map(report => report.date));
        const missedDates = workingDays.filter(date => !submittedDates.has(date));

        // Sort missed dates in descending order (most recent first)
        missedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        return NextResponse.json({
            success: true,
            missedDates,
            totalWorkingDays: workingDays.length,
            totalSubmittedDays: existingReports.length,
            totalMissedDays: missedDates.length
        });

    } catch (error) {
        console.error("Error fetching missed reports:", error);
        return NextResponse.json(
            { error: "Failed to fetch missed reports" },
            { status: 500 }
        );
    }
}
