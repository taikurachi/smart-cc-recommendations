import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { users as usersTable, plaidConnections as connectionsTable } from "../drizzle/schema";

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

// --- JSON file fallback helpers (used when DATABASE_URL is not set) ---

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");
const connectionsFile = path.join(dataDir, "plaid_connections.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return fallback;
}

function writeJson<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// --- Row-to-interface helpers ---

function rowToUser(row: any): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function rowToConnection(row: any): PlaidConnection {
  return {
    id: row.id,
    user_id: row.user_id,
    access_token: row.access_token,
    item_id: row.item_id,
    institution_name: row.institution_name ?? undefined,
    institution_id: row.institution_id ?? undefined,
    accounts: (row.accounts as PlaidAccount[]) ?? [],
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    last_synced: row.last_synced instanceof Date ? row.last_synced.toISOString() : row.last_synced ?? undefined,
    is_active: row.is_active,
  };
}

// --- Storage implementation ---

class Storage {
  // ---- Users ----

  async getUsers(): Promise<User[]> {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(usersTable);
      return rows.map(rowToUser);
    }
    return readJson(usersFile, []);
  }

  async getUserById(userId: string): Promise<User | null> {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(usersTable).where(eq(usersTable.id, userId));
      return rows.length > 0 ? rowToUser(rows[0]) : null;
    }
    const users = readJson<User[]>(usersFile, []);
    return users.find((u) => u.id === userId) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(usersTable).where(eq(usersTable.email, email));
      return rows.length > 0 ? rowToUser(rows[0]) : null;
    }
    const users = readJson<User[]>(usersFile, []);
    return users.find((u) => u.email === email) || null;
  }

  async createUser(email?: string): Promise<User> {
    const db = getDb();
    if (db) {
      const rows = await db
        .insert(usersTable)
        .values({ email })
        .returning();
      const user = rowToUser(rows[0]);
      console.log(`✅ Created user: ${user.id}`);
      return user;
    }

    const users = readJson<User[]>(usersFile, []);
    const now = new Date().toISOString();
    const newUser: User = { id: randomUUID(), email, created_at: now, updated_at: now };
    users.push(newUser);
    writeJson(usersFile, users);
    console.log(`✅ Created user: ${newUser.id}`);
    return newUser;
  }

  // ---- Plaid Connections ----

  async getPlaidConnections(): Promise<PlaidConnection[]> {
    const db = getDb();
    if (db) {
      const rows = await db.select().from(connectionsTable);
      return rows.map(rowToConnection);
    }
    return readJson(connectionsFile, []);
  }

  async getConnectionsByUserId(userId: string): Promise<PlaidConnection[]> {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(connectionsTable)
        .where(and(eq(connectionsTable.user_id, userId), eq(connectionsTable.is_active, true)));
      return rows.map(rowToConnection);
    }
    const conns = readJson<PlaidConnection[]>(connectionsFile, []);
    return conns.filter((c) => c.user_id === userId && c.is_active);
  }

  async getConnectionByItemId(itemId: string): Promise<PlaidConnection | null> {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(connectionsTable)
        .where(and(eq(connectionsTable.item_id, itemId), eq(connectionsTable.is_active, true)));
      return rows.length > 0 ? rowToConnection(rows[0]) : null;
    }
    const conns = readJson<PlaidConnection[]>(connectionsFile, []);
    return conns.find((c) => c.item_id === itemId && c.is_active) || null;
  }

  async createPlaidConnection(
    userId: string,
    accessToken: string,
    itemId: string,
    institutionName?: string,
    institutionId?: string,
    accounts: PlaidAccount[] = []
  ): Promise<PlaidConnection> {
    const db = getDb();
    if (db) {
      const rows = await db
        .insert(connectionsTable)
        .values({
          user_id: userId,
          access_token: accessToken,
          item_id: itemId,
          institution_name: institutionName,
          institution_id: institutionId,
          accounts,
        })
        .returning();
      const conn = rowToConnection(rows[0]);
      console.log(`✅ Created Plaid connection: ${conn.id} for user: ${userId}`);
      return conn;
    }

    const conns = readJson<PlaidConnection[]>(connectionsFile, []);
    const now = new Date().toISOString();
    const newConn: PlaidConnection = {
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
    conns.push(newConn);
    writeJson(connectionsFile, conns);
    console.log(`✅ Created Plaid connection: ${newConn.id} for user: ${userId}`);
    return newConn;
  }

  async updatePlaidConnection(
    itemId: string,
    updates: Partial<PlaidConnection>
  ): Promise<PlaidConnection | null> {
    const db = getDb();
    if (db) {
      const setValues: Record<string, any> = {};
      if (updates.institution_name !== undefined) setValues.institution_name = updates.institution_name;
      if (updates.institution_id !== undefined) setValues.institution_id = updates.institution_id;
      if (updates.accounts !== undefined) setValues.accounts = updates.accounts;
      if (updates.last_synced !== undefined) setValues.last_synced = new Date(updates.last_synced);
      if (updates.is_active !== undefined) setValues.is_active = updates.is_active;

      const rows = await db
        .update(connectionsTable)
        .set(setValues)
        .where(eq(connectionsTable.item_id, itemId))
        .returning();
      return rows.length > 0 ? rowToConnection(rows[0]) : null;
    }

    const conns = readJson<PlaidConnection[]>(connectionsFile, []);
    const idx = conns.findIndex((c) => c.item_id === itemId);
    if (idx === -1) return null;
    conns[idx] = { ...conns[idx], ...updates, updated_at: new Date().toISOString() } as any;
    writeJson(connectionsFile, conns);
    return conns[idx];
  }

  async updateLastSynced(itemId: string): Promise<void> {
    await this.updatePlaidConnection(itemId, {
      last_synced: new Date().toISOString(),
    });
  }

  async deactivateConnection(itemId: string): Promise<boolean> {
    const updated = await this.updatePlaidConnection(itemId, { is_active: false });
    return updated !== null;
  }

  // ---- Utility ----

  async getAllData(): Promise<StorageData> {
    return {
      users: await this.getUsers(),
      plaid_connections: await this.getPlaidConnections(),
      version: "1.0.0",
    };
  }

  async exportData(filename: string = "backup.json"): Promise<void> {
    const data = await this.getAllData();
    const backupPath = path.join(dataDir, filename);
    writeJson(backupPath, data);
    console.log(`✅ Data exported to: ${backupPath}`);
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalConnections: number;
    activeConnections: number;
  }> {
    const users = await this.getUsers();
    const connections = await this.getPlaidConnections();
    return {
      totalUsers: users.length,
      totalConnections: connections.length,
      activeConnections: connections.filter((c) => c.is_active).length,
    };
  }
}

export const storage = new Storage();
