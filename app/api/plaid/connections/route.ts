import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { plaidClient } from "@/lib/plaid";

// GET /api/plaid/connections - Get connections for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("itemId");

    if (itemId) {
      const connection = storage.getConnectionByItemId(itemId);
      if (!connection) {
        return NextResponse.json(
          { error: "Connection not found" },
          { status: 404 }
        );
      }

      // Don't expose access token in response
      const { access_token, ...safeConnection } = connection;
      return NextResponse.json({ connection: safeConnection });
    }

    if (userId) {
      const connections = storage.getConnectionsByUserId(userId);
      const safeConnections = connections.map(
        ({ access_token, ...conn }) => conn
      );

      return NextResponse.json({
        connections: safeConnections,
        count: safeConnections.length,
      });
    }

    return NextResponse.json(
      { error: "userId or itemId parameter required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Connections GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

// DELETE /api/plaid/connections - Remove a Plaid connection
export async function DELETE(request: NextRequest) {
  try {
    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 }
      );
    }

    const connection = storage.getConnectionByItemId(itemId);
    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    try {
      // Remove the item from Plaid
      await plaidClient.itemRemove({
        access_token: connection.access_token,
      });
    } catch (plaidError) {
      console.error("Error removing item from Plaid:", plaidError);
      // Continue with local removal even if Plaid removal fails
    }

    // Deactivate the connection locally
    const success = storage.deactivateConnection(itemId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Connection removed successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to remove connection" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Connections DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove connection" },
      { status: 500 }
    );
  }
}
