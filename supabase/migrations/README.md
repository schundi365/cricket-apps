# Database Migrations Guide

This directory contains SQL migration files for the Supabase database schema.

## How to Run Migrations

Since we're using Supabase's hosted service, migrations need to be run manually through the Supabase SQL Editor.

### Step-by-Step Instructions

1. **Log in to Supabase Dashboard**
   - Go to [https://supabase.com](https://supabase.com)
   - Log in to your account
   - Select your project (MK Air Cricket Tracker)

2. **Open the SQL Editor**
   - Click on the **SQL Editor** icon in the left sidebar (looks like a database with a play button)
   - Click **New query** to create a new SQL query

3. **Run the Migration**
   - Open the migration file you want to run (e.g., `001_create_players_table.sql`)
   - Copy the entire contents of the SQL file
   - Paste it into the SQL Editor in Supabase
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)

4. **Verify the Migration**
   - After running the migration, you should see a success message
   - Click on **Table Editor** in the left sidebar
   - You should see the newly created table(s) listed

### Migration Files

Run these migrations in order:

1. **001_create_players_table.sql** - Creates the players table with basic player information
2. **002_create_skills_ratings_table.sql** - Creates the skills_ratings table with foreign key to players
3. **003_create_nets_tables.sql** - Creates nets_sessions and nets_statistics tables
4. **004_setup_rls_policies.sql** - Sets up Row Level Security policies (coming next)

### Troubleshooting

**Error: "relation already exists"**
- This means the table has already been created
- You can safely ignore this error or drop the table first if you want to recreate it

**Error: "permission denied"**
- Make sure you're logged in as the project owner
- Check that you're in the correct project

**Error: "syntax error"**
- Make sure you copied the entire SQL file contents
- Check that there are no extra characters or formatting issues

### Verifying the Players Table

After running `001_create_players_table.sql`, you can verify it was created correctly:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'players';

-- Test inserting a sample player (optional)
INSERT INTO players (name, team, play_cricket_id)
VALUES ('Test Player', 'First XI', 'test123')
RETURNING *;

-- Query the player back
SELECT * FROM players WHERE name = 'Test Player';

-- Clean up test data (optional)
DELETE FROM players WHERE name = 'Test Player';
```

### Verifying the Skills Ratings Table

After running `002_create_skills_ratings_table.sql`, you can verify it was created correctly:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'skills_ratings'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'skills_ratings';

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'skills_ratings';

-- Check check constraints
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'skills_ratings'
    AND con.contype = 'c';

-- Test inserting a sample rating (requires a player first)
-- First, create a test player
INSERT INTO players (name, team)
VALUES ('Test Player for Rating', 'Test Team')
RETURNING id;

-- Use the returned ID in the next query (replace the UUID)
INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('YOUR-PLAYER-ID-HERE', 7, 6, 8, 9)
RETURNING *;

-- Test check constraints (should fail)
INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('YOUR-PLAYER-ID-HERE', 11, 5, 5, 5); -- Should fail: batting > 10

INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('YOUR-PLAYER-ID-HERE', -1, 5, 5, 5); -- Should fail: batting < 0

-- Clean up test data
DELETE FROM players WHERE name = 'Test Player for Rating';
-- Note: The rating will be automatically deleted due to CASCADE
```

You can also use the verification component in the React app:
- Import and render `<VerifySkillsRatingsTable />` component
- Click "Run Verification Tests" to automatically test all constraints

### Verifying the Nets Tables

After running `003_create_nets_tables.sql`, you can verify it was created correctly:

```sql
-- Check nets_sessions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nets_sessions'
ORDER BY ordinal_position;

-- Check nets_statistics table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'nets_statistics'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('nets_sessions', 'nets_statistics');

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'nets_statistics';

-- Check unique constraint
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'nets_statistics'
    AND con.contype = 'u';

-- Test inserting a sample session
INSERT INTO nets_sessions (date, notes)
VALUES (CURRENT_DATE, 'Test session')
RETURNING *;

-- Use the returned session ID in the next query (replace the UUID)
-- First, get a player ID
SELECT id FROM players LIMIT 1;

-- Test inserting a sample statistic (replace the UUIDs)
INSERT INTO nets_statistics (session_id, player_id, attended, dismissals, wickets, extras)
VALUES ('YOUR-SESSION-ID-HERE', 'YOUR-PLAYER-ID-HERE', true, 2, 3, 1)
RETURNING *;

-- Test unique constraint (should fail - duplicate session_id and player_id)
INSERT INTO nets_statistics (session_id, player_id, attended, dismissals, wickets, extras)
VALUES ('YOUR-SESSION-ID-HERE', 'YOUR-PLAYER-ID-HERE', false, 0, 0, 0);
-- Should fail with: duplicate key value violates unique constraint

-- Clean up test data
DELETE FROM nets_sessions WHERE notes = 'Test session';
-- Note: The statistics will be automatically deleted due to CASCADE
```

You can also use the verification component in the React app:
- Import and render `<VerifyNetsTables />` component
- Click "Run Verification Tests" to automatically test all constraints

## Alternative: Using Supabase CLI (Advanced)

If you prefer to use the command line, you can install the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

However, for this project, we recommend using the SQL Editor for simplicity.

## Notes

- Always run migrations in order (001, 002, 003, etc.)
- Keep a backup of your database before running migrations in production
- Test migrations in a development environment first
- Each migration file is idempotent where possible (uses `IF NOT EXISTS` clauses)

