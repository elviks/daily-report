import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getReportsByUserId } from "@/lib/mock-data";

export async function GET(
     _request: Request,
     { params }: { params: { userId: string } }
) {
     try {
          const client = await clientPromise;
          if (client) {
               const db = client.db("daily-report");
               const userId = params.userId;
               const userIdObj = ObjectId.isValid(userId)
                    ? new ObjectId(userId)
                    : userId;
               const reports = await db
                    .collection("reports")
                    .find({ userId: userIdObj })
                    .sort({ date: -1 })
                    .toArray();
               return NextResponse.json({
                    reports: Array.isArray(reports)
                         ? reports.map((report: any) => ({
                              ...report,
                              id: report._id?.toString?.() || String(report._id),
                              _id: undefined,
                         }))
                         : [],
               });
          }
          // Fallback to mock data if client not available
          const fallbackReports = getReportsByUserId(params.userId) || [];
          return NextResponse.json({ reports: fallbackReports });
     } catch (error) {
          console.error(error);
          return NextResponse.json(
               { reports: [] },
               { status: 500 }
          );
     }
}
