# Implementation Plan: Supabase Player Sync

## Overview

This implementation plan breaks down the Supabase integration and player synchronization feature into discrete, actionable coding tasks. Each task builds incrementally on previous work, with testing integrated throughout to catch errors early. The plan assumes the React app is already set up with Create React App and will be deployed to Firebase.

## Tasks

- [x] 1. Set up Supabase project and configuration
  - Create a new Supabase project at https://supabase.com
  - Copy the project URL and anon key
  - Create `.env` file with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
  - Install `@supabase/supabase-js` package
  - Create `src/lib/supabase.js` with client initialization and connection test function
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create database schema in Supabase
  - [x] 2.1 Create players table with schema from design
    - Use Supabase SQL editor to create table with id, play_cricket_id, name, team, timestamps
    - Add unique constraint on play_cricket_id
    - _Requirements: 2.1_
  
  - [x] 2.2 Create skills_ratings table with foreign key to players
    - Create table with player_id foreign key, batting, bowling, fielding, fitness ratings
    - Add check constraints for rating values (0-10)
    - Create index on player_id
    - _Requirements: 2.2_
  
  - [x] 2.3 Create nets_sessions and nets_statistics tables
    - Create nets_sessions table with id, date, notes
    - Create nets_statistics table with foreign keys to sessions and players
    - Add unique constraint on (session_id, player_id)
    - Create indexes on session_id and player_id
    - _Requirements: 2.3, 2.4_
  
  - [x] 2.4 Write property test for foreign key constraints
    - **Property 1: Foreign Key Referential Integrity**
    - **Validates: Requirements 2.5**
  
  - [x] 2.5 Set up Row Level Security policies
    - Enable RLS on all tables
    - Create policy for anonymous read access
    - Create policies for authenticated write access (if auth enabled)
    - _Requirements: 9.1, 9.4_

- [x] 3. Implement Player Sync Service
  - [x] 3.1 Create playerSyncService.js with HTTP fetch function
    - Implement `fetchPlayCricketSquads()` to fetch HTML from https://mkair.play-cricket.com/Teams
    - Add error handling for network failures and timeouts
    - _Requirements: 3.1, 7.3_
  
  - [x] 3.2 Implement HTML parsing to extract player data
    - Use DOMParser to parse HTML response
    - Extract player names and team assignments from DOM structure
    - Return array of player objects with name and team
    - _Requirements: 3.2_
  
  - [x] 3.3 Write property test for HTML parser
    - **Property 2: HTML Parser Extracts Player Data**
    - **Validates: Requirements 3.2**
  
  - [x] 3.4 Implement upsertPlayers function
    - Query existing players from Supabase
    - Compare fetched players with existing records
    - Insert new players, update changed teams, track unchanged
    - Return SyncResult with counts
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 3.5 Write property test for player upsert
    - **Property 3: Player Upsert Correctness**
    - **Validates: Requirements 3.3, 3.4**
  
  - [x] 3.6 Write property test for sync result accuracy
    - **Property 4: Sync Result Accuracy**
    - **Validates: Requirements 3.5, 8.4**
  
  - [x] 3.7 Implement main syncPlayersFromPlayCricket function
    - Combine fetch, parse, and upsert operations
    - Add comprehensive error handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Test player sync service
  - All player sync service tests are passing

- [x] 5. Create data access layer with custom hooks
  - [x] 5.1 Implement usePlayers hook
  - [x] 5.2 Implement useSkillsRatings hook
  - [x] 5.3 Write property test for skills rating persistence
  - [x] 5.4 Implement useNetsSessions and useNetsStatistics hooks
  - [x] 5.5 Write property test for nets statistics persistence
  - [x] 5.6 Implement useRealtimeSubscription hook

- [x] 6. Implement retry logic and error handling
  - [x] 6.1 Create retry utility with exponential backoff
  - [x] 6.2 Write property test for retry logic
  - [x] 6.3 Add error handling to all hooks
  - [x] 6.4 Write property test for error message display
  - [x] 6.5 Write property test for input preservation on failure

- [x] 7. Implement offline support and conflict resolution
  - [x] 7.1 Create offline queue for data changes
  - [x] 7.2 Write property test for offline queue
  - [x] 7.3 Implement last-write-wins conflict resolution
  - [x] 7.4 Write property test for conflict resolution

- [x] 8. Create migration utility
  - [x] 8.1 Implement migrateHardcodedData function
  - [x] 8.2 Write property test for migration data preservation
  - [x] 8.3 Write property test for duplicate handling
  - [x] 8.4 Create migration script to run once

- [x] 9. Checkpoint - Test data layer and migration
  - All data layer and migration tests are passing

