import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { reports as mockReports } from "@/lib/mock-data";

export async function GET() {
    try {
        let dbReports: any[] = [];
        let dbStatus = "not available";

        // Try to get MongoDB reports
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("dailyreport");
                dbReports = await db.collection("reports").find({}).toArray();
                dbStatus = "available";
            }
        } catch (error) {
            dbStatus = `error: ${error}`;
        }

        return NextResponse.json({
            mockData: {
                reports: mockReports,
                count: mockReports.length,
                sample: mockReports.slice(0, 3)
            },
            database: {
                status: dbStatus,
                reports: dbReports,
                count: dbReports.length,
                sample: dbReports.slice(0, 3)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in debug endpoint:", error);
        return NextResponse.json(
            { error: "Failed to debug reports" },
            { status: 500 }
        );
    }
}
