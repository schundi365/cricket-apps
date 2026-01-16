-- Create players table
-- This table stores player information from Play Cricket and local data
-- Requirements: 2.1

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  play_cricket_id TEXT UNIQUE,
  name TEXT NOT NULL,
  team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on play_cricket_id for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_players_play_cricket_id ON players(play_cricket_id);

-- Create index on name for faster player searches
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);

-- Add comment to table
COMMENT ON TABLE players IS 'Stores player information including data synced from Play Cricket website';
COMMENT ON COLUMN players.id IS 'Primary key UUID';
COMMENT ON COLUMN players.play_cricket_id IS 'Unique identifier from Play Cricket website (optional)';
COMMENT ON COLUMN players.name IS 'Player full name';
COMMENT ON COLUMN players.team IS 'Team or squad assignment';
COMMENT ON COLUMN players.created_at IS 'Timestamp when player record was created';
COMMENT ON COLUMN players.updated_at IS 'Timestamp when player record was last updated';
