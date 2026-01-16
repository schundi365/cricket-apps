-- Create nets_sessions and nets_statistics tables
-- These tables store nets practice session information and player statistics
-- Requirements: 2.3, 2.4

-- Create nets_sessions table
CREATE TABLE IF NOT EXISTS nets_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on date for faster lookups and sorting
CREATE INDEX IF NOT EXISTS idx_nets_sessions_date ON nets_sessions(date DESC);

-- Add comments to nets_sessions table
COMMENT ON TABLE nets_sessions IS 'Stores nets practice session information';
COMMENT ON COLUMN nets_sessions.id IS 'Primary key UUID';
COMMENT ON COLUMN nets_sessions.date IS 'Date of the nets session';
COMMENT ON COLUMN nets_sessions.notes IS 'Optional notes about the session';
COMMENT ON COLUMN nets_sessions.created_at IS 'Timestamp when session record was created';
COMMENT ON COLUMN nets_sessions.updated_at IS 'Timestamp when session record was last updated';

-- Create nets_statistics table
CREATE TABLE IF NOT EXISTS nets_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES nets_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT FALSE,
  dismissals INTEGER DEFAULT 0,
  wickets INTEGER DEFAULT 0,
  extras INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_player UNIQUE(session_id, player_id)
);

-- Create indexes on foreign keys for faster lookups
CREATE INDEX IF NOT EXISTS idx_nets_statistics_session_id ON nets_statistics(session_id);
CREATE INDEX IF NOT EXISTS idx_nets_statistics_player_id ON nets_statistics(player_id);

-- Add comments to nets_statistics table
COMMENT ON TABLE nets_statistics IS 'Stores player statistics for each nets session';
COMMENT ON COLUMN nets_statistics.id IS 'Primary key UUID';
COMMENT ON COLUMN nets_statistics.session_id IS 'Foreign key reference to nets_sessions table';
COMMENT ON COLUMN nets_statistics.player_id IS 'Foreign key reference to players table';
COMMENT ON COLUMN nets_statistics.attended IS 'Whether the player attended the session';
COMMENT ON COLUMN nets_statistics.dismissals IS 'Number of dismissals (for batters)';
COMMENT ON COLUMN nets_statistics.wickets IS 'Number of wickets taken (for bowlers)';
COMMENT ON COLUMN nets_statistics.extras IS 'Number of extras conceded';
COMMENT ON COLUMN nets_statistics.created_at IS 'Timestamp when statistic record was created';
COMMENT ON COLUMN nets_statistics.updated_at IS 'Timestamp when statistic record was last updated';
COMMENT ON CONSTRAINT unique_session_player ON nets_statistics IS 'Ensures each player has only one statistic record per session';