- [ ] 10. Build Admin UI component
  - [x] 10.1 Create AdminPanel component
    - Add "Sync Players" button that calls syncPlayersFromPlayCricket
    - Display loading spinner during sync operation
    - Show sync results (players added/updated/unchanged)
    - Display error messages on failure
    - Show last sync timestamp in local storage
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 10.2 Write unit tests for AdminPanel
    - Test button click triggers sync
    - Test loading state display during sync
    - Test success message display with sync statistics
    - Test error message display on sync failure
    - Test last sync timestamp display
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 10.3 Integrate AdminPanel into App.js
    - Add AdminPanel component to the main app
    - Add navigation/toggle to show/hide admin panel
    - Ensure admin panel is accessible but not intrusive
    - _Requirements: 8.1_

- [ ] 11. Update existing components to use Supabase hooks
  - [x] 11.1 Replace hardcoded player data with usePlayers hook in App.js
    - Import usePlayers hook from hooks/index.js
    - Replace hardcoded players array with usePlayers hook
    - Update playersList state to use players from hook
    - Handle loading and error states from hook
    - Remove hardcoded player array after verification
    - _Requirements: 5.1, 5.5_
  
  - [x] 11.2 Update skills rating components to use useSkillsRatings in App.js
    - Import useSkillsRatings hook from hooks/index.js
    - Replace local ratings state with useSkillsRatings hook
    - Use updateRating function from hook for persistence
    - Handle loading and error states
    - Verify optimistic updates work correctly
    - _Requirements: 5.2, 5.5_
  
  - [x] 11.3 Update nets tracking components to use Supabase hooks in App.js
    - Import useNetsSessions and useNetsStatistics hooks
    - Replace local netsData state with Supabase hooks
    - Use createSession and updateStatistic functions for persistence
    - Handle loading and error states
    - Ensure nets session data persists across page reloads
    - _Requirements: 5.3, 5.5_
  
  - [x] 11.4 Update leaderboard components to query Supabase in App.js
    - Modify getTopPerformers to use ratings from useSkillsRatings
    - Modify getBestAttendance to use statistics from useNetsStatistics
    - Ensure leaderboard calculations remain accurate
    - Handle loading states while data is being fetched
    - _Requirements: 5.5_

- [ ] 12. Update Excel export to use Supabase data
  - [x] 12.1 Modify downloadExcel function to fetch from Supabase
    - Update downloadExcel to use players from usePlayers hook
    - Update to use ratings from useSkillsRatings hook
    - Update to use statistics from useNetsStatistics hook
    - Ensure Excel format remains compatible with existing format
    - Handle cases where data is still loading
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 12.2 Write property test for export completeness
    - **Property 13: Export Data Completeness**
    - Verify all players in database are included in export
    - Verify all ratings are included in export
    - Verify all statistics are included in export
    - **Validates: Requirements 10.3**
  
  - [x] 12.3 Write unit test for export format compatibility
    - Test that exported Excel has correct columns
    - Test that data is formatted correctly
    - Test that calculated fields are accurate
    - _Requirements: 10.4_

- [ ] 13. Add authentication (optional)

  - [ ] 13.1 Set up Supabase Auth configuration

    - Configure auth providers in Supabase dashboard
    - Add auth UI components (login/logout)
    - _Requirements: 9.2, 9.3_
  
  - [ ] 13.2 Implement auth guards for write operations

    - Check authentication before allowing writes
    - Redirect to login if not authenticated
    - _Requirements: 9.2_
  
  - [ ] 13.3 Implement role-based access for admin functions

    - Check user role before allowing sync
    - Restrict admin panel to Admin_User role
    - _Requirements: 9.3_
  
  - [ ] 13.4 Write unit tests for authentication

    - Test anonymous read access
    - Test authenticated write access
    - Test admin role restrictions
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 14. Final integration and testing
  - [ ] 14.1 Run full migration with production data
    - Execute migration script with all hardcoded data
    - Verify all 145 players migrated correctly
    - Check Supabase dashboard to confirm data
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 14.2 Test end-to-end player sync flow
    - Trigger sync from admin panel
    - Verify players fetched from Play Cricket website
    - Verify database updated correctly with new/updated players
    - Verify sync results displayed correctly in UI
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.2_
  
  - [ ] 14.3 Test all existing features with Supabase
    - Test player ratings updates persist to database
    - Test nets session tracking persists to database
    - Test leaderboards display correct data from database
    - Test Excel export includes all database data
    - Test real-time updates work across browser tabs
    - _Requirements: 5.5, 10.1_
  
  - [ ] 14.4 Write integration tests for critical flows
    - Test complete rating update flow (UI → hook → Supabase → UI)
    - Test complete nets session flow (create session → add stats → query)
    - Test complete sync flow (trigger → fetch → parse → upsert → display)
    - _Requirements: 5.2, 5.3, 8.2_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run full test suite with `npm test`
  - Verify all unit tests pass
  - Verify all property-based tests pass
  - Verify all integration tests pass
  - Address any failing tests before completion

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The migration script (task 8.4) should only be run once to transfer existing data
- Authentication (task 13) is optional and can be implemented later if needed
- Firebase deployment configuration is already in place
