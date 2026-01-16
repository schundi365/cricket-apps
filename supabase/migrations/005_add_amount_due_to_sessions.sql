-- Migration: Add amount_due field to nets_sessions table
-- This allows tracking of fees/amounts due for each nets session

BEGIN;

-- Add amount_due column to nets_sessions table
ALTER TABLE nets_sessions
  ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2) DEFAULT 0 CHECK (amount_due >= 0);

-- Add column comment for documentation
COMMENT ON COLUMN nets_sessions.amount_due IS 'Amount due for the nets session (e.g., fees, costs)';

-- Backfill existing records with 0
UPDATE nets_sessions
SET amount_due = 0
WHERE amount_due IS NULL;

COMMIT;
