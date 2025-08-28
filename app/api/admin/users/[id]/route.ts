import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";

export async function DELETE(
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
        let userFound = false;
        let userRole = "";

        // Check if user exists in database and belongs to this tenant
        let dbUser = null;
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

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

                if (dbUser) {
                    userFound = true;
                    userRole = dbUser.role;

                    // Prevent deletion of superadmin users
                    if (dbUser.role === "superadmin") {
                        return NextResponse.json({ error: "Cannot delete superadmin users" }, { status: 403 });
                    }

                    // Delete all reports by this user in this tenant
                    await db.collection("reports").deleteMany({
                        userId: { $in: [userIdObj, userId] },
                        tenantId: new ObjectId(tenantId)
                    });

                    // Delete the user from database
                    if (ObjectId.isValid(userId)) {
                        await db.collection("users").deleteOne({ 
                            _id: new ObjectId(userId),
                            tenantId: new ObjectId(tenantId)
                        });
                    } else {
                        await db.collection("users").deleteOne({ 
                            id: userId,
                            tenantId: new ObjectId(tenantId)
                        });
                    }
                }
            }
        } catch (dbError) {
            console.warn("Database operation failed:", dbError);
        }

        if (!userFound) {
            return NextResponse.json({ error: "User not found in this company" }, { status: 404 });
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
