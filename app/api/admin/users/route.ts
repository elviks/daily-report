import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
     try {
          const client = await clientPromise;
          if (!client) {
               throw new Error("Database client is not available");
          }
          const db = client.db("daily-report");
          const users = await db
               .collection("users")
               .aggregate([
                    {
                         $project: {
                              _id: 0,
                              id: { $ifNull: ["$id", { $toString: "$_id" }] },
                              name: 1,
                              email: 1,
                              role: { $ifNull: ["$role", "user"] },
                              department: { $ifNull: ["$department", ""] },
                              phone: { $ifNull: ["$phone", ""] },
                              profileImage: { $ifNull: ["$profileImage", ""] },
                              createdAt: { $ifNull: ["$createdAt", new Date()] },
                         },
                    },
               ])
               .toArray();
          return NextResponse.json({ users });
     } catch (error) {
          console.error("Error fetching users:", error);
          return NextResponse.json(
               { users: [] },
               { status: 500 }
          );
     }
}