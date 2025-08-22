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

          // First try to find user by email in database (prioritize database over mock data)
          try {
               const client = await clientPromise;
               if (client) {
                    const db = client.db("daily-report");
                    const usersCol = db.collection("users");
                    const dbUser = await usersCol.findOne({ email });

                    if (dbUser) {
                         // Ensure consistent ID format - prefer string ID if available, otherwise use ObjectId
                         const userId = dbUser.id || dbUser._id?.toString();
                         user = {
                              id: userId,
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

          // Only fallback to mock data if database lookup failed or no user found
          if (!userFound) {
               user = getUserByEmail(email);
               if (user) {
                    userFound = true;
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

          // User data is already complete from database lookup

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
