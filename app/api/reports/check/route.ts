import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
     try {
          const { searchParams } = new URL(request.url);
          const userId = searchParams.get('userId');
          const date = searchParams.get('date');

          if (!userId || !date) {
               return NextResponse.json(
                    { error: "Missing userId or date parameter" },
                    { status: 400 }
               );
          }

          const client = await clientPromise;
          if (!client) {
               return NextResponse.json(
                    { error: "Database client not available" },
                    { status: 500 }
               );
          }
          const db = client.db("daily-report");

          // Convert userId to ObjectId if it's valid, otherwise keep as string
          const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

          const report = await db.collection("reports").findOne({ userId: userIdObj, date });

          return NextResponse.json({ exists: !!report, report: report || null });
     } catch (error) {
          console.error("Error in check endpoint:", error);
          return NextResponse.json({ error: "Failed to check report" }, { status: 500 });
     }
}

export async function POST(request: Request) {
     try {
          const { userId, date } = await request.json();

          const client = await clientPromise;
          if (!client) {
               return NextResponse.json(
                    { error: "Database client not available" },
                    { status: 500 }
               );
          }
          const db = client.db("daily-report");

          // Convert userId to ObjectId if it's valid, otherwise keep as string
          const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

          const report = await db.collection("reports").findOne({ userId: userIdObj, date });

          return NextResponse.json({ exists: !!report, report: report || null });
     } catch (error) {
          console.error("Error in check endpoint:", error);
          return NextResponse.json({ error: "Failed to check report" }, { status: 500 });
     }
}