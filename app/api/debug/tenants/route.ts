import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { COLLECTIONS } from "@/lib/models";

export async function GET(request: NextRequest) {
     try {
          const db = await getDb();
          
          // Get all tenants
          const tenants = await db.collection(COLLECTIONS.TENANTS).find({}).toArray();
          
          // Get all users
          const users = await db.collection(COLLECTIONS.USERS).find({}).toArray();
          
          return NextResponse.json({
               success: true,
               tenants: tenants.map(t => ({
                    id: t._id?.toString(),
                    name: t.name,
                    slug: t.slug,
                    createdAt: t.createdAt
               })),
               users: users.map(u => ({
                    id: u._id?.toString(),
                    email: u.email,
                    name: u.name,
                    tenantId: u.tenantId?.toString(),
                    isAdmin: u.isAdmin,
                    role: u.role
               })),
               totalTenants: tenants.length,
               totalUsers: users.length
          });
     } catch (error) {
          console.error("Debug error:", error);
          return NextResponse.json(
               { error: "Failed to fetch debug info", details: error },
               { status: 500 }
          );
     }
}
