# Requirements Document: Database Enhancements

## Introduction

This feature enhances the cricket app database to improve query performance and add points tracking capabilities. The enhancements include denormalizing the session date into the nets_statistics table to eliminate join operations, and adding numeric points columns to track player performance metrics.

## Glossary

- **System**: The cricket app database and associated data access layer
- **Nets_Statistics_Table**: The database table storing player statistics for nets sessions
- **Nets_Sessions_Table**: The database table storing nets practice session information
- **Session_Date**: The date field from nets_sessions table that identifies when a session occurred
- **Points_Columns**: Numeric columns storing calculated points for batting, bowling, fielding, technique work, and punctuality
- **Technique_Points**: Points awarded (1 or 0) based on whether player worked on technique during session
- **Punctuality_Points**: Points awarded (1 or 0) based on whether player was punctual to training
- **Works_On_Technique**: Boolean field indicating if player worked on technique during the session
- **Punctual_To_Training**: Boolean field indicating if player arrived on time to the session
- **Migration**: A database schema change script that modifies table structure
- **Denormalization**: Storing redundant data to improve query performance by eliminating joins
- **React_Hook**: A custom React function that manages data fetching and state
- **Backward_Compatibility**: Ensuring existing data and functionality continue to work after changes

## Requirements

### Requirement 1: Denormalize Session Date and Rename Attendance Field

**User Story:** As a developer, I want the session date stored directly in the nets_statistics table and clearer field naming, so that I can query statistics without joining to the nets_sessions table and understand the data model better.

#### Acceptance Criteria

1. THE System SHALL add a session_date column of type DATE to the nets_statistics table
2. THE System SHALL rename the attended column to nets_attended for clarity
3. WHEN a new nets_statistics record is created, THE System SHALL populate session_date from the corresponding nets_sessions.date value
4. WHEN an existing nets_statistics record is queried, THE System SHALL return the session_date value without requiring a join to nets_sessions
5. WHEN the nets_sessions.date is updated, THE System SHALL update the corresponding session_date values in all related nets_statistics records
6. THE System SHALL maintain referential integrity between nets_statistics.session_id and nets_sessions.id

### Requirement 2: Add Behavioral Tracking Fields

**User Story:** As a coach, I want to track whether players work on technique and arrive punctually, so that I can recognize and encourage good training habits.

#### Acceptance Criteria

1. THE System SHALL add a works_on_technique column of type BOOLEAN to the nets_statistics table with a default value of FALSE
2. THE System SHALL add a punctual_to_training column of type BOOLEAN to the nets_statistics table with a default value of FALSE
3. WHEN a nets_statistics record is created without behavioral values, THE System SHALL initialize works_on_technique and punctual_to_training to FALSE
4. WHEN a user updates works_on_technique or punctual_to_training, THE System SHALL accept only boolean values (TRUE or FALSE)

### Requirement 3: Add Points Tracking Columns

**User Story:** As a coach, I want to track numeric points for batting, bowling, fielding, technique work, and punctuality, so that I can quantify and compare player contributions.

#### Acceptance Criteria

1. THE System SHALL add a batting_points column of type INTEGER to the nets_statistics table with a default value of 0
2. THE System SHALL add a bowling_points column of type INTEGER to the nets_statistics table with a default value of 0
3. THE System SHALL add a fielding_points column of type INTEGER to the nets_statistics table with a default value of 0
4. THE System SHALL add a technique_points column of type INTEGER to the nets_statistics table with a default value of 0
5. THE System SHALL add a punctuality_points column of type INTEGER to the nets_statistics table with a default value of 0
6. THE System SHALL enforce non-negative constraints on all points columns (all points >= 0)
7. WHEN a nets_statistics record is created without points values, THE System SHALL initialize all points columns to 0
8. WHEN works_on_technique is TRUE, THE System SHALL set technique_points to 1
9. WHEN works_on_technique is FALSE, THE System SHALL set technique_points to 0
10. WHEN punctual_to_training is TRUE, THE System SHALL set punctuality_points to 1
11. WHEN punctual_to_training is FALSE, THE System SHALL set punctuality_points to 0

