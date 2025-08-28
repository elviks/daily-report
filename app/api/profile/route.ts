import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware";

export async function POST(request: NextRequest) {
    try {
        // Authenticate user and get tenant info
        const authResult = await authMiddleware(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { request: authenticatedRequest, user } = authResult;
        const tenantId = getTenantIdFromRequest(authenticatedRequest);
        
        if (!tenantId) {
            return NextResponse.json(
                { error: "Tenant information not found" },
                { status: 400 }
            );
        }

        const { id, email } = await request.json();
        if (!id && !email) {
            return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
        }

        let userData = null;
        let userFound = false;

        // Find user in database within the same tenant
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const users = db.collection("users");
                
                let query = { tenantId: new ObjectId(tenantId) };
                if (id) {
                    query = { ...query, $or: [{ id }, { _id: ObjectId.isValid(id) ? new ObjectId(id) : null }] };
                } else if (email) {
                    query = { ...query, email };
                }

                const dbUser = await users.findOne(query);

                if (dbUser) {
                    userData = {
                        id: dbUser._id?.toString(),
                        name: dbUser.name,
                        email: dbUser.email,
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

        if (!userFound || !userData) {
            return NextResponse.json({ user: null }, { status: 404 });
        }

        return NextResponse.json({ user: userData });

    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
