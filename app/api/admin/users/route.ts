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

          // Fix any existing users with "superadmin" role
          try {
               const result = await db.collection("users").updateMany(
                    { role: "superadmin" },
                    { $set: { role: "user" } }
               );
               if (result.modifiedCount > 0) {
                    console.log(`Fixed ${result.modifiedCount} users with superadmin role`);
               }
          } catch (fixError) {
               console.warn("Could not fix existing superadmin users:", fixError);
          }

          const users = await db
               .collection("users")
               .aggregate([
                    {
                         $project: {
                              _id: 0,
                              id: { $ifNull: ["$id", { $toString: "$_id" }] },
                              name: 1,
                              email: 1,
                              role: {
                                   $cond: {
                                        if: { $in: ["$role", ["user", "admin"]] },
                                        then: "$role",
                                        else: "user"
                                   }
                              },
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

          // Debug logging
          console.log("Received user data:", { name, email, department, phone, role });

          // Validation
          if (!name || !email || !password || !department) {
               return NextResponse.json(
                    { error: "Name, email, password, and department are required" },
                    { status: 400 }
               );
          }

          // Ensure role is set to "user" by default, not "superadmin"
          const userRole = role === "admin" ? "admin" : "user";
          console.log("Final role assignment:", userRole);

          // Check if user already exists in mock data
          const existingUser = getUserByEmail(email);
          if (existingUser) {
               return NextResponse.json(
                    { error: "User with this email already exists" },
                    { status: 409 }
               );
          }



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

                    // Generate unique ID for database
                    const existingUsers = await usersCol.find({}).toArray();
                    const existingIds = existingUsers.map(u => parseInt(u.id || "0")).sort((a, b) => a - b);
                    let newId = 1;

                    for (const id of existingIds) {
                         if (id === newId) {
                              newId++;
                         } else {
                              break;
                         }
                    }

                    const uniqueId = newId.toString();
                    console.log("Creating user with unique ID:", uniqueId);

                    // Insert new user with unique database ID
                    const userToInsert = {
                         id: uniqueId,
                         name,
                         email,
                         password, // In production, this should be hashed
                         role: userRole, // Use the properly assigned role
                         department,
                         phone: phone || "",
                         profileImage: "",
                         createdAt: new Date(),
                    };

                    console.log("Inserting user with role:", userToInsert.role);
                    await usersCol.insertOne(userToInsert);

                    // Return user with database-generated ID
                    const userWithoutPassword = {
                         id: uniqueId,
                         name,
                         email,
                         role: userRole, // Use the properly assigned role
                         department,
                         phone: phone || "",
                         profileImage: "",
                         createdAt: new Date().toISOString(),
                    };

                    return NextResponse.json({
                         message: "User created successfully",
                         user: userWithoutPassword,
                    }, { status: 201 });
               }
          } catch (dbError) {
               console.warn("Failed to persist user to database:", dbError);
               // Fallback to mock data only if database fails
               const newUser = addUser({
                    name,
                    email,
                    password, // In production, this should be hashed
                    role: userRole, // Use the properly assigned role
                    department,
                    phone: phone || "",
                    profileImage: "",
                    createdAt: new Date().toISOString(),
               });

               const { password: _, ...userWithoutPassword } = newUser;
               return NextResponse.json({
                    message: "User created successfully (mock data only)",
                    user: userWithoutPassword,
               }, { status: 201 });
          }

     } catch (error) {
          console.error("Error creating user:", error);
          return NextResponse.json(
               { error: "Failed to create user" },
               { status: 500 }
          );
     }
}