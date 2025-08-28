import {
     type NextRequest,
     NextResponse,
} from "next/server";
import { createTenant, createUser, hashPassword, initializeDatabase, findTenantBySlug } from "@/lib/db";

// Simple slugify function
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

export async function POST(request: NextRequest) {
     try {
          // Initialize database
          await initializeDatabase();

          const { companyName, adminEmail, adminPassword } = await request.json();

          if (!companyName || !adminEmail || !adminPassword) {
               return NextResponse.json(
                    {
                         message: "Company name, admin email, and admin password are required",
                    },
                    { status: 400 }
               );
          }

          // Validate input
          if (companyName.length < 2) {
               return NextResponse.json(
                    {
                         message: "Company name must be at least 2 characters long",
                    },
                    { status: 400 }
               );
          }

          if (adminPassword.length < 6) {
               return NextResponse.json(
                    {
                         message: "Password must be at least 6 characters long",
                    },
                    { status: 400 }
               );
          }

          // Generate slug from company name
          const slug = slugify(companyName);

          // Check if tenant already exists
          const existingTenant = await findTenantBySlug(slug);
          if (existingTenant) {
               return NextResponse.json(
                    {
                         message: "A company with this name already exists",
                    },
                    { status: 409 }
               );
          }

          // Create new tenant
          const newTenant = await createTenant({
               name: companyName,
               slug: slug
          });

          // Create superadmin user
          const adminUser = await createUser({
               email: adminEmail,
               password: hashPassword(adminPassword),
               name: 'Admin User',
               role: 'superadmin',
               department: 'Administration',
               phone: '',
               profileImage: '',
               isAdmin: true,
               tenantId: newTenant._id!,
               isActive: true
          });
          
          console.log("Created admin user:", {
               id: adminUser._id?.toString(),
               email: adminUser.email,
               role: adminUser.role,
               isAdmin: adminUser.isAdmin,
               tenantId: adminUser.tenantId?.toString()
          });

          return NextResponse.json({
               message: "Company registered successfully",
               slug: slug,
               companyName: companyName,
               adminEmail: adminEmail,
               loginUrl: `/login?company=${slug}`
          });

     } catch (error: any) {
          console.error("Company registration error:", error);
          
          // Handle duplicate key error
          if (error.code === 11000) {
               return NextResponse.json(
                    {
                         message: "A company with this name already exists",
                    },
                    { status: 409 }
               );
          }

          return NextResponse.json(
               { message: "Internal server error" },
               { status: 500 }
          );
     }
}
