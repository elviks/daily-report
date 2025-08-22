import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
     try {
          const data = await request.json();

          const client = await clientPromise;
          const db = client.db("daily-report");

          const result = await db
               .collection("reports")
               .insertOne({
                    ...data,
                    createdAt: new Date(),
               });

          return NextResponse.json({
               success: true,
               id: result.insertedId,
          });
     } catch (error) {
          console.error(error);
          return NextResponse.json(
               { error: "Failed to add report" },
               { status: 500 }
          );
     }
}
