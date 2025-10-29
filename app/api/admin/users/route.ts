import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { findUsersByTenant, createUser, hashPassword, findUserByEmailAndTenant } from "@/lib/db";
import { adminAuthMiddleware, getTenantIdFromRequest } from "@/lib/admin-middleware";

export async function GET(request: NextRequest) {
     try {
          // Authenticate admin user and get tenant info
          const authResult = await adminAuthMiddleware(request);
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

export async function POST(request: NextRequest) {
     try {
          // Authenticate admin user and get tenant info
          const authResult = await adminAuthMiddleware(request);
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

          // Get the current user's role to determine what roles they can assign
          const currentUser = authResult.user;
          console.log("Current user role:", currentUser.role);

          // Determine the role to assign based on current user's permissions
          let userRole = "user"; // default

          if (currentUser.role === "superadmin") {
               // Superadmin can assign any role
               if (role === "superadmin") {
                    userRole = "superadmin";
               } else if (role === "admin") {
                    userRole = "superadmin"; // When adding admin, set as superadmin
               } else {
                    userRole = "user";
               }
          } else if (currentUser.role === "admin") {
               // Admin can only assign user or admin roles
               if (role === "admin") {
                    userRole = "admin";
               } else {
                    userRole = "user";
               }
          }

          console.log("Final role assignment:", userRole);



          // Check if user already exists in this tenant
          const existingUser = await findUserByEmailAndTenant(email, new ObjectId(tenantId));
          if (existingUser) {
               return NextResponse.json(
                    { error: "User with this email already exists in this company" },
                    { status: 409 }
               );
          }

          // Create new user for this tenant
          const newUser = await createUser({
               email,
               password: hashPassword(password),
               name,
               role: userRole,
               department,
               phone: phone || "",
               profileImage: "",
               isAdmin: userRole === "admin" || userRole === "superadmin",
               tenantId: new ObjectId(tenantId),
               isActive: true
          });

          // Return user without password
          const { password: _, ...userWithoutPassword } = newUser;

          return NextResponse.json({
               message: "User created successfully",
               user: userWithoutPassword,
          }, { status: 201 });

     } catch (error) {
          console.error("Error creating user:", error);
          return NextResponse.json(
               { error: "Failed to create user" },
               { status: 500 }
          );
     }
}