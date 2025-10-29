import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Authenticate admin user and get tenant info
        const authResult = await adminAuthMiddleware(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { request: authenticatedRequest } = authResult;
        const tenantId = getTenantIdFromRequest(authenticatedRequest);

        if (!tenantId) {
            return NextResponse.json(
                { error: "Tenant information not found" },
                { status: 400 }
            );
        }

        const userId = params.id;

        // Check if user exists in database and belongs to this tenant
        let dbUser = null;
        let userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");

                // Check if user exists in DB and belongs to this tenant
                if (ObjectId.isValid(userId)) {
                    dbUser = await db.collection("users").findOne({
                        _id: new ObjectId(userId),
                        tenantId: new ObjectId(tenantId)
                    });
                }
                if (!dbUser) {
                    dbUser = await db.collection("users").findOne({
                        id: userId,
                        tenantId: new ObjectId(tenantId)
                    });
                }

                if (!dbUser) {
                    return NextResponse.json({ error: "User not found in this company" }, { status: 404 });
                }

                // Prevent disabling superadmin users
                if (dbUser.role === "superadmin") {
                    return NextResponse.json({ error: "Cannot disable superadmin users" }, { status: 403 });
                }

                // Toggle the isActive status
                const newStatus = !dbUser.isActive;
                const updateData = {
                    isActive: newStatus,
                    updatedAt: new Date()
                };

                if (ObjectId.isValid(userId)) {
                    await db.collection("users").updateOne(
                        { _id: new ObjectId(userId), tenantId: new ObjectId(tenantId) },
                        { $set: updateData }
                    );
                } else {
                    await db.collection("users").updateOne(
                        { id: userId, tenantId: new ObjectId(tenantId) },
                        { $set: updateData }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: `User ${newStatus ? 'enabled' : 'disabled'} successfully`,
                    user: {
                        id: userId,
                        isActive: newStatus
                    }
                });
            }
        } catch (dbError) {
            console.warn("Database operation failed:", dbError);
            return NextResponse.json(
                { error: "Failed to toggle user status" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "User status toggled successfully"
        });
    } catch (error) {
        console.error("Error toggling user status:", error);
        return NextResponse.json(
            { error: "Failed to toggle user status" },
            { status: 500 }
        );
    }
}
