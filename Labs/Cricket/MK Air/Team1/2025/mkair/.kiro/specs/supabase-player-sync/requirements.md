# Requirements Document

## Introduction

This document specifies the requirements for integrating Supabase as the backend database for the MK Air Cricket Club training tracker application and implementing functionality to synchronize player data from the Play Cricket website. The system will replace the current local state management with a persistent database solution while maintaining all existing functionality for tracking player skills ratings and nets session statistics.

## Glossary

- **Supabase**: Open-source Firebase alternative providing PostgreSQL database, authentication, and real-time subscriptions
- **Play_Cricket_API**: The web interface at https://mkair.play-cricket.com/Teams that provides squad and player information
- **Player_Sync**: The process of fetching player data from Play Cricket and updating the Supabase database
- **Training_Tracker**: The React application that tracks player skills and nets session statistics
- **Nets_Session**: A practice session where players' performance is recorded (attendance, dismissals, wickets, extras)
- **Skills_Rating**: Numerical ratings for player abilities in batting, bowling, fielding, and fitness
- **Admin_User**: A user with permissions to trigger player synchronization operations

## Requirements

### Requirement 1: Supabase Integration Setup

**User Story:** As a developer, I want to integrate Supabase into the application, so that player data can be persisted in a cloud database.

#### Acceptance Criteria

1. THE Training_Tracker SHALL initialize the Supabase client with project URL and anonymous key
2. WHEN the application starts, THE Training_Tracker SHALL establish a connection to the Supabase database
3. THE Training_Tracker SHALL store Supabase configuration in environment variables
4. WHEN the Supabase connection fails, THE Training_Tracker SHALL display an error message and continue with cached data

### Requirement 2: Database Schema Design

**User Story:** As a developer, I want a well-structured database schema, so that player data, ratings, and statistics can be efficiently stored and queried.

#### Acceptance Criteria

1. THE Database SHALL define a players table with fields for player_id, name, team, and metadata from Play Cricket
2. THE Database SHALL define a skills_ratings table with fields for player_id, batting, bowling, fielding, fitness, and timestamp
3. THE Database SHALL define a nets_sessions table with fields for session_id, date, and session metadata
4. THE Database SHALL define a nets_statistics table with fields for session_id, player_id, attendance, dismissals, wickets, and extras
5. THE Database SHALL enforce foreign key constraints between players and their related data
6. THE Database SHALL create indexes on frequently queried fields for performance optimization

### Requirement 3: Player Data Synchronization

**User Story:** As an admin user, I want to synchronize player data from the Play Cricket website, so that the database contains current squad information.

#### Acceptance Criteria

1. WHEN an Admin_User triggers synchronization, THE Player_Sync SHALL fetch squad data from https://mkair.play-cricket.com/Teams
2. WHEN player data is fetched, THE Player_Sync SHALL parse the HTML response to extract player names and team assignments
3. WHEN new players are found, THE Player_Sync SHALL insert them into the players table
4. WHEN existing players are found, THE Player_Sync SHALL update their team assignments if changed
5. WHEN synchronization completes, THE Player_Sync SHALL return a summary of players added, updated, and unchanged
6. THE Player_Sync SHALL complete synchronization within 30 seconds for up to 200 players

### Requirement 4: Data Migration Strategy

**User Story:** As a developer, I want to migrate existing hardcoded player data to Supabase, so that historical data is preserved during the transition.

#### Acceptance Criteria

1. THE Training_Tracker SHALL provide a migration function to transfer hardcoded player data to Supabase
2. WHEN migration runs, THE Training_Tracker SHALL insert all existing players into the players table
3. WHEN migration runs, THE Training_Tracker SHALL preserve existing skills ratings in the skills_ratings table
4. WHEN migration runs, THE Training_Tracker SHALL preserve existing nets statistics in the nets_statistics table
5. WHEN migration encounters duplicate players, THE Training_Tracker SHALL skip insertion and log the conflict

### Requirement 5: Replace Local State with Database Queries

**User Story:** As a developer, I want to replace local state management with Supabase queries, so that data persists across sessions and devices.

#### Acceptance Criteria

1. WHEN the application loads, THE Training_Tracker SHALL fetch player data from Supabase instead of using hardcoded arrays
2. WHEN skills ratings are updated, THE Training_Tracker SHALL persist changes to the skills_ratings table immediately
3. WHEN nets session data is recorded, THE Training_Tracker SHALL persist changes to the nets_sessions and nets_statistics tables immediately
4. WHEN data is modified, THE Training_Tracker SHALL update the UI to reflect the changes within 500ms
5. THE Training_Tracker SHALL maintain all existing functionality for ratings, nets tracking, leaderboards, and Excel export

### Requirement 6: Real-time Updates and Sync Strategy

**User Story:** As a user, I want data changes to be reflected in real-time, so that multiple users can collaborate without conflicts.

#### Acceptance Criteria

1. WHEN data changes in Supabase, THE Training_Tracker SHALL receive real-time updates via Supabase subscriptions
2. WHEN multiple users modify the same data, THE Training_Tracker SHALL use last-write-wins conflict resolution
3. WHEN the application is offline, THE Training_Tracker SHALL queue data changes for synchronization when connectivity is restored
4. WHEN connectivity is restored, THE Training_Tracker SHALL synchronize queued changes within 5 seconds

### Requirement 7: Error Handling and Resilience

**User Story:** As a user, I want the application to handle errors gracefully, so that temporary failures do not disrupt my workflow.

#### Acceptance Criteria

1. WHEN a Supabase query fails, THE Training_Tracker SHALL retry the operation up to 3 times with exponential backoff
2. WHEN all retries fail, THE Training_Tracker SHALL display a user-friendly error message
3. WHEN the Play Cricket website is unavailable, THE Player_Sync SHALL return an error and preserve existing player data
4. WHEN network connectivity is lost, THE Training_Tracker SHALL display an offline indicator
5. IF a database write fails, THEN THE Training_Tracker SHALL preserve the user's input and allow retry

### Requirement 8: Admin Functionality for Player Sync

**User Story:** As an admin user, I want a UI control to trigger player synchronization, so that I can update the player database when squads change.

#### Acceptance Criteria

1. THE Training_Tracker SHALL provide a "Sync Players" button in the admin interface
2. WHEN the "Sync Players" button is clicked, THE Training_Tracker SHALL trigger the Player_Sync process
3. WHEN synchronization is in progress, THE Training_Tracker SHALL display a loading indicator
4. WHEN synchronization completes, THE Training_Tracker SHALL display a summary of changes made
5. WHEN synchronization fails, THE Training_Tracker SHALL display the error message and allow retry

### Requirement 9: Authentication and Authorization

**User Story:** As a developer, I want to implement basic authentication, so that only authorized users can modify data.

#### Acceptance Criteria

1. THE Training_Tracker SHALL support anonymous read access to player data and statistics
2. WHERE authentication is enabled, THE Training_Tracker SHALL require login for write operations
3. WHERE authentication is enabled, THE Training_Tracker SHALL restrict player synchronization to Admin_User roles
4. THE Training_Tracker SHALL use Supabase Row Level Security policies to enforce data access rules

### Requirement 10: Data Export Compatibility

**User Story:** As a user, I want to continue exporting data to Excel, so that I can analyze statistics offline.

#### Acceptance Criteria

1. THE Training_Tracker SHALL maintain the existing Excel export functionality
2. WHEN exporting data, THE Training_Tracker SHALL fetch current data from Supabase
3. WHEN exporting data, THE Training_Tracker SHALL include all players, ratings, and nets statistics
4. THE Training_Tracker SHALL generate Excel files in the same format as the current implementation
