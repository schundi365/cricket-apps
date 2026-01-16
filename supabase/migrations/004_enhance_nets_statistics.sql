-- Migration: Enhance nets_statistics table with denormalized session_date, behavioral tracking, and points system
-- This migration adds new columns for improved query performance and comprehensive player tracking
-- Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.8

BEGIN;

-- Step 1: Add new columns to nets_statistics table
ALTER TABLE nets_statistics
  ADD COLUMN IF NOT EXISTS session_date DATE,
  ADD COLUMN IF NOT EXISTS works_on_technique BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS punctual_to_training BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS batting_points INTEGER DEFAULT 0 CHECK (batting_points >= 0),
  ADD COLUMN IF NOT EXISTS bowling_points INTEGER DEFAULT 0 CHECK (bowling_points >= 0),
  ADD COLUMN IF NOT EXISTS fielding_points INTEGER DEFAULT 0 CHECK (fielding_points >= 0),
  ADD COLUMN IF NOT EXISTS technique_points INTEGER DEFAULT 0 CHECK (technique_points >= 0),
  ADD COLUMN IF NOT EXISTS punctuality_points INTEGER DEFAULT 0 CHECK (punctuality_points >= 0);

-- Step 2: Backfill session_date from nets_sessions for existing records
UPDATE nets_statistics ns
SET session_date = s.session_date
FROM nets_sessions s
WHERE ns.session_id = s.id
  AND ns.session_date IS NULL;

-- Step 3: Rename attended column to nets_attended
ALTER TABLE nets_statistics
  RENAME COLUMN attended TO nets_attended;

-- Step 4: Create index on session_date for query performance
CREATE INDEX IF NOT EXISTS idx_nets_statistics_session_date 
  ON nets_statistics(session_date DESC);

-- Step 5: Create trigger function to sync session_date on insert
CREATE OR REPLACE FUNCTION sync_session_date_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Populate session_date from nets_sessions.session_date
  SELECT session_date INTO NEW.session_date
  FROM nets_sessions
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create BEFORE INSERT trigger on nets_statistics
DROP TRIGGER IF EXISTS trigger_sync_session_date_insert ON nets_statistics;
CREATE TRIGGER trigger_sync_session_date_insert
  BEFORE INSERT ON nets_statistics
  FOR EACH ROW
  EXECUTE FUNCTION sync_session_date_on_insert();

-- Step 6: Create trigger function to sync session_date on nets_sessions update
CREATE OR REPLACE FUNCTION sync_session_date_on_session_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session_date in all related nets_statistics records
  IF NEW.session_date != OLD.session_date THEN
    UPDATE nets_statistics
    SET session_date = NEW.session_date,
        updated_at = NOW()
    WHERE session_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AFTER UPDATE trigger on nets_sessions
DROP TRIGGER IF EXISTS trigger_sync_session_date_update ON nets_sessions;
CREATE TRIGGER trigger_sync_session_date_update
  AFTER UPDATE ON nets_sessions
  FOR EACH ROW
  WHEN (OLD.session_date IS DISTINCT FROM NEW.session_date)
  EXECUTE FUNCTION sync_session_date_on_session_update();

-- Step 7: Create trigger function to auto-calculate behavioral points
CREATE OR REPLACE FUNCTION calculate_behavioral_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate technique_points based on works_on_technique
  NEW.technique_points := CASE WHEN NEW.works_on_technique THEN 1 ELSE 0 END;
  
  -- Calculate punctuality_points based on punctual_to_training
  NEW.punctuality_points := CASE WHEN NEW.punctual_to_training THEN 1 ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create BEFORE INSERT OR UPDATE trigger on nets_statistics
DROP TRIGGER IF EXISTS trigger_calculate_behavioral_points ON nets_statistics;
CREATE TRIGGER trigger_calculate_behavioral_points
  BEFORE INSERT OR UPDATE ON nets_statistics
  FOR EACH ROW
  EXECUTE FUNCTION calculate_behavioral_points();

-- Step 8: Add column comments for documentation
COMMENT ON COLUMN nets_statistics.session_date IS 'Denormalized date from nets_sessions for query performance';
COMMENT ON COLUMN nets_statistics.nets_attended IS 'Whether the player attended the session';
COMMENT ON COLUMN nets_statistics.works_on_technique IS 'Whether player worked on technique during session';
COMMENT ON COLUMN nets_statistics.punctual_to_training IS 'Whether player arrived on time to session';
COMMENT ON COLUMN nets_statistics.batting_points IS 'Points awarded for batting performance';
COMMENT ON COLUMN nets_statistics.bowling_points IS 'Points awarded for bowling performance';
COMMENT ON COLUMN nets_statistics.fielding_points IS 'Points awarded for fielding performance';
COMMENT ON COLUMN nets_statistics.technique_points IS 'Points awarded for technique work (1 if works_on_technique, 0 otherwise)';
COMMENT ON COLUMN nets_statistics.punctuality_points IS 'Points awarded for punctuality (1 if punctual_to_training, 0 otherwise)';

COMMIT;
