# Database Scripts

This directory contains utility scripts for database maintenance and data repair.

## Session Date Repair Utility

### Overview

The session date repair utility helps maintain data consistency between the `nets_statistics` and `nets_sessions` tables. It detects and repairs cases where the denormalized `session_date` field in `nets_statistics` doesn't match the actual date in `nets_sessions`.

### Files

- **`repairSessionDates.js`** - Node.js script to detect and repair inconsistencies
- **`validateSessionDates.sql`** - SQL queries for manual validation
- **`runMigration.js`** - Script to run database migrations

---

## repairSessionDates.js

### Purpose

Automatically detects and repairs session_date inconsistencies in the database.

### Usage

```bash
# Run from the my-cricket-app directory
node src/scripts/repairSessionDates.js [options]
```

### Options

- `--dry-run` - Show what would be repaired without making changes
- `--verbose` - Show detailed information about each inconsistent record

### Examples

```bash
# Check for inconsistencies without making changes
node src/scripts/repairSessionDates.js --dry-run

# Check with detailed output
node src/scripts/repairSessionDates.js --dry-run --verbose

# Repair all inconsistencies
node src/scripts/repairSessionDates.js

# Repair with detailed output
node src/scripts/repairSessionDates.js --verbose
```

### What It Does

1. **Detects Mismatched Dates** - Finds records where `session_date` doesn't match `nets_sessions.date`
2. **Finds Missing Dates** - Identifies records with NULL `session_date`
3. **Repairs Inconsistencies** - Updates all inconsistent records to sync with `nets_sessions.date`
4. **Reports Results** - Provides a summary of findings and repairs

### Output Example

```
═══════════════════════════════════════════════════════
  Session Date Repair Utility
═══════════════════════════════════════════════════════

🔍 Running in DRY RUN mode (no changes will be made)

🔍 Detecting session_date inconsistencies...

⚠️  Found 3 inconsistent record(s):

Record ID | Session ID | Current Date | Actual Date
----------|------------|--------------|------------
a1b2c3d4... | e5f6g7h8... | 2024-01-15 | 2024-01-16
i9j0k1l2... | m3n4o5p6... | NULL | 2024-01-17
q7r8s9t0... | u1v2w3x4... | 2024-01-18 | 2024-01-19

🔧 Would repair 3 record(s)...

═══════════════════════════════════════════════════════
  Repair Summary
═══════════════════════════════════════════════════════

Total inconsistencies found: 3
Successfully repaired: 3
Failed to repair: 0

💡 Run without --dry-run to apply these changes
```

### Requirements

- Node.js environment
- `.env` file with Supabase credentials:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`

### When to Use

- After manual data imports or bulk updates
- If you suspect data inconsistencies
- As part of regular database maintenance
- After recovering from a backup
- If database triggers were temporarily disabled

---

## validateSessionDates.sql

### Purpose

Provides SQL queries for manual validation and inspection of session_date consistency.

### Usage

1. Open Supabase SQL Editor (or any PostgreSQL client)
2. Copy the desired query from `validateSessionDates.sql`
3. Run the query
4. Review the results

### Available Queries

#### Query 1: Find Mismatched Dates
Finds all records where `session_date` doesn't match the actual session date.

```sql
SELECT ns.id, ns.session_date, s.date AS actual_date
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.session_date != s.date;
```

#### Query 2: Find Missing Dates
Finds all records with NULL `session_date`.

```sql
SELECT ns.id, ns.session_id, s.date AS actual_date
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.session_date IS NULL;
```

#### Query 3: Count Inconsistencies
Provides a summary count of each type of inconsistency.

#### Query 4: Find Orphaned Records
Finds records that reference non-existent sessions (should not happen due to foreign key constraints).

#### Query 5: Validation Status
Returns a simple PASS/FAIL validation result.

```sql
-- Returns 'PASS' if all records are consistent
SELECT 
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.session_date != s.date OR ns.session_date IS NULL;
```

#### Query 6: Detailed Report with Player Names
Provides a detailed report including player names for easier identification.

#### Query 7: Check Recent Trigger Functionality
Verifies that sync triggers are working correctly by checking recent records.

### When to Use

- For quick manual checks in Supabase dashboard
- To investigate specific inconsistencies
- To verify trigger functionality
- As part of database health monitoring
- Before and after running repair scripts

---

## runMigration.js

### Purpose

Runs database migration scripts to update the schema.

### Usage

```bash
node src/scripts/runMigration.js <migration-file>
```

### Example

```bash
node src/scripts/runMigration.js supabase/migrations/004_enhance_nets_statistics.sql
```

---

## Best Practices

### Regular Maintenance

1. **Run validation queries weekly** to catch inconsistencies early
2. **Use dry-run mode first** before applying repairs
3. **Review verbose output** to understand what's being changed
4. **Keep backups** before running repair scripts

### Troubleshooting

If inconsistencies persist after repair:

1. Check that database triggers are enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%session_date%';
   ```

2. Verify trigger functions exist:
   ```sql
   SELECT * FROM pg_proc WHERE proname LIKE '%session_date%';
   ```

3. Test trigger functionality with a new record:
   ```sql
   INSERT INTO nets_statistics (session_id, player_id, nets_attended)
   VALUES ('existing-session-id', 'existing-player-id', true);
   
   -- Check if session_date was populated
   SELECT session_date FROM nets_statistics WHERE id = 'new-record-id';
   ```

### Prevention

The database triggers should prevent inconsistencies from occurring:

- **On INSERT**: `sync_session_date_on_insert()` automatically populates `session_date`
- **On UPDATE**: `sync_session_date_on_session_update()` keeps dates synchronized

If you need to temporarily disable triggers (not recommended):

```sql
-- Disable trigger
ALTER TABLE nets_statistics DISABLE TRIGGER trigger_sync_session_date_insert;

-- Re-enable trigger
ALTER TABLE nets_statistics ENABLE TRIGGER trigger_sync_session_date_insert;
```

**Important**: Always run the repair script after re-enabling triggers to fix any inconsistencies that occurred while triggers were disabled.

---

## Support

For issues or questions:

1. Check the validation queries to understand the scope of the problem
2. Run the repair script with `--dry-run --verbose` to see what would be changed
3. Review the database trigger definitions in the migration files
4. Check application logs for any errors during data operations
