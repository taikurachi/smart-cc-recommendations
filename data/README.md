# 📁 Data Directory

This directory contains sensitive user data and should **NEVER** be committed to version control.

## 🚨 Security Notice

The following files contain sensitive information:
- `users.json` - User account data
- `plaid_connections.json` - Plaid access tokens (HIGHLY SENSITIVE)
- `cc.json` - Scraped credit card data
- `backup-*.json` - Data backups

## 📋 File Structure

When the app runs, it will create these files automatically:

```
data/
├── README.md              # This file (safe to commit)
├── users.json             # User accounts (DO NOT COMMIT)
├── plaid_connections.json # Plaid tokens (DO NOT COMMIT)
├── cc.json               # Credit card data (DO NOT COMMIT)
└── backup-*.json         # Backups (DO NOT COMMIT)
```

## 🔧 Sample Data Formats

### users.json
```json
[
  {
    "id": "uuid-here",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### plaid_connections.json
```json
[
  {
    "id": "uuid-here",
    "user_id": "user-uuid-here",
    "access_token": "access-sandbox-xxx", 
    "item_id": "item-xxx",
    "institution_name": "Chase",
    "institution_id": "ins_56",
    "accounts": [
      {
        "account_id": "account-id",
        "name": "Chase Freedom",
        "type": "credit",
        "subtype": "credit card",
        "mask": "1234"
      }
    ],
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_synced": "2024-01-01T00:00:00.000Z",
    "is_active": true
  }
]
```

## 🛡️ Security Best Practices

1. **Never commit data files** - They're in `.gitignore`
2. **Regular backups** - Use the CLI: `npx tsx scripts/storage-cli.ts export`
3. **Monitor access** - Check who has access to your repository
4. **Rotate tokens** - If compromised, revoke Plaid connections
5. **Environment separation** - Use different data for dev/prod

## 🔄 Data Management

Use the CLI tool for safe data management:

```bash
# View statistics
npx tsx scripts/storage-cli.ts stats

# Backup data
npx tsx scripts/storage-cli.ts export backup-$(date +%Y%m%d).json

# View users (no sensitive data shown)
npx tsx scripts/storage-cli.ts users
```

## 🚨 If Data is Accidentally Committed

1. **Immediately revoke** all Plaid connections
2. **Remove from git history**: `git filter-branch` or BFG Repo-Cleaner
3. **Rotate all secrets** and access tokens
4. **Review repository access** and audit logs
5. **Update security practices**

## 📞 Need Help?

- Check the main `PLAID_STORAGE.md` for detailed documentation
- Use the CLI tool for safe data operations
- Never share access tokens or user data
