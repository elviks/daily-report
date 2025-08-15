import {
     type NextRequest,
     NextResponse,
} from "next/server";
import { getUserByEmail } from "@/lib/mock-data";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
     try {
          const { email, password } = await request.json();

          let user = null;
          let userFound = false;

          // First try to find user by email in mock data
          user = getUserByEmail(email);
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
                         const dbUser = await usersCol.findOne({ email });

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

          if (!userFound || !user || user.password !== password) {
               return NextResponse.json(
                    {
                         message: "Invalid email or password",
                    },
                    { status: 401 }
               );
          }

          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;

          // Try to enrich with DB-stored profile image (if exists)
          try {
               const client = await clientPromise;
               if (client) {
                    const db = client.db("daily-report");
                    const usersCol = db.collection("users");
                    const dbUser = await usersCol.findOne({ email });
                    if (dbUser && dbUser.profileImage) {
                         (userWithoutPassword as any).profileImage = dbUser.profileImage as string;
                    }
                    if (dbUser && dbUser.phone && !userWithoutPassword.phone) {
                         (userWithoutPassword as any).phone = dbUser.phone as string;
                    }
                    if (dbUser && dbUser.department && !userWithoutPassword.department) {
                         (userWithoutPassword as any).department = dbUser.department as string;
                    }
               }
          } catch (_) {
               // ignore DB enrichment failures
          }

          return NextResponse.json({
               message: "Login successful",
               user: userWithoutPassword,
          });
     } catch (error) {
          return NextResponse.json(
               { message: "Internal server error" },
               { status: 500 }
          );
     }
}
