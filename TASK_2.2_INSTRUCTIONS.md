# Task 2.2: Apply Skills Ratings Table Migration

## Quick Start

### 1. Apply the Migration

1. Open [Supabase Dashboard](https://supabase.com) and log in
2. Select your MK Air Cricket Tracker project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file: `supabase/migrations/002_create_skills_ratings_table.sql`
6. Copy the entire contents
7. Paste into the SQL Editor
8. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
9. You should see: "Success. No rows returned"

### 2. Verify the Migration

**Quick Verification (SQL)**:
```sql
-- Check if table exists
SELECT * FROM skills_ratings LIMIT 1;
```

If you see column headers (even with no data), the table was created successfully! ✅

**Detailed Verification (React Component)**:

Add this to your App.js temporarily:
```javascript
import { VerifySkillsRatingsTable } from './components/VerifySkillsRatingsTable';

// In your component:
<VerifySkillsRatingsTable />
```

Then:
1. Start your app: `npm start`
2. Navigate to the verification component
3. Click "Run Verification Tests"
4. All tests should pass ✅

### 3. What Was Created

The migration created a `skills_ratings` table with:

- **Columns**: id, player_id, batting, bowling, fielding, fitness, created_at, updated_at
- **Foreign Key**: player_id → players(id) with CASCADE delete
- **Check Constraints**: All ratings must be 0-10
- **Index**: Fast lookups by player_id

### 4. Test the Table (Optional)

Try inserting a test rating in Supabase SQL Editor:

```sql
-- First, get a player ID
SELECT id, name FROM players LIMIT 1;

-- Insert a rating (replace YOUR-PLAYER-ID with actual ID)
INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('YOUR-PLAYER-ID', 7, 6, 8, 9)
RETURNING *;

-- Query it back
SELECT 
  sr.*,
  p.name as player_name
FROM skills_ratings sr
JOIN players p ON p.id = sr.player_id;

-- Clean up
DELETE FROM skills_ratings WHERE player_id = 'YOUR-PLAYER-ID';
```

### 5. Test Constraints (Optional)

These should fail with constraint violations:

```sql
-- Should fail: rating > 10
INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('YOUR-PLAYER-ID', 11, 5, 5, 5);

-- Should fail: rating < 0
INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('YOUR-PLAYER-ID', -1, 5, 5, 5);

-- Should fail: invalid player_id
INSERT INTO skills_ratings (player_id, batting, bowling, fielding, fitness)
VALUES ('00000000-0000-0000-0000-000000000000', 5, 5, 5, 5);
```

## Troubleshooting

### Error: "relation 'skills_ratings' already exists"
✅ The table is already created! You can skip the migration.

### Error: "relation 'players' does not exist"
❌ You need to run migration 001 first:
1. Run `supabase/migrations/001_create_players_table.sql`
2. Then run this migration

### Error: "permission denied"
❌ Make sure you're logged in as the project owner in Supabase.

### Verification tests fail
1. Check that the migration ran successfully (no errors in SQL Editor)
2. Make sure you have at least one player in the players table
3. Check the detailed error messages in the test output

## Files Created

- ✅ `supabase/migrations/002_create_skills_ratings_table.sql` - Migration file
- ✅ `src/lib/verifySkillsRatingsTable.js` - Verification utility
- ✅ `src/components/VerifySkillsRatingsTable.jsx` - Verification UI
- ✅ `src/lib/verifySkillsRatingsTable.test.js` - Unit tests
- ✅ `TASK_2.2_COMPLETION_SUMMARY.md` - Detailed documentation

## Next Steps

After verifying this migration works:
1. Proceed to **Task 2.3**: Create nets_sessions and nets_statistics tables
2. Or continue with other tasks in the implementation plan

## Need Help?

- Check `TASK_2.2_COMPLETION_SUMMARY.md` for detailed documentation
- Review `supabase/migrations/README.md` for general migration instructions
- Run the verification component to see detailed test results
