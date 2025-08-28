import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
    try {
        // Authenticate user and get tenant info
        const authResult = await authMiddleware(request);
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

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

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

        const notifications = await db
            .collection("notifications")
            .find({ 
                userId: userIdObj,
                tenantId: new ObjectId(tenantId)
            })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate user and get tenant info
        const authResult = await authMiddleware(request);
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

        const data = await request.json();
        const { userId, message, type, date, isSeen = false } = data;

        if (!userId || !message || !type || !date) {
            return NextResponse.json(
                { error: "Missing required fields" },
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

        // Check if notification already exists for this user, type, and date
        const existingNotification = await db
            .collection("notifications")
            .findOne({
                userId: userIdObj,
                type,
                date,
                tenantId: new ObjectId(tenantId)
            });

        if (existingNotification) {
            // Update existing notification
            await db.collection("notifications").updateOne(
                { _id: existingNotification._id },
                {
                    $set: {
                        message,
                        isSeen,
                        updatedAt: new Date(),
                    },
                }
            );
            return NextResponse.json({
                success: true,
                id: existingNotification._id.toString(),
                updated: true,
            });
        }

        // Create new notification
        const result = await db.collection("notifications").insertOne({
            userId: userIdObj,
            message,
            type,
            date,
            isSeen,
            tenantId: new ObjectId(tenantId),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            id: result.insertedId.toString(),
            created: true,
        });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Authenticate user and get tenant info
        const authResult = await authMiddleware(request);
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

        const data = await request.json();
        const { notificationId, isSeen } = data;

        if (!notificationId || typeof isSeen !== 'boolean') {
            return NextResponse.json(
                { error: "Missing required fields" },
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
        const notificationIdObj = ObjectId.isValid(notificationId)
            ? new ObjectId(notificationId)
            : notificationId;

        const result = await db.collection("notifications").updateOne(
            { 
                _id: notificationIdObj,
                tenantId: new ObjectId(tenantId)
            },
            {
                $set: {
                    isSeen,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: "Notification not found in this company" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
