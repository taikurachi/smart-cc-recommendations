import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// Types for our storage system
export interface User {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaidConnection {
  id: string;
  user_id: string;
  access_token: string;
  item_id: string;
  institution_name?: string;
  institution_id?: string;
  accounts: PlaidAccount[];
  created_at: string;
  last_synced?: string;
  is_active: boolean;
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
}

export interface StorageData {
  users: User[];
  plaid_connections: PlaidConnection[];
  version: string;
}

class SimpleStorage {
  private dataDir: string;
  private usersFile: string;
  private connectionsFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), "data");
    this.usersFile = path.join(this.dataDir, "users.json");
    this.connectionsFile = path.join(this.dataDir, "plaid_connections.json");
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private readJsonFile<T>(filePath: string, defaultValue: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content);
      }
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
    return defaultValue;
  }

  private writeJsonFile<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      throw error;
    }
  }

  // User management
  getUsers(): User[] {
    return this.readJsonFile(this.usersFile, []);
  }

  getUserById(userId: string): User | null {
    const users = this.getUsers();
    return users.find((user) => user.id === userId) || null;
  }

  getUserByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find((user) => user.email === email) || null;
  }

  createUser(email?: string): User {
    const users = this.getUsers();
    const now = new Date().toISOString();

    const newUser: User = {
      id: randomUUID(),
      email,
      created_at: now,
      updated_at: now,
    };

    users.push(newUser);
    this.writeJsonFile(this.usersFile, users);

    console.log(`✅ Created user: ${newUser.id}`);
    return newUser;
  }

  // Plaid connection management
  getPlaidConnections(): PlaidConnection[] {
    return this.readJsonFile(this.connectionsFile, []);
  }

  getConnectionsByUserId(userId: string): PlaidConnection[] {
    const connections = this.getPlaidConnections();
    return connections.filter(
      (conn) => conn.user_id === userId && conn.is_active
    );
  }

  getConnectionByItemId(itemId: string): PlaidConnection | null {
    const connections = this.getPlaidConnections();
    return (
      connections.find((conn) => conn.item_id === itemId && conn.is_active) ||
      null
    );
  }

  createPlaidConnection(
    userId: string,
    accessToken: string,
    itemId: string,
    institutionName?: string,
    institutionId?: string,
    accounts: PlaidAccount[] = []
  ): PlaidConnection {
    const connections = this.getPlaidConnections();
    const now = new Date().toISOString();

    const newConnection: PlaidConnection = {
      id: randomUUID(),
      user_id: userId,
      access_token: accessToken,
      item_id: itemId,
      institution_name: institutionName,
      institution_id: institutionId,
      accounts,
      created_at: now,
      is_active: true,
    };

    connections.push(newConnection);
    this.writeJsonFile(this.connectionsFile, connections);

    console.log(
      `✅ Created Plaid connection: ${newConnection.id} for user: ${userId}`
    );
    return newConnection;
  }

  updatePlaidConnection(
    itemId: string,
    updates: Partial<PlaidConnection>
  ): PlaidConnection | null {
    const connections = this.getPlaidConnections();
    const index = connections.findIndex((conn) => conn.item_id === itemId);

    if (index === -1) {
      return null;
    }

    connections[index] = {
      ...connections[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.writeJsonFile(this.connectionsFile, connections);
    return connections[index];
  }

  updateLastSynced(itemId: string): void {
    this.updatePlaidConnection(itemId, {
      last_synced: new Date().toISOString(),
    });
  }

  deactivateConnection(itemId: string): boolean {
    const updated = this.updatePlaidConnection(itemId, { is_active: false });
    return updated !== null;
  }

  // Utility methods
  getAllData(): StorageData {
    return {
      users: this.getUsers(),
      plaid_connections: this.getPlaidConnections(),
      version: "1.0.0",
    };
  }

  exportData(filename: string = "backup.json"): void {
    const data = this.getAllData();
    const backupPath = path.join(this.dataDir, filename);
    this.writeJsonFile(backupPath, data);
    console.log(`✅ Data exported to: ${backupPath}`);
  }

  getStats(): {
    totalUsers: number;
    totalConnections: number;
    activeConnections: number;
  } {
    const users = this.getUsers();
    const connections = this.getPlaidConnections();
    const activeConnections = connections.filter((conn) => conn.is_active);

    return {
      totalUsers: users.length,
      totalConnections: connections.length,
      activeConnections: activeConnections.length,
    };
  }
}

// Export singleton instance
export const storage = new SimpleStorage();
