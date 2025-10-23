#!/usr/bin/env npx tsx

import { storage } from "../lib/storage";

function printHelp() {
  console.log(`
🏦 Plaid Storage CLI

Usage: npx tsx scripts/storage-cli.ts <command> [options]

Commands:
  stats                           Show storage statistics
  users                          List all users
  user <userId>                  Show user details and connections
  connections [userId]           List connections (optionally for specific user)
  create-user [email]            Create a new user
  remove-connection <itemId>     Deactivate a connection
  export [filename]              Export all data to JSON file
  help                          Show this help message

Examples:
  npx tsx scripts/storage-cli.ts stats
  npx tsx scripts/storage-cli.ts users
  npx tsx scripts/storage-cli.ts user 123e4567-e89b-12d3-a456-426614174000
  npx tsx scripts/storage-cli.ts create-user john@example.com
  npx tsx scripts/storage-cli.ts export backup-$(date +%Y%m%d).json
`);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "stats": {
        const stats = storage.getStats();
        console.log("📊 Storage Statistics:");
        console.log(`   Users: ${stats.totalUsers}`);
        console.log(`   Total Connections: ${stats.totalConnections}`);
        console.log(`   Active Connections: ${stats.activeConnections}`);
        break;
      }

      case "users": {
        const users = storage.getUsers();
        console.log(`👥 Users (${users.length}):`);
        users.forEach((user) => {
          console.log(
            `   ${user.id} | ${
              user.email || "No email"
            } | Created: ${formatDate(user.created_at)}`
          );
        });
        break;
      }

      case "user": {
        const userId = args[1];
        if (!userId) {
          console.error("❌ User ID required");
          process.exit(1);
        }

        const user = storage.getUserById(userId);
        if (!user) {
          console.error("❌ User not found");
          process.exit(1);
        }

        const connections = storage.getConnectionsByUserId(userId);

        console.log("👤 User Details:");
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email || "Not set"}`);
        console.log(`   Created: ${formatDate(user.created_at)}`);
        console.log(`   Updated: ${formatDate(user.updated_at)}`);

        console.log(`\n🏦 Connections (${connections.length}):`);
        connections.forEach((conn) => {
          console.log(`   ${conn.institution_name} (${conn.item_id})`);
          console.log(`     Created: ${formatDate(conn.created_at)}`);
          console.log(
            `     Last Synced: ${
              conn.last_synced ? formatDate(conn.last_synced) : "Never"
            }`
          );
          console.log(`     Accounts: ${conn.accounts.length}`);
          conn.accounts.forEach((acc) => {
            console.log(
              `       - ${acc.name} (${acc.type}/${acc.subtype}) ${
                acc.mask ? "****" + acc.mask : ""
              }`
            );
          });
        });
        break;
      }

      case "connections": {
        const userId = args[1];
        const connections = userId
          ? storage.getConnectionsByUserId(userId)
          : storage.getPlaidConnections().filter((conn) => conn.is_active);

        console.log(
          `🏦 ${userId ? "User" : "All"} Connections (${connections.length}):`
        );
        connections.forEach((conn) => {
          console.log(
            `   ${conn.institution_name || "Unknown"} | ${conn.item_id}`
          );
          console.log(`     User: ${conn.user_id}`);
          console.log(`     Created: ${formatDate(conn.created_at)}`);
          console.log(
            `     Last Synced: ${
              conn.last_synced ? formatDate(conn.last_synced) : "Never"
            }`
          );
          console.log(`     Accounts: ${conn.accounts.length}`);
        });
        break;
      }

      case "create-user": {
        const email = args[1];
        const user = storage.createUser(email);
        console.log("✅ User created:");
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email || "Not set"}`);
        break;
      }

      case "remove-connection": {
        const itemId = args[1];
        if (!itemId) {
          console.error("❌ Item ID required");
          process.exit(1);
        }

        const success = storage.deactivateConnection(itemId);
        if (success) {
          console.log("✅ Connection deactivated");
        } else {
          console.error("❌ Connection not found");
          process.exit(1);
        }
        break;
      }

      case "export": {
        const filename =
          args[1] || `backup-${new Date().toISOString().split("T")[0]}.json`;
        storage.exportData(filename);
        break;
      }

      case "help":
      default:
        printHelp();
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
