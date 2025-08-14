import { type NextRequest, NextResponse } from "next/server"
import { users } from "@/lib/mock-data"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, phone, department, currentPassword, profileImage } = await request.json()

    // Find user
    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify current password
    if (users[userIndex].password !== currentPassword) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 })
    }

    // Update user in mock store
    users[userIndex] = {
      ...users[userIndex],
      name,
      email,
      phone,
      department,
      profileImage,
    }

    // Try to persist to MongoDB if configured
    try {
      const client = await clientPromise
      if (client) {
        const db = client.db("daily-report")
        const usersCol = db.collection("users")
        const idFilter = ObjectId.isValid(id) ? new ObjectId(id) : id
        const filter = { $or: [{ _id: idFilter }, { email }] }
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
              createdAt: users[userIndex].createdAt || new Date().toISOString(),
              role: users[userIndex].role || "user",
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
    const { password: _, ...updatedUser } = users[userIndex]

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
