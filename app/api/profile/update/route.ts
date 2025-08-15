import { type NextRequest, NextResponse } from "next/server"
import { getUserById, getUserByEmail } from "@/lib/mock-data"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, phone, department, currentPassword, profileImage } = await request.json()

    let user = null;
    let userFound = false;

    // First try to find user in mock data
    user = getUserById(id);
    if (user) {
      userFound = true;
    }

    // If not found in mock data, try to find in database
    if (!userFound) {
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
    }

    if (!userFound || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 })
    }

    // Check if email is being changed and if it conflicts with another user
    if (email !== user.email) {
      // Check in mock data
      const existingUserWithEmail = getUserByEmail(email);
      if (existingUserWithEmail && existingUserWithEmail.id !== id) {
        return NextResponse.json({ message: "Email already in use by another user" }, { status: 409 })
      }

      // Check in database
      try {
        const client = await clientPromise;
        if (client) {
          const db = client.db("daily-report");
          const usersCol = db.collection("users");
          const dbUserWithEmail = await usersCol.findOne({ email, id: { $ne: id } });
          if (dbUserWithEmail) {
            return NextResponse.json({ message: "Email already in use by another user" }, { status: 409 })
          }
        }
      } catch (dbError) {
        console.warn("Database email check failed:", dbError);
      }
    }

    // Update user in mock data if user exists there
    const mockUser = getUserById(id);
    if (mockUser) {
      Object.assign(mockUser, {
        name,
        email,
        phone,
        department,
        profileImage: profileImage || "",
      });
    }

    // Try to persist to MongoDB if configured
    try {
      const client = await clientPromise
      if (client) {
        const db = client.db("daily-report")
        const usersCol = db.collection("users")
        const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id
        const filter = { $or: [{ _id: idFilter }, { id }] }
        await usersCol.updateOne(
          filter,
          {
            $set: {
              id: id, // keep string id if present
              name,
              email,
              phone,
              department,
              profileImage: profileImage || "",
              createdAt: user.createdAt || new Date().toISOString(),
              role: user.role || "user",
            },
          },
          { upsert: true }
        )
      }
    } catch (dbError) {
      // Non-fatal: continue with mock update only
      console.warn("Profile update persisted to mock store only:", dbError)
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
