import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        if (!client) {
            return NextResponse.json(
                { error: "Database client not available" },
                { status: 500 }
            );
        }

        const db = client.db("dailyreport");

        // Get all notifications
        const notifications = await db
            .collection("notifications")
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        // Get all reports
        const reports = await db
            .collection("reports")
            .find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray();

        return NextResponse.json({
            notifications: notifications.map(n => ({
                ...n,
                id: n._id.toString(),
                _id: undefined
            })),
            reports: reports.map(r => ({
                ...r,
                id: r._id.toString(),
                _id: undefined
            })),
            collections: await db.listCollections().toArray()
        });
    } catch (error) {
        console.error("Error in test endpoint:", error);
        return NextResponse.json(
            { error: "Failed to test notifications" },
            { status: 500 }
        );
    }
}
