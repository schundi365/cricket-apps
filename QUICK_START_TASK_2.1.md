# Quick Start: Task 2.1 - Create Players Table

## 🎯 What You Need to Do

Run the SQL migration in Supabase to create the players table.

## ⚡ Quick Steps

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Run Migration**
   - Open: `supabase/migrations/001_create_players_table.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Check Table Editor - you should see "players" table

## ✅ Verification

Run this query in SQL Editor to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'players';
```

Expected columns: id, play_cricket_id, name, team, created_at, updated_at

## 🔧 Optional: Test from Your App

Add this to your App.js temporarily:

```javascript
import VerifyPlayersTable from './components/VerifyPlayersTable';

// Add to your JSX:
<VerifyPlayersTable />
```

Then click "Run Verification Tests" in the UI.

## 📚 More Details

- Full instructions: `TASK_2.1_INSTRUCTIONS.md`
- Migration guide: `supabase/migrations/README.md`
- Completion summary: `TASK_2.1_COMPLETION_SUMMARY.md`

## ❓ Troubleshooting

**Error: "extension uuid-ossp does not exist"**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Error: "relation players already exists"**
- Table already created - you're done! ✓

## 🎉 Done?

Once the migration runs successfully:
- ✅ Mark Task 2.1 complete
- ➡️ Ready for Task 2.2: Create skills_ratings table
