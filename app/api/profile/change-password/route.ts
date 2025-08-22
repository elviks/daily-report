import { NextRequest, NextResponse } from "next/server";
import { users, getUserById } from "@/lib/mock-data";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
    try {
        const { id, currentPassword, newPassword } = await request.json();

        // Validation
        if (!id || !currentPassword || !newPassword) {
            return NextResponse.json(
                { message: "ID, current password, and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: "New password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        let user = null;
        let userFound = false;

        // First try to find user in database (prioritize database over mock data)
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const usersCol = db.collection("users");
                const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id;
                const filter = { $or: [{ _id: idFilter }, { id }] };

                const dbUser = await usersCol.findOne(filter);
                if (dbUser) {
                    user = {
                        id: dbUser.id || dbUser._id?.toString(),
                        name: dbUser.name,
                        email: dbUser.email,
                        password: dbUser.password,
                        role: dbUser.role,
                        department: dbUser.department,
                        phone: dbUser.phone,
                        profileImage: dbUser.profileImage,
                        createdAt: dbUser.createdAt,
                    };
                    userFound = true;
                }
            }
        } catch (dbError) {
            console.warn("Database lookup failed:", dbError);
        }

        // Only fallback to mock data if database lookup failed or no user found
        if (!userFound) {
            user = getUserById(id);
            if (user) {
                userFound = true;
            }
        }

        if (!userFound || !user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Verify current password
        if (user.password !== currentPassword) {
            return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
        }

        // Update password in mock data if user exists there
        const mockUser = getUserById(id);
        if (mockUser) {
            mockUser.password = newPassword;
        }

        // Try to persist to MongoDB if configured
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const usersCol = db.collection("users");
                const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id;
                const filter = { $or: [{ _id: idFilter }, { id }] };

                await usersCol.updateOne(
                    filter,
                    {
                        $set: {
                            password: newPassword,
                        },
                    }
                );
            }
        } catch (dbError) {
            console.warn("Password change persisted to mock store only:", dbError);
        }

        return NextResponse.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
