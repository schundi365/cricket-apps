# Task 2.3: Create nets_sessions and nets_statistics Tables

## Overview

This task creates two new database tables for tracking nets practice sessions and player statistics:
- `nets_sessions`: Stores information about practice sessions
- `nets_statistics`: Stores player performance data for each session

## Files Created

1. **Migration File**: `supabase/migrations/003_create_nets_tables.sql`
   - SQL script to create both tables with all constraints and indexes

2. **Verification Utility**: `src/lib/verifyNetsTables.js`
   - JavaScript utility to verify tables were created correctly
   - Tests foreign keys, unique constraints, indexes, and CASCADE delete

3. **Verification Tests**: `src/lib/verifyNetsTables.test.js`
   - Unit tests for the verification utility

4. **React Component**: `src/components/VerifyNetsTables.jsx`
   - UI component to run verification tests from the browser

5. **Updated Documentation**: `supabase/migrations/README.md`
   - Added instructions for running and verifying the migration

## How to Apply the Migration

### Step 1: Log in to Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project (MK Air Cricket Tracker)

### Step 2: Open the SQL Editor

1. Click on the **SQL Editor** icon in the left sidebar
2. Click **New query** to create a new SQL query

### Step 3: Run the Migration

1. Open the file `supabase/migrations/003_create_nets_tables.sql`
2. Copy the entire contents of the SQL file
3. Paste it into the SQL Editor in Supabase
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify the Migration

You have two options to verify the migration was successful:

#### Option A: Using the React Component (Recommended)

1. Import the verification component in your React app:
   ```javascript
   import VerifyNetsTables from './components/VerifyNetsTables';
   ```

2. Render it in your app (e.g., in App.js):
   ```javascript
   <VerifyNetsTables />
   ```

3. Click "Run Verification Tests" button
4. Check that all tests pass (green checkmarks)
5. Open the browser console to see detailed test output

#### Option B: Using SQL Queries

Run these queries in the Supabase SQL Editor:

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
```

## Table Schemas

### nets_sessions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique session identifier |
| date | DATE | NOT NULL | Date of the practice session |
| notes | TEXT | NULL | Optional notes about the session |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record update timestamp |

**Indexes:**
- `idx_nets_sessions_date` on `date DESC` (for efficient date-based queries)

### nets_statistics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique statistic identifier |
| session_id | UUID | NOT NULL, FOREIGN KEY → nets_sessions(id) ON DELETE CASCADE | Reference to session |
| player_id | UUID | NOT NULL, FOREIGN KEY → players(id) ON DELETE CASCADE | Reference to player |
| attended | BOOLEAN | DEFAULT FALSE | Whether player attended |
| dismissals | INTEGER | DEFAULT 0 | Number of dismissals (batting) |
| wickets | INTEGER | DEFAULT 0 | Number of wickets taken (bowling) |
| extras | INTEGER | DEFAULT 0 | Number of extras conceded |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Record update timestamp |

**Constraints:**
- `unique_session_player` UNIQUE(session_id, player_id) - Ensures one statistic per player per session

**Indexes:**
- `idx_nets_statistics_session_id` on `session_id` (for efficient session queries)
- `idx_nets_statistics_player_id` on `player_id` (for efficient player queries)

## What the Verification Tests Check

The verification utility (`verifyNetsTables.js`) performs comprehensive tests:

1. **Table Existence**: Verifies both tables exist and can be queried
2. **Insert Operations**: Tests inserting sessions and statistics
3. **Foreign Key Constraints**: 
   - Accepts valid session_id and player_id
   - Rejects invalid foreign key references
4. **Unique Constraint**: Prevents duplicate (session_id, player_id) pairs
5. **Indexes**: Verifies queries by session_id, player_id, and date work efficiently
6. **CASCADE Delete**: 
   - Deleting a session deletes its statistics
   - Deleting a player deletes their statistics

## Expected Test Results

When you run the verification tests, you should see:

```
✓ nets_sessions table exists and can be queried
✓ nets_statistics table exists and can be queried
✓ Test player created with ID: [UUID]
✓ Can insert nets sessions successfully
✓ Can insert nets statistics successfully
✓ Foreign key constraints work (accepted valid session_id and player_id)
✓ Foreign key constraint properly rejects invalid session_id
✓ Foreign key constraint properly rejects invalid player_id
✓ Unique constraint properly prevents duplicate (session_id, player_id) pairs
✓ Can query by session_id, player_id, and date (indexes should optimize these)
✓ CASCADE delete works (statistic deleted when session deleted)
✓ CASCADE delete works (statistic deleted when player deleted)

=== Overall Result ===
✓ All tests passed!
```

## Troubleshooting

### Error: "relation already exists"
- The tables have already been created
- You can safely ignore this error or drop the tables first if you want to recreate them

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check that you're in the correct project

### Error: "syntax error"
- Make sure you copied the entire SQL file contents
- Check that there are no extra characters or formatting issues

### Tests fail with "table does not exist"
- Make sure you ran the migration in Supabase SQL Editor first
- Check that you're connected to the correct Supabase project
- Verify your `.env` file has the correct `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`

### Foreign key tests fail
- Make sure the `players` table exists (run migration 001 first)
- Check that the foreign key constraints were created correctly

## Next Steps

After successfully creating and verifying these tables, you can proceed to:

1. **Task 2.4**: Write property test for foreign key constraints
2. **Task 2.5**: Set up Row Level Security policies
3. **Task 3.x**: Implement the Player Sync Service
4. **Task 5.x**: Create data access layer with custom hooks

## Requirements Satisfied

This task satisfies the following requirements from the spec:

- **Requirement 2.3**: Database SHALL define a nets_sessions table with fields for session_id, date, and session metadata
- **Requirement 2.4**: Database SHALL define a nets_statistics table with fields for session_id, player_id, attendance, dismissals, wickets, and extras
- **Requirement 2.5**: Database SHALL enforce foreign key constraints between players and their related data (partially - tested in task 2.4)
- **Requirement 2.6**: Database SHALL create indexes on frequently queried fields for performance optimization

## Notes

- The migration uses `IF NOT EXISTS` clauses to make it idempotent (safe to run multiple times)
- All tables include `created_at` and `updated_at` timestamps for audit trails
- The CASCADE delete ensures referential integrity when sessions or players are deleted
- The unique constraint prevents duplicate statistics for the same player in the same session
- Indexes are created on foreign keys and the date field for optimal query performance
