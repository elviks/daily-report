import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId parameter" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        if (!client) {
            return NextResponse.json(
                { error: "Database client not available" },
                { status: 500 }
            );
        }

        const db = client.db("daily-report");
        const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

        // Find all notifications for this user
        const notifications = await db
            .collection("notifications")
            .find({ userId: userIdObj })
            .toArray();

        // Group by type and date to find duplicates
        const groupedNotifications = new Map<string, any[]>();

        notifications.forEach(notification => {
            const key = `${notification.type}-${notification.date}`;
            if (!groupedNotifications.has(key)) {
                groupedNotifications.set(key, []);
            }
            groupedNotifications.get(key)!.push(notification);
        });

        let deletedCount = 0;

        // Remove duplicates, keeping only the most recent one
        for (const [key, duplicates] of groupedNotifications) {
            if (duplicates.length > 1) {
                // Sort by creation date, keep the most recent
                duplicates.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.updatedAt || 0);
                    const dateB = new Date(b.createdAt || b.updatedAt || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                // Keep the first (most recent) one, delete the rest
                const toDelete = duplicates.slice(1);
                const deleteIds = toDelete.map(n => n._id);

                const result = await db.collection("notifications").deleteMany({
                    _id: { $in: deleteIds }
                });

                deletedCount += result.deletedCount;
                console.log(`Cleaned up ${result.deletedCount} duplicate notifications for ${key}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${deletedCount} duplicate notifications`,
            deletedCount
        });

    } catch (error) {
        console.error("Error cleaning up notifications:", error);
        return NextResponse.json(
            { error: "Failed to cleanup notifications" },
            { status: 500 }
        );
    }
}
