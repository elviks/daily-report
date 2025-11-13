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

    const { currentPassword, newPassword } = await request.json();

    // CRITICAL SECURITY: Users can ONLY change their own password
    // The user ID comes from the authenticated JWT token, NOT from request body
    const authenticatedUserId = authUser.uid;

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        {
          message:
            "Password must contain uppercase, lowercase, numbers, and special characters",
        },
        { status: 400 }
      );
    }

    let user = null;
    let userFound = false;

    // Find user in database - ONLY the authenticated user
    try {
      const client = await clientPromise;
      if (client) {
        const db = client.db("daily-report");
        const usersCol = db.collection("users");
        const idFilter = ObjectId.isValid(authenticatedUserId)
          ? new ObjectId(authenticatedUserId)
          : authenticatedUserId;
        const filter = {
          $or: [{ _id: idFilter }, { id: authenticatedUserId }],
          tenantId: new ObjectId(tenantId),
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
      return NextResponse.json(
        { message: "User not found in this company" },
        { status: 404 }
      );
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.password)) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Update password in database - ONLY for authenticated user
    try {
      const client = await clientPromise;
      if (client) {
        const db = client.db("daily-report");
        const usersCol = db.collection("users");
        const idFilter = ObjectId.isValid(authenticatedUserId)
          ? new ObjectId(authenticatedUserId)
          : authenticatedUserId;
        const filter = {
          $or: [{ _id: idFilter }, { id: authenticatedUserId }],
          tenantId: new ObjectId(tenantId),
        };

        await usersCol.updateOne(filter, {
          $set: {
            password: hashPassword(newPassword),
            updatedAt: new Date(),
          },
        });
      }
    } catch (dbError) {
      console.error("Password change failed:", dbError);
      return NextResponse.json(
        { message: "Failed to change password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
