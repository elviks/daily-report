import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
     try {
          const client = await clientPromise;
          if (!client) {
               throw new Error("Database client is null");
          }
          const db = client.db("daily-report");

          const totalUsers = await db.collection("users").countDocuments();
          const totalReports = await db.collection("reports").countDocuments();

          // Get today's reports
          const today = new Date().toISOString().split("T")[0];
          const reportsToday = await db
               .collection("reports")
               .countDocuments({ date: today });

          // Get active users (users who submitted reports in last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const activeUsers = await db
               .collection("reports")
               .distinct("userId", {
                    createdAt: { $gte: sevenDaysAgo }
               });

          return NextResponse.json({
               stats: {
                    totalUsers: totalUsers,
                    totalReports: totalReports,
                    reportsToday: reportsToday,
                    activeUsers: activeUsers.length,
               }
          });

     } catch (error) {
          console.error("Error fetching admin stats:", error);
          return NextResponse.json(
               {
                    stats: {
                         totalUsers: 0,
                         totalReports: 0,
                         reportsToday: 0,
                         activeUsers: 0,
                    }
               },
               { status: 500 }
          );
     }
}