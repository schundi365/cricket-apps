# Implementation Plan: Database Enhancements

## Overview

This implementation plan enhances the cricket app database by adding denormalized session dates, behavioral tracking fields, and a comprehensive points system. The implementation follows a careful migration strategy to ensure backward compatibility and data integrity.

## Tasks

- [x] 1. Create database migration script
  - Create migration file `my-cricket-app/supabase/migrations/004_enhance_nets_statistics.sql`
  - Add new columns: session_date, works_on_technique, punctual_to_training, and all points columns
  - Rename attended column to nets_attended
  - Backfill session_date from nets_sessions for existing records
  - Initialize all new columns with appropriate default values
  - Create index on session_date for query performance
  - Add column comments for documentation
  - Wrap all changes in a transaction for rollback safety
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.8_

- [ ] 2. Create database triggers for data consistency
  - [x] 2.1 Create trigger function to sync session_date on insert
    - Write `sync_session_date_on_insert()` function
    - Populate session_date from nets_sessions.date when new record is inserted
    - Create BEFORE INSERT trigger on nets_statistics
    - _Requirements: 1.3, 7.2_
  
  - [x] 2.2 Create trigger function to sync session_date on session update
    - Write `sync_session_date_on_session_update()` function
    - Update session_date in all related nets_statistics when nets_sessions.date changes
    - Create AFTER UPDATE trigger on nets_sessions
    - _Requirements: 1.5, 7.1_
  
  - [x] 2.3 Create trigger function to auto-calculate behavioral points
    - Write `calculate_behavioral_points()` function
    - Set technique_points to 1 if works_on_technique is TRUE, 0 otherwise
    - Set punctuality_points to 1 if punctual_to_training is TRUE, 0 otherwise
    - Create BEFORE INSERT OR UPDATE trigger on nets_statistics
    - _Requirements: 3.8, 3.9, 3.10, 3.11, 7.5, 7.6_

- [ ] 3. Update useNetsStatistics hook
  - [x] 3.1 Update fetchStatistics to include new columns
    - Modify query to select all columns (includes new fields automatically)
    - Verify session_date is returned without join to nets_sessions
    - _Requirements: 1.4, 5.4_
  
  - [x] 3.2 Update updateStatistic to handle new fields
    - Include session_date, behavioral fields, and points columns in create/update operations
    - Calculate technique_points and punctuality_points from boolean fields before sending to database
    - Update default values for new records to include all new columns
    - Use nets_attended instead of attended in all operations
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.8, 5.9, 5.10, 5.11_
  
  - [x] 3.3 Update optimistic update logic
    - Include new columns in optimistic updates
    - Ensure rollback logic handles new columns correctly
    - _Requirements: 6.2_

- [x] 4. Update TypeScript/JavaScript type definitions
  - Create or update NetsStatistic interface/type
  - Add session_date: string (ISO date)
  - Rename attended to nets_attended
  - Add works_on_technique: boolean
  - Add punctual_to_training: boolean
  - Add batting_points, bowling_points, fielding_points, technique_points, punctuality_points: number
  - _Requirements: 5.6_

- [x] 5. Update offline queue to handle new schema
  - [x] 5.1 Update queue operation handlers
    - Ensure queued operations include new columns when creating/updating statistics
    - Handle both old format (without new columns) and new format operations
    - _Requirements: 6.4_
  
  - [x] 5.2 Update conflict resolution for new columns
    - Modify shouldUpdate and resolveConflict to handle records with/without new columns
    - Ensure last-write-wins works correctly with mixed schemas
    - _Requirements: 6.5_

- [x] 6. Create data repair utility
  - Create script to detect session_date inconsistencies
  - Create script to repair inconsistencies by syncing from nets_sessions
  - Add validation query to find records with mismatched dates
  - _Requirements: 7.3_

