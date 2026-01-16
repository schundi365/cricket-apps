-- Migration: Add player-level session details
-- This allows tracking amount due per player and skill ratings per session

BEGIN;

-- Add amount_due column to nets_statistics (player level, not session level)
ALTER TABLE nets_statistics
  ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2) DEFAULT 0 CHECK (amount_due >= 0);

-- Add session-specific skill ratings to track improvement
ALTER TABLE nets_statistics
  ADD COLUMN IF NOT EXISTS session_batting_rating INTEGER CHECK (session_batting_rating >= 0 AND session_batting_rating <= 10),
  ADD COLUMN IF NOT EXISTS session_bowling_rating INTEGER CHECK (session_bowling_rating >= 0 AND session_bowling_rating <= 10),
  ADD COLUMN IF NOT EXISTS session_fielding_rating INTEGER CHECK (session_fielding_rating >= 0 AND session_fielding_rating <= 10),
  ADD COLUMN IF NOT EXISTS session_fitness_rating INTEGER CHECK (session_fitness_rating >= 0 AND session_fitness_rating <= 10);

-- Add column comments for documentation
COMMENT ON COLUMN nets_statistics.amount_due IS 'Amount due from this player for this session';
COMMENT ON COLUMN nets_statistics.session_batting_rating IS 'Batting performance rating for this specific session (0-10)';
COMMENT ON COLUMN nets_statistics.session_bowling_rating IS 'Bowling performance rating for this specific session (0-10)';
COMMENT ON COLUMN nets_statistics.session_fielding_rating IS 'Fielding performance rating for this specific session (0-10)';
COMMENT ON COLUMN nets_statistics.session_fitness_rating IS 'Fitness performance rating for this specific session (0-10)';

-- Backfill existing records with 0 for amount_due
UPDATE nets_statistics
SET amount_due = 0
WHERE amount_due IS NULL;

COMMIT;
