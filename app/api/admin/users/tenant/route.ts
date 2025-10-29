import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { findUsersByTenant } from "@/lib/db";
import { authMiddleware, getTenantIdFromRequest } from "@/lib/middleware";

export async function GET(request: NextRequest) {
     try {
          // Authenticate user and get tenant info
          const authResult = await authMiddleware(request);
          if (authResult instanceof NextResponse) {
               return authResult;
          }

          const { request: authenticatedRequest } = authResult;
          const tenantId = getTenantIdFromRequest(authenticatedRequest);

          if (!tenantId) {
               return NextResponse.json(
                    { error: "Tenant information not found" },
                    { status: 400 }
               );
          }

          // Get users for this specific tenant only
          const users = await findUsersByTenant(new ObjectId(tenantId));

          return NextResponse.json({
               users: users.map(user => ({
                    id: user._id?.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    department: user.department,
                    phone: user.phone,
                    profileImage: user.profileImage,
                    isAdmin: user.isAdmin,
                    isActive: user.isActive,
                    createdAt: user.createdAt
               }))
          });
     } catch (error) {
          console.error("Error fetching users:", error);
          return NextResponse.json(
               { users: [] },
               { status: 500 }
          );
     }
}
