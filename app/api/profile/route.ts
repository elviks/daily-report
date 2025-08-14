import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
    try {
        const { id, email } = await request.json();
        if (!id && !email) {
            return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
        }
        const client = await clientPromise;
        if (client) {
            const db = client.db("daily-report");
            const users = db.collection("users");
            const user = await users.findOne({ $or: [{ id }, { email }] });
            if (user) {
                const { password, _id, ...rest } = user as any;
                return NextResponse.json({ user: { ...rest, id: rest.id || String(_id) } });
            }
        }
        return NextResponse.json({ user: null }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
