import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const client = await clientPromise;
        if (!client) {
            throw new Error("Database client is not available");
        }
        const db = client.db("daily-report");

        const userId = params.id;
        const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

        // First check if user exists and get their role
        const user = await db.collection("users").findOne({
            $or: [{ _id: userIdObj }, { id: userId }]
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Prevent deletion of superadmin users
        if (user.role === "superadmin") {
            return NextResponse.json({ error: "Cannot delete superadmin users" }, { status: 403 });
        }

        // Delete all reports by this user
        await db.collection("reports").deleteMany({
            userId: { $in: [userIdObj, userId] }
        });

        // Delete the user
        await db.collection("users").deleteOne({
            $or: [{ _id: userIdObj }, { id: userId }]
        });

        return NextResponse.json({ success: true, message: "User and all reports deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
