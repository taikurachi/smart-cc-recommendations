# 🏦 Plaid Storage System

This document explains how user data and Plaid connections are stored and managed in the Smart Credit Card Recommendations app.

## 📁 Storage Structure

The app uses a simple file-based storage system that can easily be migrated to a database later:

```
data/
├── cc.json              # Credit card data from scraping
├── users.json           # User accounts
└── plaid_connections.json # Plaid access tokens and connection info
```

## 🔑 Key Components

### 1. Storage Library (`lib/storage.ts`)

- **Purpose**: Manages all user and Plaid connection data
- **Features**: CRUD operations, data validation, backup/export
- **Security**: Access tokens stored locally (encrypt in production)

### 2. API Endpoints

#### `/api/users`

- `GET` - List users or get user by ID/email
- `POST` - Create new user

#### `/api/plaid/exchange`

- `POST` - Exchange public token for access token and store connection
- **Enhanced**: Now stores institution info, accounts, and user association

#### `/api/plaid/transactions`

- `POST` - Fetch transactions using stored access tokens
- **Enhanced**: Can use userId or itemId to find stored tokens

#### `/api/plaid/connections`

- `GET` - List user's Plaid connections
- `DELETE` - Remove/deactivate connection

### 3. CLI Management (`scripts/storage-cli.ts`)

```bash
# View statistics
npx tsx scripts/storage-cli.ts stats

# List all users
npx tsx scripts/storage-cli.ts users

# View user details and connections
npx tsx scripts/storage-cli.ts user <userId>

# Create new user
npx tsx scripts/storage-cli.ts create-user john@example.com

# List connections
npx tsx scripts/storage-cli.ts connections [userId]

# Remove connection
npx tsx scripts/storage-cli.ts remove-connection <itemId>

# Export data backup
npx tsx scripts/storage-cli.ts export backup-2024-01-01.json
```

## 🔄 Data Flow

### First Time Connection:

1. User visits `/connect`
2. App creates user account (stored in `users.json`)
3. User connects bank via Plaid Link
4. App exchanges public token for access token
5. Connection stored in `plaid_connections.json` with:
   - Access token (for API calls)
   - Institution details
   - Account information
   - User association

### Returning User:

1. App loads user from localStorage
2. Displays connected banks from storage
3. Uses stored access tokens for transaction fetching
4. Updates last_synced timestamps

## 🛡️ Security Considerations

### Current (Development):

- ✅ Access tokens stored in local JSON files
- ✅ No sensitive bank credentials stored
- ✅ Plaid handles all bank authentication

### Production Recommendations:

- 🔒 Encrypt access tokens at rest
- 🔒 Use proper database with user authentication
- 🔒 Implement token rotation
- 🔒 Add rate limiting and monitoring
- 🔒 Use environment-specific secrets

## 📊 Data Schema

### User

```typescript
interface User {
  id: string; // UUID
  email?: string; // Optional email
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

### Plaid Connection

```typescript
interface PlaidConnection {
  id: string; // UUID
  user_id: string; // Links to User.id
  access_token: string; // Plaid access token (SENSITIVE)
  item_id: string; // Plaid item identifier
  institution_name?: string; // e.g., "Chase", "Bank of America"
  institution_id?: string; // Plaid institution ID
  accounts: PlaidAccount[]; // Associated accounts
  created_at: string; // ISO timestamp
  last_synced?: string; // Last transaction fetch
  is_active: boolean; // Connection status
}
```

### Plaid Account

```typescript
interface PlaidAccount {
  account_id: string; // Plaid account ID
  name: string; // Account name
  type: string; // Account type (depository, credit, etc.)
  subtype: string; // Account subtype (checking, savings, etc.)
  mask?: string; // Last 4 digits
}
```

## 🚀 Usage Examples

### Connect Bank Account (Frontend)

```typescript
// 1. Create link token
const response = await fetch("/api/plaid/link-token", {
  method: "POST",
  body: JSON.stringify({ userId: currentUserId }),
});

// 2. Use Plaid Link (handled by react-plaid-link)
// 3. Exchange token (automatically stores connection)
const exchangeResponse = await fetch("/api/plaid/exchange", {
  method: "POST",
  body: JSON.stringify({ publicToken, userId }),
});
```

### Fetch Transactions

```typescript
// Using stored connection
const response = await fetch("/api/plaid/transactions", {
  method: "POST",
  body: JSON.stringify({
    userId: "user-id", // Will use most recent connection
    months: 6, // Last 6 months
  }),
});
```

### Manage Data (CLI)

```bash
# Check system status
npx tsx scripts/storage-cli.ts stats

# View user's connections
npx tsx scripts/storage-cli.ts user 7c5cee40-ac39-451b-a668-552a1ad64573

# Backup all data
npx tsx scripts/storage-cli.ts export
```

## 🔄 Migration Path

When ready for production:

1. **Database Setup**: PostgreSQL/MySQL with proper schemas
2. **Authentication**: NextAuth.js or similar
3. **Encryption**: Encrypt access tokens with app secrets
4. **Monitoring**: Add logging and error tracking
5. **Backup**: Automated database backups

The current file-based system makes it easy to migrate data when ready!

## 🎯 Benefits

- ✅ **Simple**: Easy to understand and debug
- ✅ **Persistent**: User connections survive app restarts
- ✅ **Secure**: No bank credentials stored
- ✅ **Manageable**: CLI tools for administration
- ✅ **Scalable**: Easy migration path to database
- ✅ **Transparent**: JSON files are human-readable
