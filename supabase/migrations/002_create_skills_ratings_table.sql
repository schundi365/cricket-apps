-- Create skills_ratings table
-- This table stores player skill ratings for batting, bowling, fielding, and fitness
-- Requirements: 2.2

CREATE TABLE IF NOT EXISTS skills_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  batting INTEGER NOT NULL CHECK (batting >= 0 AND batting <= 10),
  bowling INTEGER NOT NULL CHECK (bowling >= 0 AND bowling <= 10),
  fielding INTEGER NOT NULL CHECK (fielding >= 0 AND fielding <= 10),
  fitness INTEGER NOT NULL CHECK (fitness >= 0 AND fitness <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on player_id for faster lookups when fetching ratings for a player
CREATE INDEX IF NOT EXISTS idx_skills_ratings_player_id ON skills_ratings(player_id);

-- Add comments to table and columns
COMMENT ON TABLE skills_ratings IS 'Stores skill ratings for players across four categories';
COMMENT ON COLUMN skills_ratings.id IS 'Primary key UUID';
COMMENT ON COLUMN skills_ratings.player_id IS 'Foreign key reference to players table';
COMMENT ON COLUMN skills_ratings.batting IS 'Batting skill rating (0-10)';
COMMENT ON COLUMN skills_ratings.bowling IS 'Bowling skill rating (0-10)';
COMMENT ON COLUMN skills_ratings.fielding IS 'Fielding skill rating (0-10)';
COMMENT ON COLUMN skills_ratings.fitness IS 'Fitness rating (0-10)';
COMMENT ON COLUMN skills_ratings.created_at IS 'Timestamp when rating record was created';
COMMENT ON COLUMN skills_ratings.updated_at IS 'Timestamp when rating record was last updated';
