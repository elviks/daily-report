import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { headers } from "next/headers";

export async function GET(request: Request) {
     // CRITICAL: Check if user is admin
     const headersList = headers();
     const userRole = headersList.get("x-user-role");

     if (userRole !== "superadmin") {
          return NextResponse.json(
               { error: "Access denied - admin only" },
               { status: 403 }
          );
     }
     try {
          const client = await clientPromise;
          if (!client) {
               throw new Error("Database client is not available");
          }
          const db = client.db("daily-report");

          // Get reports with robust user join (handles string vs ObjectId userId)
          const reports = await db
               .collection("reports")
               .aggregate([
                    {
                         $lookup: {
                              from: "users",
                              let: { uid: "$userId" },
                              pipeline: [
                                   {
                                        $match: {
                                             $expr: {
                                                  $or: [
                                                       { $eq: ["$_id", "$$uid"] },
                                                       { $eq: [{ $toString: "$_id" }, "$$uid"] },
                                                       { $eq: ["$id", "$$uid"] },
                                                  ],
                                             },
                                        },
                                   },
                              ],
                              as: "user",
                         },
                    },
                    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                    {
                         $project: {
                              id: "$_id",
                              _id: 0,
                              userId: 1,
                              date: 1,
                              content: 1,
                              createdAt: 1,
                              updatedAt: 1,
                              userName: { $ifNull: ["$user.name", "Unknown User"] },
                              userEmail: { $ifNull: ["$user.email", "unknown@example.com"] },
                              department: { $ifNull: ["$user.department", "Unknown"] },
                         },
                    },
               ])
               .toArray();

          return NextResponse.json({ reports });
     } catch (error) {
          console.error("Error fetching reports:", error);
          return NextResponse.json({ reports: [] }, { status: 500 });
     }
}