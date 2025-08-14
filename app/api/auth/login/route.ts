import {
     type NextRequest,
     NextResponse,
} from "next/server";
import { users } from "@/lib/mock-data";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
     try {
          const { email, password } = await request.json();

          // Find user by email
          const user = users.find((u) => u.email === email);

          if (!user || user.password !== password) {
               return NextResponse.json(
                    {
                         message: "Invalid email or password",
                    },
                    { status: 401 }
               );
          }

          // Remove password from response
          const { password: _, ...userWithoutPassword } =
               user;

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
