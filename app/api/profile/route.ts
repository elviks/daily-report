import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getUserById, getUserByEmail } from "@/lib/mock-data";

export async function POST(request: Request) {
    try {
        const { id, email } = await request.json();
        if (!id && !email) {
            return NextResponse.json({ error: "Missing id or email" }, { status: 400 });
        }

        let user = null;
        let userFound = false;

        // First try to find user in database (prioritize database over mock data)
        try {
            const client = await clientPromise;
            if (client) {
                const db = client.db("daily-report");
                const users = db.collection("users");
                const dbUser = await users.findOne({ $or: [{ id }, { email }] });

                if (dbUser) {
                    user = {
                        id: dbUser.id || dbUser._id?.toString(),
                        name: dbUser.name,
                        email: dbUser.email,
                        password: dbUser.password,
                        role: dbUser.role,
                        department: dbUser.department,
                        phone: dbUser.phone,
                        profileImage: dbUser.profileImage,
                        createdAt: dbUser.createdAt,
                    };
                    userFound = true;
                }
            }
        } catch (dbError) {
            console.warn("Database lookup failed:", dbError);
        }

        // Only fallback to mock data if database lookup failed or no user found
        if (!userFound) {
            if (id) {
                user = getUserById(id);
            } else if (email) {
                user = getUserByEmail(email);
            }

            if (user) {
                userFound = true;
            }
        }

        if (!userFound || !user) {
            return NextResponse.json({ user: null }, { status: 404 });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ user: userWithoutPassword });

    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
