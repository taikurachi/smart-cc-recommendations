import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  users as usersTable,
  plaidConnections as connectionsTable,
} from "../drizzle/schema";
import { User } from "./types";

type UserRow = typeof usersTable.$inferSelect;
type ConnectionRow = typeof connectionsTable.$inferSelect;
type ConnectionInsert = typeof connectionsTable.$inferInsert;

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


function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email ?? undefined,
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    updated_at:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  };
}

function rowToConnection(row: ConnectionRow): PlaidConnection {
  return {
    id: row.id,
    user_id: row.user_id,
    access_token: row.access_token,
    item_id: row.item_id,
    institution_name: row.institution_name ?? undefined,
    institution_id: row.institution_id ?? undefined,
    accounts: (row.accounts as PlaidAccount[]) ?? [],
    created_at:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    last_synced:
      row.last_synced instanceof Date
        ? row.last_synced.toISOString()
        : (row.last_synced ?? undefined),
    is_active: row.is_active,
  };
}

class Storage {
  private get db() {
    return getDb();
  }

  // ---- Users ----

  async getUsers(): Promise<User[]> {
    const rows = await this.db.select().from(usersTable);
    return rows.map(rowToUser);
  }

  async getUserById(userId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  }

  async createUser(email?: string): Promise<User> {
    const rows = await this.db
      .insert(usersTable)
      .values({ email })
      .returning();
    return rowToUser(rows[0]);
  }

  // ---- Plaid Connections ----

  async getPlaidConnections(): Promise<PlaidConnection[]> {
    const rows = await this.db.select().from(connectionsTable);
    return rows.map(rowToConnection);
  }

  async getConnectionsByUserId(userId: string): Promise<PlaidConnection[]> {
    const rows = await this.db
      .select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.user_id, userId),
          eq(connectionsTable.is_active, true)
        )
      );
    return rows.map(rowToConnection);
  }

  async getConnectionByItemId(
    itemId: string
  ): Promise<PlaidConnection | null> {
    const rows = await this.db
      .select()
      .from(connectionsTable)
      .where(
        and(
          eq(connectionsTable.item_id, itemId),
          eq(connectionsTable.is_active, true)
        )
      );
    return rows.length > 0 ? rowToConnection(rows[0]) : null;
  }

  async createPlaidConnection(
    userId: string,
    accessToken: string,
    itemId: string,
    institutionName?: string,
    institutionId?: string,
    accounts: PlaidAccount[] = []
  ): Promise<PlaidConnection> {
    const rows = await this.db
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
    return rowToConnection(rows[0]);
  }

  async updatePlaidConnection(
    itemId: string,
    updates: Partial<PlaidConnection>
  ): Promise<PlaidConnection | null> {
    const setValues: Partial<ConnectionInsert> = {};
    if (updates.institution_name !== undefined)
      setValues.institution_name = updates.institution_name;
    if (updates.institution_id !== undefined)
      setValues.institution_id = updates.institution_id;
    if (updates.accounts !== undefined) setValues.accounts = updates.accounts;
    if (updates.last_synced !== undefined)
      setValues.last_synced = new Date(updates.last_synced);
    if (updates.is_active !== undefined) setValues.is_active = updates.is_active;

    const rows = await this.db
      .update(connectionsTable)
      .set(setValues)
      .where(eq(connectionsTable.item_id, itemId))
      .returning();
    return rows.length > 0 ? rowToConnection(rows[0]) : null;
  }

  async updateLastSynced(itemId: string): Promise<void> {
    await this.updatePlaidConnection(itemId, {
      last_synced: new Date().toISOString(),
    });
  }

  async deactivateConnection(itemId: string): Promise<boolean> {
    const updated = await this.updatePlaidConnection(itemId, {
      is_active: false,
    });
    return updated !== null;
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
