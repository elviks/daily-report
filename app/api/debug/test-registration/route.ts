import { NextRequest, NextResponse } from "next/server";
import { createTenant, createUser, hashPassword, findTenantBySlug, findUserByEmailAndTenant } from "@/lib/db";

// Simple slugify function
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function POST(request: NextRequest) {
     try {
          const { companyName, adminEmail, adminPassword } = await request.json();

          console.log("Test registration with:", { companyName, adminEmail });

          if (!companyName || !adminEmail || !adminPassword) {
               return NextResponse.json(
                    {
                         error: "Company name, admin email, and admin password are required",
                    },
                    { status: 400 }
               );
          }

          // Generate slug from company name
          const slug = slugify(companyName);
          console.log("Generated slug:", slug);

          // Create tenant
          const tenant = await createTenant({
               name: companyName,
               slug: slug
          });
          
          console.log("Created tenant:", {
               id: tenant._id?.toString(),
               name: tenant.name,
               slug: tenant.slug
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
               tenantId: tenant._id!,
               isActive: true
          });
          
          console.log("Created admin user:", {
               id: adminUser._id?.toString(),
               email: adminUser.email,
               role: adminUser.role,
               isAdmin: adminUser.isAdmin,
               tenantId: adminUser.tenantId?.toString()
          });

          // Verify the user was created correctly by fetching it
          const verifyTenant = await findTenantBySlug(slug);
          const verifyUser = await findUserByEmailAndTenant(adminEmail, tenant._id!);
          
          console.log("Verification - Tenant found:", !!verifyTenant);
          console.log("Verification - User found:", !!verifyUser);
          if (verifyUser) {
               console.log("Verification - User details:", {
                    id: verifyUser._id?.toString(),
                    email: verifyUser.email,
                    role: verifyUser.role,
                    isAdmin: verifyUser.isAdmin,
                    tenantId: verifyUser.tenantId?.toString()
               });
          }

          return NextResponse.json({
               success: true,
               message: "Test registration completed",
               tenant: {
                    id: tenant._id?.toString(),
                    name: tenant.name,
                    slug: tenant.slug
               },
               user: {
                    id: adminUser._id?.toString(),
                    email: adminUser.email,
                    role: adminUser.role,
                    isAdmin: adminUser.isAdmin,
                    tenantId: adminUser.tenantId?.toString()
               },
               verification: {
                    tenantFound: !!verifyTenant,
                    userFound: !!verifyUser,
                    userDetails: verifyUser ? {
                         id: verifyUser._id?.toString(),
                         email: verifyUser.email,
                         role: verifyUser.role,
                         isAdmin: verifyUser.isAdmin,
                         tenantId: verifyUser.tenantId?.toString()
                    } : null
               }
          });

     } catch (error: any) {
          console.error("Test registration error:", error);
          
          return NextResponse.json(
               { 
                    error: "Test registration failed", 
                    details: error instanceof Error ? error.message : String(error)
               },
               { status: 500 }
          );
     }
}
