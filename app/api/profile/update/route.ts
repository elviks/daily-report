import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware"
import { verifyPassword } from "@/lib/db"

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

    const { id, name, email, phone, department, currentPassword, profileImage } = await request.json()

    // Find user in database within the same tenant
    let user = null;
    let userFound = false;

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
      return NextResponse.json({ message: "User not found in this company" }, { status: 404 })
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.password)) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 })
    }

    // Check if email is being changed and if it conflicts with another user in the same tenant
    if (email !== user.email) {
      try {
        const client = await clientPromise;
        if (client) {
          const db = client.db("daily-report");
          const usersCol = db.collection("users");
          const dbUserWithEmail = await usersCol.findOne({ 
            email, 
            _id: { $ne: new ObjectId(id) },
            tenantId: new ObjectId(tenantId)
          });
          if (dbUserWithEmail) {
            return NextResponse.json({ message: "Email already in use by another user in this company" }, { status: 409 })
          }
        }
      } catch (dbError) {
        console.warn("Database email check failed:", dbError);
      }
    }

    // Update user in database
    try {
      const client = await clientPromise
      if (client) {
        const db = client.db("daily-report")
        const usersCol = db.collection("users")
        const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id
        const filter = { 
          $or: [{ _id: idFilter }, { id }],
          tenantId: new ObjectId(tenantId)
        }
        await usersCol.updateOne(
          filter,
          {
            $set: {
              name,
              email,
              phone,
              department,
              profileImage: profileImage || "",
              updatedAt: new Date(),
            },
          }
        )
      }
    } catch (dbError) {
      console.error("Profile update failed:", dbError)
      return NextResponse.json({ message: "Failed to update profile" }, { status: 500 })
    }

    // Return updated user without password
    const { password: _, ...updatedUser } = user

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
