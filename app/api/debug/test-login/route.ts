import { NextRequest, NextResponse } from "next/server";
import { findTenantBySlug, findUserByEmailAndTenant, verifyPassword } from "@/lib/db";

export async function POST(request: NextRequest) {
     try {
          const { email, password, companyCode } = await request.json();

          console.log("Debug login attempt:", { email, companyCode, hasPassword: !!password });

          if (!email || !password || !companyCode) {
               return NextResponse.json(
                    {
                         error: "Missing required fields",
                         received: { email: !!email, password: !!password, companyCode: !!companyCode }
                    },
                    { status: 400 }
               );
          }

          // Step 1: Find tenant
          console.log("Looking for tenant with slug:", companyCode);
          const tenant = await findTenantBySlug(companyCode);
          
          if (!tenant) {
               return NextResponse.json(
                    {
                         error: "Company not found",
                         searchedSlug: companyCode,
                         step: "tenant_lookup"
                    },
                    { status: 404 }
               );
          }

          console.log("Found tenant:", { id: tenant._id?.toString(), name: tenant.name, slug: tenant.slug });

          // Step 2: Find user
          console.log("Looking for user with email:", email, "and tenantId:", tenant._id?.toString());
          const user = await findUserByEmailAndTenant(email, tenant._id!);
          
          if (!user) {
               return NextResponse.json(
                    {
                         error: "User not found",
                         searchedEmail: email,
                         tenantId: tenant._id?.toString(),
                         step: "user_lookup"
                    },
                    { status: 404 }
               );
          }

          console.log("Found user:", { id: user._id?.toString(), email: user.email, name: user.name });

          // Step 3: Verify password
          console.log("Verifying password...");
          const isPasswordValid = await verifyPassword(password, user.password);
          
          if (!isPasswordValid) {
               return NextResponse.json(
                    {
                         error: "Invalid password",
                         step: "password_verification"
                    },
                    { status: 401 }
               );
          }

          console.log("Password verified successfully");

          return NextResponse.json({
               success: true,
               message: "Login would succeed",
               user: {
                    id: user._id?.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isAdmin: user.isAdmin
               },
               tenant: {
                    id: tenant._id?.toString(),
                    name: tenant.name,
                    slug: tenant.slug
               }
          });

     } catch (error) {
          console.error("Debug login error:", error);
          return NextResponse.json(
               { 
                    error: "Internal server error", 
                    details: error instanceof Error ? error.message : String(error),
                    step: "exception"
               },
               { status: 500 }
          );
     }
}