### Requirement 4: Database Migration

**User Story:** As a developer, I want a migration script to add the new columns and rename existing ones, so that the database schema can be updated safely in all environments.

#### Acceptance Criteria

1. THE System SHALL provide a migration script that adds session_date, behavioral fields, and points columns to nets_statistics
2. THE System SHALL provide a migration script that renames the attended column to nets_attended
3. WHEN the migration is executed, THE System SHALL backfill session_date for all existing nets_statistics records from their corresponding nets_sessions.date
4. WHEN the migration is executed, THE System SHALL initialize all points columns to 0 for existing records
5. WHEN the migration is executed, THE System SHALL initialize works_on_technique and punctual_to_training to FALSE for existing records
6. THE System SHALL create appropriate indexes on session_date for query performance
7. THE System SHALL add database comments documenting the purpose of each new column
8. IF the migration fails, THEN THE System SHALL rollback all changes and preserve existing data

### Requirement 5: Update Data Access Layer

**User Story:** As a developer, I want the React hooks updated to use the new columns, so that the application can leverage the enhanced schema.

#### Acceptance Criteria

1. WHEN useNetsStatistics hook creates or updates a statistic, THE System SHALL include session_date in the operation
2. WHEN useNetsStatistics hook creates or updates a statistic, THE System SHALL include all points columns (batting_points, bowling_points, fielding_points, technique_points, punctuality_points) in the operation
3. WHEN useNetsStatistics hook creates or updates a statistic, THE System SHALL include behavioral fields (works_on_technique, punctual_to_training) in the operation
4. WHEN useNetsStatistics hook fetches statistics, THE System SHALL return session_date without joining to nets_sessions
5. WHEN useNetsStatistics hook fetches statistics, THE System SHALL use nets_attended instead of attended
6. THE System SHALL update TypeScript/JavaScript types to include the new columns and renamed field
7. WHEN displaying statistics in UI components, THE System SHALL have access to session_date, behavioral fields, and points columns
8. WHEN works_on_technique is updated to TRUE, THE System SHALL automatically set technique_points to 1
9. WHEN works_on_technique is updated to FALSE, THE System SHALL automatically set technique_points to 0
10. WHEN punctual_to_training is updated to TRUE, THE System SHALL automatically set punctuality_points to 1
11. WHEN punctual_to_training is updated to FALSE, THE System SHALL automatically set punctuality_points to 0

### Requirement 6: Maintain Backward Compatibility

**User Story:** As a developer, I want existing functionality to continue working, so that the migration does not break the application.

#### Acceptance Criteria

1. WHEN the migration is complete, THE System SHALL continue to support all existing queries and operations
2. WHEN existing code accesses nets_statistics records, THE System SHALL return valid data including the new columns with appropriate defaults
3. THE System SHALL maintain the existing relationship between nets_statistics and nets_sessions tables
4. WHEN offline queue operations are processed, THE System SHALL handle both old and new data formats
5. WHEN conflict resolution occurs, THE System SHALL correctly compare records with and without the new columns
6. WHEN existing code references the attended field, THE System SHALL map it to nets_attended for backward compatibility during a transition period

### Requirement 7: Data Consistency

**User Story:** As a system administrator, I want session dates to remain synchronized and points to be calculated correctly, so that denormalized data stays accurate.

#### Acceptance Criteria

1. WHEN a nets_sessions.date is updated, THE System SHALL update session_date in all related nets_statistics records
2. WHEN a new nets_statistics record is inserted, THE System SHALL validate that session_date matches the corresponding nets_sessions.date
3. IF session_date and nets_sessions.date become inconsistent, THEN THE System SHALL provide a mechanism to detect and repair the inconsistency
4. THE System SHALL use database triggers or application logic to maintain synchronization between session_date and nets_sessions.date
5. WHEN works_on_technique changes, THE System SHALL automatically update technique_points to match (1 for TRUE, 0 for FALSE)
6. WHEN punctual_to_training changes, THE System SHALL automatically update punctuality_points to match (1 for TRUE, 0 for FALSE)
