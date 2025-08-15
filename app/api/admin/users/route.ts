import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { users, addUser, getUserByEmail } from "@/lib/mock-data";

export async function GET() {
     try {
          const client = await clientPromise;
          if (!client) {
               throw new Error("Database client is not available");
          }
          const db = client.db("daily-report");
          const users = await db
               .collection("users")
               .aggregate([
                    {
                         $project: {
                              _id: 0,
                              id: { $ifNull: ["$id", { $toString: "$_id" }] },
                              name: 1,
                              email: 1,
                              role: { $ifNull: ["$role", "user"] },
                              department: { $ifNull: ["$department", ""] },
                              phone: { $ifNull: ["$phone", ""] },
                              profileImage: { $ifNull: ["$profileImage", ""] },
                              createdAt: { $ifNull: ["$createdAt", new Date()] },
                         },
                    },
               ])
               .toArray();
          return NextResponse.json({ users });
     } catch (error) {
          console.error("Error fetching users:", error);
          return NextResponse.json(
               { users: [] },
               { status: 500 }
          );
     }
}

export async function POST(request: Request) {
     try {
          const { name, email, password, department, phone, role } = await request.json();

          // Validation
          if (!name || !email || !password || !department) {
               return NextResponse.json(
                    { error: "Name, email, password, and department are required" },
                    { status: 400 }
               );
          }

          // Check if user already exists in mock data
          const existingUser = getUserByEmail(email);
          if (existingUser) {
               return NextResponse.json(
                    { error: "User with this email already exists" },
                    { status: 409 }
               );
          }

          // Create new user using helper function
          const newUser = addUser({
               name,
               email,
               password, // In production, this should be hashed
               role: role || "user",
               department,
               phone: phone || "",
               profileImage: "",
               createdAt: new Date().toISOString(),
          });

          // Try to persist to MongoDB if configured
          try {
               const client = await clientPromise;
               if (client) {
                    const db = client.db("daily-report");
                    const usersCol = db.collection("users");

                    // Check if user already exists in DB
                    const existingDbUser = await usersCol.findOne({ email });
                    if (existingDbUser) {
                         // Remove from mock data since DB already has this user
                         const { removeUserByEmail } = await import("@/lib/mock-data");
                         removeUserByEmail(email);

                         return NextResponse.json(
                              { error: "User with this email already exists in database" },
                              { status: 409 }
                         );
                    }

                    // Insert new user
                    await usersCol.insertOne({
                         id: newUser.id,
                         name,
                         email,
                         password, // In production, this should be hashed
                         role: role || "user",
                         department,
                         phone: phone || "",
                         profileImage: "",
                         createdAt: new Date(),
                    });
               }
          } catch (dbError) {
               console.warn("Failed to persist user to database:", dbError);
               // Continue with mock data only
          }

          // Return user without password
          const { password: _, ...userWithoutPassword } = newUser;

          return NextResponse.json({
               message: "User created successfully",
               user: userWithoutPassword,
          }, { status: 201 });

     } catch (error) {
          console.error("Error creating user:", error);
          return NextResponse.json(
               { error: "Failed to create user" },
               { status: 500 }
          );
     }
}