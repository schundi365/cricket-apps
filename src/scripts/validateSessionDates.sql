-- ============================================================================
-- Session Date Validation Queries
-- ============================================================================
-- 
-- This file contains SQL queries to validate session_date consistency
-- in the nets_statistics table. These queries can be run directly in
-- Supabase SQL Editor or any PostgreSQL client.
--
-- Usage:
--   1. Copy the desired query
--   2. Run it in Supabase SQL Editor
--   3. Review the results to identify inconsistencies
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Query 1: Find records with mismatched session_date
-- ----------------------------------------------------------------------------
-- This query finds all nets_statistics records where session_date doesn't
-- match the corresponding nets_sessions.date value
-- ----------------------------------------------------------------------------

SELECT 
  ns.id AS statistic_id,
  ns.session_id,
  ns.player_id,
  ns.session_date AS current_session_date,
  s.date AS actual_session_date,
  ns.updated_at
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.session_date != s.date
ORDER BY ns.updated_at DESC;


-- ----------------------------------------------------------------------------
-- Query 2: Find records with NULL session_date
-- ----------------------------------------------------------------------------
-- This query finds all nets_statistics records that are missing session_date
-- (should not happen after migration, but useful for validation)
-- ----------------------------------------------------------------------------

SELECT 
  ns.id AS statistic_id,
  ns.session_id,
  ns.player_id,
  ns.session_date AS current_session_date,
  s.date AS actual_session_date,
  ns.created_at
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.session_date IS NULL
ORDER BY ns.created_at DESC;


-- ----------------------------------------------------------------------------
-- Query 3: Count inconsistencies by type
-- ----------------------------------------------------------------------------
-- This query provides a summary of inconsistency types
-- ----------------------------------------------------------------------------

SELECT 
  'Mismatched Dates' AS issue_type,
  COUNT(*) AS count
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.session_date != s.date

UNION ALL

SELECT 
  'Missing Dates' AS issue_type,
  COUNT(*) AS count
FROM nets_statistics ns
WHERE ns.session_date IS NULL;


-- ----------------------------------------------------------------------------
-- Query 4: Find orphaned records (invalid session_id)
-- ----------------------------------------------------------------------------
-- This query finds nets_statistics records that reference non-existent sessions
-- (should not happen due to foreign key constraints, but useful for validation)
-- ----------------------------------------------------------------------------

SELECT 
  ns.id AS statistic_id,
  ns.session_id,
  ns.player_id,
  ns.session_date,
  ns.created_at
FROM nets_statistics ns
LEFT JOIN nets_sessions s ON ns.session_id = s.id
WHERE s.id IS NULL
ORDER BY ns.created_at DESC;


-- ----------------------------------------------------------------------------
-- Query 5: Validate all records are consistent
-- ----------------------------------------------------------------------------
-- This query returns a simple pass/fail validation result
-- Returns 'PASS' if all records are consistent, 'FAIL' otherwise
-- ----------------------------------------------------------------------------

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL'
  END AS validation_status,
  COUNT(*) AS inconsistent_records
FROM (
  -- Mismatched dates
  SELECT id FROM nets_statistics ns
  INNER JOIN nets_sessions s ON ns.session_id = s.id
  WHERE ns.session_date != s.date
  
  UNION
  
  -- Missing dates
  SELECT id FROM nets_statistics
  WHERE session_date IS NULL
) AS inconsistencies;


-- ----------------------------------------------------------------------------
-- Query 6: Detailed inconsistency report with player names
-- ----------------------------------------------------------------------------
-- This query provides a detailed report including player names for easier
-- identification of problematic records
-- ----------------------------------------------------------------------------

SELECT 
  ns.id AS statistic_id,
  s.date AS session_date_actual,
  ns.session_date AS session_date_stored,
  p.name AS player_name,
  p.id AS player_id,
  ns.session_id,
  ns.nets_attended,
  ns.updated_at,
  CASE 
    WHEN ns.session_date IS NULL THEN 'Missing Date'
    WHEN ns.session_date != s.date THEN 'Mismatched Date'
    ELSE 'Consistent'
  END AS issue_type
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
INNER JOIN players p ON ns.player_id = p.id
WHERE ns.session_date IS NULL OR ns.session_date != s.date
ORDER BY s.date DESC, p.name;


-- ----------------------------------------------------------------------------
-- Query 7: Check trigger functionality
-- ----------------------------------------------------------------------------
-- This query helps verify that the sync triggers are working correctly
-- by showing recent inserts/updates and their session_date values
-- ----------------------------------------------------------------------------

SELECT 
  ns.id AS statistic_id,
  ns.session_id,
  ns.session_date AS stored_date,
  s.date AS actual_date,
  CASE 
    WHEN ns.session_date = s.date THEN '✓ Consistent'
    ELSE '✗ Inconsistent'
  END AS status,
  ns.created_at,
  ns.updated_at
FROM nets_statistics ns
INNER JOIN nets_sessions s ON ns.session_id = s.id
WHERE ns.created_at > NOW() - INTERVAL '24 hours'
   OR ns.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY GREATEST(ns.created_at, ns.updated_at) DESC
LIMIT 50;
