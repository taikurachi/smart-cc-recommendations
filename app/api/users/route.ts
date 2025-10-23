import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET /api/users - List all users or get user by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (userId) {
      const user = storage.getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const connections = storage.getConnectionsByUserId(userId);
      return NextResponse.json({
        user,
        connections: connections.map((conn) => ({
          id: conn.id,
          item_id: conn.item_id,
          institution_name: conn.institution_name,
          accounts: conn.accounts,
          created_at: conn.created_at,
          last_synced: conn.last_synced,
        })),
      });
    }

    if (email) {
      const user = storage.getUserByEmail(email);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json({ user });
    }

    // Return all users (without sensitive data)
    const users = storage.getUsers();
    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      })),
      stats: storage.getStats(),
    });
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Check if user already exists
    if (email) {
      const existingUser = storage.getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json({
          user: existingUser,
          message: "User already exists",
        });
      }
    }

    const user = storage.createUser(email);
    return NextResponse.json({
      user,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Users POST error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
