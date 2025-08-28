import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware";
import { verifyPassword, hashPassword } from "@/lib/db";

export async function PUT(request: NextRequest) {
    try {
        // Authenticate user and get tenant info
        const authResult = await authMiddleware(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { request: authenticatedRequest, user: authUser } = authResult;
        const tenantId = getTenantIdFromRequest(authenticatedRequest);
        
        if (!tenantId) {
            return NextResponse.json(
                { error: "Tenant information not found" },
                { status: 400 }
            );
        }

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

        // Find user in database within the same tenant
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const usersCol = db.collection("users");
                const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id;
                const filter = { 
                    $or: [{ _id: idFilter }, { id }],
                    tenantId: new ObjectId(tenantId)
                };

                const dbUser = await usersCol.findOne(filter);
                if (dbUser) {
                    user = {
                        id: dbUser._id?.toString(),
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

        if (!userFound || !user) {
            return NextResponse.json({ message: "User not found in this company" }, { status: 404 });
        }

        // Verify current password
        if (!verifyPassword(currentPassword, user.password)) {
            return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
        }

        // Update password in database
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const usersCol = db.collection("users");
                const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id;
                const filter = { 
                    $or: [{ _id: idFilter }, { id }],
                    tenantId: new ObjectId(tenantId)
                };

                await usersCol.updateOne(
                    filter,
                    {
                        $set: {
                            password: hashPassword(newPassword),
                            updatedAt: new Date(),
                        },
                    }
                );
            }
        } catch (dbError) {
            console.error("Password change failed:", dbError);
            return NextResponse.json({ message: "Failed to change password" }, { status: 500 });
        }

        return NextResponse.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
