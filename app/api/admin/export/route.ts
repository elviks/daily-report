import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
     try {
          const client = await clientPromise;
          const db = client.db("daily-report");
          const reports = await db
               .collection("reports")
               .find({})
               .toArray();

          return new NextResponse(JSON.stringify(reports), {
               headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition":
                         "attachment; filename=reports.json",
               },
          });
     } catch (error) {
          console.error(error);
          return NextResponse.json(
               { error: "Failed to export reports" },
               { status: 500 }
          );
     }
}