- [ ] 7. Checkpoint - Run migration and verify schema
  - Execute migration script on development database
  - Verify all columns are added correctly
  - Verify triggers are created and functioning
  - Verify existing data is preserved and backfilled correctly
  - Test rollback by intentionally failing migration
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 8. Write property-based tests for database operations
  - [ ]* 8.1 Property test: Session date population on insert
    - **Property 1: Session Date Population on Insert**
    - Generate random session_id and player_id, create statistic, verify session_date matches nets_sessions.date
    - **Validates: Requirements 1.3**
  
  - [ ]* 8.2 Property test: Session date availability without join
    - **Property 2: Session Date Availability Without Join**
    - Generate random statistics, query them, verify session_date is present without join
    - **Validates: Requirements 1.4, 5.4**
  
  - [ ]* 8.3 Property test: Session date synchronization
    - **Property 3: Session Date Synchronization**
    - Generate random session, update its date, verify all related statistics have updated session_date
    - **Validates: Requirements 1.5, 7.1**
  
  - [ ]* 8.4 Property test: Referential integrity enforcement
    - **Property 4: Referential Integrity Enforcement**
    - Generate random invalid session_id, attempt to create statistic, verify error is returned
    - **Validates: Requirements 1.6, 6.3**
  
  - [ ]* 8.5 Property test: Boolean field default values
    - **Property 5: Boolean Field Default Values**
    - Generate random statistics without behavioral fields, verify they default to FALSE
    - **Validates: Requirements 2.3**
  
  - [ ]* 8.6 Property test: Boolean field type validation
    - **Property 6: Boolean Field Type Validation**
    - Generate random non-boolean values, attempt to set behavioral fields, verify error
    - **Validates: Requirements 2.4**
  
  - [ ]* 8.7 Property test: Points column default values
    - **Property 7: Points Column Default Values**
    - Generate random statistics without points values, verify all default to 0
    - **Validates: Requirements 3.7**
  
  - [ ]* 8.8 Property test: Technique points calculation
    - **Property 8: Technique Points Calculation**
    - Generate random boolean for works_on_technique, create statistic, verify technique_points is 1 or 0 accordingly
    - **Validates: Requirements 3.8, 3.9, 5.8, 5.9, 7.5**
  
  - [ ]* 8.9 Property test: Punctuality points calculation
    - **Property 9: Punctuality Points Calculation**
    - Generate random boolean for punctual_to_training, create statistic, verify punctuality_points is 1 or 0 accordingly
    - **Validates: Requirements 3.10, 3.11, 5.10, 5.11, 7.6**

- [ ]* 9. Write property-based tests for hook operations
  - [ ]* 9.1 Property test: Hook includes session date
    - **Property 11: Hook Includes Session Date**
    - Generate random update operations, verify session_date is included
    - **Validates: Requirements 5.1**
  
  - [ ]* 9.2 Property test: Hook includes all points columns
    - **Property 12: Hook Includes All Points Columns**
    - Generate random update operations, verify all 5 points columns are included
    - **Validates: Requirements 5.2**
  
  - [ ]* 9.3 Property test: Hook includes behavioral fields
    - **Property 13: Hook Includes Behavioral Fields**
    - Generate random update operations, verify both behavioral fields are included
    - **Validates: Requirements 5.3**
  
  - [ ]* 9.4 Property test: Hook uses renamed field
    - **Property 14: Hook Uses Renamed Field**
    - Generate random statistics, fetch them, verify nets_attended field is present
    - **Validates: Requirements 5.5**
  
  - [ ]* 9.5 Property test: UI data completeness
    - **Property 15: UI Data Completeness**
    - Generate random statistics, verify all new fields are present for UI display
    - **Validates: Requirements 5.7**

- [ ]* 10. Write property-based tests for backward compatibility
  - [ ]* 10.1 Property test: Backward compatibility for existing queries
    - **Property 16: Backward Compatibility for Existing Queries**
    - Generate random queries that worked pre-migration, verify they still work post-migration
    - **Validates: Requirements 6.1**
  
  - [ ]* 10.2 Property test: New columns have valid defaults
    - **Property 17: New Columns Have Valid Defaults**
    - Generate random existing records, verify new columns have valid defaults after migration
    - **Validates: Requirements 6.2**
  
  - [ ]* 10.3 Property test: Offline queue format compatibility
    - **Property 18: Offline Queue Format Compatibility**
    - Generate random operations in old and new formats, verify all process successfully
    - **Validates: Requirements 6.4**
  
  - [ ]* 10.4 Property test: Conflict resolution with mixed schemas
    - **Property 19: Conflict Resolution with Mixed Schemas**
    - Generate random pairs of records (with/without new columns), verify last-write-wins works correctly
    - **Validates: Requirements 6.5**

