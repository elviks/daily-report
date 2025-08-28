import { NextRequest, NextResponse } from "next/server";
import { findTenantBySlug, findUserByEmailAndTenant } from "@/lib/db";

export async function POST(request: NextRequest) {
     try {
          const { companyCode, email } = await request.json();

          if (!companyCode || !email) {
               return NextResponse.json(
                    {
                         error: "Company code and email are required",
                    },
                    { status: 400 }
               );
          }

          console.log("Inspecting user:", { companyCode, email });

          // Find tenant
          const tenant = await findTenantBySlug(companyCode);
          if (!tenant) {
               return NextResponse.json(
                    {
                         error: "Company not found",
                         searchedSlug: companyCode
                    },
                    { status: 404 }
               );
          }

          console.log("Found tenant:", {
               id: tenant._id?.toString(),
               name: tenant.name,
               slug: tenant.slug
          });

          // Find user
          const user = await findUserByEmailAndTenant(email, tenant._id!);
          if (!user) {
               return NextResponse.json(
                    {
                         error: "User not found",
                         searchedEmail: email,
                         tenantId: tenant._id?.toString()
                    },
                    { status: 404 }
               );
          }

          console.log("Found user:", {
               id: user._id?.toString(),
               email: user.email,
               name: user.name,
               role: user.role,
               isAdmin: user.isAdmin,
               tenantId: user.tenantId?.toString(),
               department: user.department
          });

          return NextResponse.json({
               success: true,
               tenant: {
                    id: tenant._id?.toString(),
                    name: tenant.name,
                    slug: tenant.slug
               },
               user: {
                    id: user._id?.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isAdmin: user.isAdmin,
                    tenantId: user.tenantId?.toString(),
                    department: user.department,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
               },
               analysis: {
                    isAdminUser: user.isAdmin || user.role === "superadmin" || user.role === "admin",
                    shouldRedirectToAdmin: user.isAdmin || user.role === "superadmin" || user.role === "admin"
               }
          });

     } catch (error) {
          console.error("User inspection error:", error);
          return NextResponse.json(
               { 
                    error: "Failed to inspect user", 
                    details: error instanceof Error ? error.message : String(error)
               },
               { status: 500 }
          );
     }
}
