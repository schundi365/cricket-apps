-- Migration: Update RLS policies to restrict access to authenticated users only
-- This migration replaces the permissive policies with authenticated-user-only policies
-- All data is shared among authenticated users (single club application)

BEGIN;

-- ============================================================================
-- DROP OLD PERMISSIVE POLICIES
-- ============================================================================

-- Drop old policies on nets_sessions
DROP POLICY IF EXISTS "Allow all operations on nets_sessions" ON nets_sessions;

-- Drop old policies on nets_statistics
DROP POLICY IF EXISTS "Allow all operations on nets_statistics" ON nets_statistics;

-- Drop old policies on players (if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON players;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON players;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON players;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON players;

-- Drop old policies on skills_ratings (if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON skills_ratings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON skills_ratings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON skills_ratings;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON skills_ratings;

-- Drop old policies on nets_data (if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON nets_data;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON nets_data;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON nets_data;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON nets_data;

-- Drop old policies on profiles (if they exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- ============================================================================
-- CREATE NEW AUTHENTICATED-USER POLICIES
-- ============================================================================

-- Players table: Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view all players"
  ON players FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert players"
  ON players FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update players"
  ON players FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete players"
  ON players FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Skills_ratings table: Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view all skills ratings"
  ON skills_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert skills ratings"
  ON skills_ratings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update skills ratings"
  ON skills_ratings FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete skills ratings"
  ON skills_ratings FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Nets_sessions table: Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view all nets sessions"
  ON nets_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert nets sessions"
  ON nets_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update nets sessions"
  ON nets_sessions FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete nets sessions"
  ON nets_sessions FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Nets_statistics table: Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view all nets statistics"
  ON nets_statistics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert nets statistics"
  ON nets_statistics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update nets statistics"
  ON nets_statistics FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete nets statistics"
  ON nets_statistics FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Nets_data table: Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view all nets data"
  ON nets_data FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert nets data"
  ON nets_data FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update nets data"
  ON nets_data FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete nets data"
  ON nets_data FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Skill_ratings table: Authenticated users can perform all operations
CREATE POLICY "Authenticated users can view all skill ratings"
  ON skill_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert skill ratings"
  ON skill_ratings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update skill ratings"
  ON skill_ratings FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete skill ratings"
  ON skill_ratings FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Profiles table: Users can only view and update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Authenticated users can view all players" ON players IS 
  'Allows authenticated users to view all players in the club';

COMMENT ON POLICY "Authenticated users can view all skills ratings" ON skills_ratings IS 
  'Allows authenticated users to view all skills ratings in the club';

COMMENT ON POLICY "Authenticated users can view all nets sessions" ON nets_sessions IS 
  'Allows authenticated users to view all nets sessions in the club';

COMMENT ON POLICY "Authenticated users can view all nets statistics" ON nets_statistics IS 
  'Allows authenticated users to view all nets statistics in the club';

COMMENT ON POLICY "Users can view their own profile" ON profiles IS 
  'Users can only view their own profile data';

COMMIT;