- [ ]* 11. Write property-based tests for data consistency
  - [ ]* 11.1 Property test: Session date validation on insert
    - **Property 21: Session Date Validation on Insert**
    - Generate random statistics with explicit session_date, verify it matches nets_sessions.date or is rejected
    - **Validates: Requirements 7.2**
  
  - [ ]* 11.2 Property test: Inconsistency detection and repair
    - **Property 22: Inconsistency Detection and Repair**
    - Generate random inconsistent records, run repair script, verify inconsistencies are fixed
    - **Validates: Requirements 7.3**

- [ ]* 12. Write unit tests for specific scenarios
  - [ ]* 12.1 Unit test: Create statistic with default values
    - Test creating a statistic with only required fields
    - Verify all new columns have correct defaults
    - _Requirements: 2.3, 3.7_
  
  - [ ]* 12.2 Unit test: Update works_on_technique updates technique_points
    - Test updating works_on_technique to TRUE
    - Verify technique_points becomes 1
    - Test updating to FALSE, verify it becomes 0
    - _Requirements: 3.8, 3.9_
  
  - [ ]* 12.3 Unit test: Update punctual_to_training updates punctuality_points
    - Test updating punctual_to_training to TRUE
    - Verify punctuality_points becomes 1
    - Test updating to FALSE, verify it becomes 0
    - _Requirements: 3.10, 3.11_
  
  - [ ]* 12.4 Unit test: Offline queue handles new fields
    - Queue an operation with new fields while offline
    - Go online and sync
    - Verify operation processes correctly
    - _Requirements: 6.4_
  
  - [ ]* 12.5 Unit test: Conflict resolution with mixed schemas
    - Create two versions of a record (one with new columns, one without)
    - Trigger conflict resolution
    - Verify last-write-wins based on updated_at
    - _Requirements: 6.5_
  
  - [ ]* 12.6 Unit test: Migration rollback on failure
    - Simulate migration failure (e.g., invalid SQL)
    - Verify all changes are rolled back
    - Verify database is in pre-migration state
    - _Requirements: 4.8_
  
  - [ ]* 12.7 Unit test: Data repair script
    - Create records with inconsistent session_date
    - Run repair script
    - Verify all inconsistencies are fixed
    - _Requirements: 7.3_

- [ ]* 13. Write integration tests
  - [ ]* 13.1 Integration test: End-to-end flow with new fields
    - Create a nets session
    - Create statistics with behavioral fields and points
    - Update statistics
    - Verify all data is persisted correctly
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 13.2 Integration test: Offline sync with new schema
    - Go offline
    - Create/update statistics with new fields
    - Go online
    - Verify sync works correctly
    - _Requirements: 6.4_
  
  - [ ]* 13.3 Integration test: UI displays all new fields
    - Fetch statistics
    - Render in UI component
    - Verify session_date, behavioral fields, and points are displayed
    - _Requirements: 5.7_

- [ ] 14. Update UI components to display new fields
  - Update statistics display components to show session_date
  - Add UI controls for works_on_technique and punctual_to_training checkboxes
  - Display all points columns (batting, bowling, fielding, technique, punctuality)
  - Show calculated technique_points and punctuality_points
  - _Requirements: 5.7_

- [ ] 15. Final checkpoint - Comprehensive testing
  - Run all unit tests and verify they pass
  - Run all property-based tests (minimum 100 iterations each)
  - Run all integration tests
  - Test migration on a copy of production data
  - Verify backward compatibility with existing functionality
  - Test offline queue and conflict resolution with new schema
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Migration script uses transactions to ensure atomicity and rollback safety
- Database triggers handle automatic calculation of technique_points and punctuality_points
- Property-based tests use fast-check library with minimum 100 iterations
- Each property test references its corresponding design document property
- Backward compatibility is maintained through careful migration and schema design
- The offline queue and conflict resolution are updated to handle both old and new data formats
