-- Migration: Add RLS policies for nets_sessions and nets_statistics tables
-- This allows public access to read, insert, update, and delete operations
-- Since this is a single-user application, we use permissive policies

BEGIN;

-- Enable RLS on nets_sessions table
ALTER TABLE nets_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on nets_statistics table
ALTER TABLE nets_statistics ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for nets_sessions
-- Allow all operations (SELECT, INSERT, UPDATE, DELETE) for everyone
CREATE POLICY "Allow all operations on nets_sessions"
  ON nets_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create permissive policies for nets_statistics
-- Allow all operations (SELECT, INSERT, UPDATE, DELETE) for everyone
CREATE POLICY "Allow all operations on nets_statistics"
  ON nets_statistics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON POLICY "Allow all operations on nets_sessions" ON nets_sessions IS 
  'Permissive policy allowing all CRUD operations for single-user application';

COMMENT ON POLICY "Allow all operations on nets_statistics" ON nets_statistics IS 
  'Permissive policy allowing all CRUD operations for single-user application';

COMMIT;
