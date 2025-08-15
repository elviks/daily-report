import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { removeUserById, getUserById } from "@/lib/mock-data";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        let userFound = false;
        let userRole = "";

        // First check if user exists in mock data
        const mockUser = getUserById(userId);
        if (mockUser) {
            userFound = true;
            userRole = mockUser.role;

            // Prevent deletion of superadmin users
            if (mockUser.role === "superadmin") {
                return NextResponse.json({ error: "Cannot delete superadmin users" }, { status: 403 });
            }
        }

        // Try to delete from MongoDB if configured
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

                // Check if user exists in DB
                let dbUser = null;
                if (ObjectId.isValid(userId)) {
                    dbUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
                }
                if (!dbUser) {
                    dbUser = await db.collection("users").findOne({ id: userId });
                }

                if (dbUser) {
                    userFound = true;
                    userRole = dbUser.role;

                    // Prevent deletion of superadmin users
                    if (dbUser.role === "superadmin") {
                        return NextResponse.json({ error: "Cannot delete superadmin users" }, { status: 403 });
                    }

                    // Delete all reports by this user
                    await db.collection("reports").deleteMany({
                        userId: { $in: [userIdObj, userId] }
                    });

                    // Delete the user from database
                    if (ObjectId.isValid(userId)) {
                        await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
                    } else {
                        await db.collection("users").deleteOne({ id: userId });
                    }
                }
            }
        } catch (dbError) {
            console.warn("Database operation failed:", dbError);
            // Continue with mock data only if database fails
        }

        // Remove user from mock data
        if (userFound) {
            const removed = removeUserById(userId);
            if (!removed) {
                console.warn(`Failed to remove user ${userId} from mock data`);
            }
        }

        if (!userFound) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "User and all reports deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
