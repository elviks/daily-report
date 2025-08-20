import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { users as mockUsers } from "@/lib/mock-data";

export async function GET() {
    try {
        let dbUsers: any[] = [];
        let dbStatus = "not available";

        // Try to get MongoDB users
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("dailyreport");
                dbUsers = await db.collection("users").find({}).toArray();
                dbStatus = "available";
            }
        } catch (error) {
            dbStatus = `error: ${error}`;
        }

        return NextResponse.json({
            mockData: {
                users: mockUsers,
                count: mockUsers.length,
                sample: mockUsers.slice(0, 3)
            },
            database: {
                status: dbStatus,
                users: dbUsers,
                count: dbUsers.length,
                sample: dbUsers.slice(0, 3)
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error in debug users endpoint:", error);
        return NextResponse.json(
            { error: "Failed to debug users" },
            { status: 500 }
        );
    }
}
