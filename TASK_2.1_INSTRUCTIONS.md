# Task 2.1: Create Players Table - Instructions

This document provides step-by-step instructions for completing Task 2.1: Create players table with schema from design.

## Overview

We need to create the `players` table in Supabase with the following schema:
- `id` (UUID, primary key)
- `play_cricket_id` (TEXT, unique, optional)
- `name` (TEXT, required)
- `team` (TEXT, optional)
- `created_at` (TIMESTAMPTZ, auto-generated)
- `updated_at` (TIMESTAMPTZ, auto-generated)

## Prerequisites

- Supabase project created and configured (Task 1 completed)
- Environment variables set in `.env` file
- Access to Supabase dashboard

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Open your browser and go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project (MK Air Cricket Tracker)
4. Click on **SQL Editor** in the left sidebar (database icon with play button)
5. Click **New query** button

### 2. Run the Migration SQL

1. Open the file: `supabase/migrations/001_create_players_table.sql`
2. Copy the entire contents of the file
3. Paste it into the SQL Editor in Supabase
4. Click the **Run** button (or press Ctrl+Enter on Windows/Linux, Cmd+Enter on Mac)
5. Wait for the query to complete

### 3. Verify Success

You should see a success message in the SQL Editor. The output should indicate:
- Table `players` created successfully
- Indexes created successfully
- Comments added successfully

### 4. Verify Table Structure

To verify the table was created correctly, run this query in the SQL Editor:

```sql
-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
```

Expected output:
| column_name      | data_type                   | is_nullable | column_default          |
|------------------|----------------------------|-------------|-------------------------|
| id               | uuid                       | NO          | uuid_generate_v4()      |
| play_cricket_id  | text                       | YES         | NULL                    |
| name             | text                       | NO          | NULL                    |
| team             | text                       | YES         | NULL                    |
| created_at       | timestamp with time zone   | YES         | now()                   |
| updated_at       | timestamp with time zone   | YES         | now()                   |

### 5. Verify Indexes

Run this query to check that indexes were created:

```sql
-- Check indexes
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'players';
```

Expected output should include:
- `players_pkey` (primary key on id)
- `players_play_cricket_id_key` (unique constraint on play_cricket_id)
- `idx_players_play_cricket_id` (index on play_cricket_id)
- `idx_players_name` (index on name)

### 6. Test the Table (Optional)

You can test inserting and querying data:

```sql
-- Insert a test player
INSERT INTO players (name, team, play_cricket_id)
VALUES ('John Smith', 'First XI', 'pc123')
RETURNING *;

-- Query the player
SELECT * FROM players WHERE name = 'John Smith';

-- Verify unique constraint works (this should fail)
INSERT INTO players (name, team, play_cricket_id)
VALUES ('Jane Doe', 'Second XI', 'pc123');
-- Expected: ERROR: duplicate key value violates unique constraint

-- Clean up test data
DELETE FROM players WHERE name = 'John Smith';
```

### 7. Verify from Application

1. Make sure your `.env` file has the correct Supabase credentials
2. Start your development server:
   ```bash
   cd my-cricket-app
   npm start
   ```
3. Open the browser console (F12)
4. The Supabase connection test should now succeed and recognize the players table

## Troubleshooting

### Error: "extension uuid-ossp does not exist"

If you get this error, run this first:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Then run the migration again.

### Error: "relation players already exists"

The table has already been created. You can either:
- Skip this step (table is already created)
- Drop and recreate the table (WARNING: this will delete all data):
  ```sql
  DROP TABLE IF EXISTS players CASCADE;
  ```
  Then run the migration again.

### Error: "permission denied"

Make sure you're logged in as the project owner and have the correct permissions.

## Verification Checklist

- [ ] SQL migration ran without errors
- [ ] Table `players` exists in Supabase
- [ ] Table has all 6 columns (id, play_cricket_id, name, team, created_at, updated_at)
- [ ] Primary key constraint on `id` exists
- [ ] Unique constraint on `play_cricket_id` exists
- [ ] Indexes on `play_cricket_id` and `name` exist
- [ ] Can insert a test player successfully
- [ ] Unique constraint prevents duplicate `play_cricket_id` values
- [ ] Application can connect to Supabase and query the players table

## Next Steps

Once this task is complete:
1. Mark Task 2.1 as complete
2. Proceed to Task 2.2: Create skills_ratings table with foreign key to players

## Files Created/Modified

- ✅ `supabase/migrations/001_create_players_table.sql` - SQL migration file
- ✅ `supabase/migrations/README.md` - General migrations guide
- ✅ `TASK_2.1_INSTRUCTIONS.md` - This instruction file

## Requirements Validated

This task validates **Requirement 2.1**:
> THE Database SHALL define a players table with fields for player_id, name, team, and metadata from Play Cricket

