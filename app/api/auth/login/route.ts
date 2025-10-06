import {
     type NextRequest,
     NextResponse,
} from "next/server";
import { ObjectId } from "mongodb";
import { 
     findTenantBySlug, 
     findUserByEmailAndTenant, 
     verifyPassword, 
     generateJWT
} from "@/lib/db";
import { ensureInitialization } from "@/lib/db-init";
import { loadTenantMiddleware } from "@/lib/middleware";

export async function POST(request: NextRequest) {
     try {
          // Initialize database and bootstrap default tenant only once
          await ensureInitialization();

          const { email, password, companyCode } = await request.json();

          if (!email || !password || !companyCode) {
               return NextResponse.json(
                    {
                         message: "Email, password, and company code are required",
                    },
                    { status: 400 }
               );
          }

          // Find tenant by company code
          const tenant = await findTenantBySlug(companyCode);
          if (!tenant) {
               return NextResponse.json(
                    {
                         message: "Company not found",
                    },
                    { status: 404 }
               );
          }

          // Find user by email and tenant
          const user = await findUserByEmailAndTenant(email, tenant._id!);
          
          if (!user) {
               return NextResponse.json(
                    {
                         message: "Invalid email or password",
                    },
                    { status: 401 }
               );
          }

          // Verify password
          const isPasswordValid = await verifyPassword(password, user.password);
          if (!isPasswordValid) {
               return NextResponse.json(
                    {
                         message: "Invalid email or password",
                    },
                    { status: 401 }
               );
          }

          // Generate JWT token
          const token = generateJWT(user);

          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;

          return NextResponse.json({
               message: "Login successful",
               user: userWithoutPassword,
               token,
               tenant: {
                    id: tenant._id?.toString(),
                    name: tenant.name,
                    slug: tenant.slug
               }
          });
     } catch (error) {
          console.error("Login error:", error);
          return NextResponse.json(
               { message: "Internal server error" },
               { status: 500 }
          );
     }
}
