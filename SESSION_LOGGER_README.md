# Session Logger Feature

## Overview

The Session Logger is a comprehensive page for managing cricket nets sessions, tracking dates, amounts due, and session statistics.

## Features

### 1. **Session Management**
- Create new nets sessions with date, amount due, and notes
- Edit existing sessions
- Delete sessions (with confirmation)
- View all sessions in a sortable table

### 2. **Session Tracking**
- **Date**: Track when each nets session occurred
- **Amount Due**: Record fees or costs for each session (in ₹)
- **Notes**: Add optional notes for each session
- **Statistics**: Automatically calculate:
  - Players attended
  - Total dismissals
  - Total wickets
  - Total extras

### 3. **Summary Dashboard**
- Total number of sessions
- Total amount due across all sessions
- Average amount per session

### 4. **Session Details View**
- Click on any session to view detailed information
- See session-specific statistics
- View all players who attended

### 5. **Export Functionality**
- Export all sessions to Excel
- Includes all session data and statistics
- Formatted for easy analysis

## Usage

### Accessing the Session Logger

1. Open the cricket app
2. Click the **File/Document icon** in the header navigation
3. The Session Logger page will open

### Creating a New Session

1. Click the **"New Session"** button
2. Fill in the form:
   - **Session Date**: Required - select the date of the nets session
   - **Amount Due**: Optional - enter the amount in rupees (₹)
   - **Notes**: Optional - add any notes about the session
3. Click **"Create Session"**

### Editing a Session

1. Find the session in the table
2. Click the **Edit icon** (pencil) in the Actions column
3. Update the fields as needed
4. Click **"Update Session"**

### Deleting a Session

1. Find the session in the table
2. Click the **Delete icon** (trash) in the Actions column
3. Confirm the deletion
4. **Note**: This will also delete all associated player statistics

### Viewing Session Details

1. Click on any row in the sessions table
2. The session will be highlighted
3. Detailed information appears below the table

### Exporting Data

1. Click the **"Export"** button in the header
2. An Excel file will be downloaded with all session data
3. File name format: `Cricket_Sessions_YYYY-MM-DD.xlsx`

## Database Schema

### Migration: 005_add_amount_due_to_sessions.sql

Adds the `amount_due` field to the `nets_sessions` table:

```sql
ALTER TABLE nets_sessions
  ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10, 2) DEFAULT 0 CHECK (amount_due >= 0);
```

### Updated nets_sessions Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| date | DATE | Session date |
| amount_due | DECIMAL(10,2) | Amount due for the session |
| notes | TEXT | Optional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Technical Details

### Components

- **SessionLogger.jsx**: Main component for the session logger page
- Located in: `src/components/SessionLogger.jsx`

### Hooks

- **useNetsSessions**: Enhanced with CRUD operations
  - `createSession(sessionData)`: Create a new session
  - `updateSession(sessionId, updates)`: Update an existing session
  - `deleteSession(sessionId)`: Delete a session
  - `refetch()`: Manually refresh sessions list

### Features

1. **Offline Support**: All operations are queued when offline
2. **Optimistic Updates**: UI updates immediately for better UX
3. **Error Handling**: User-friendly error messages
4. **Responsive Design**: Works on mobile, tablet, and desktop
5. **Real-time Statistics**: Automatically calculates session stats

## Integration

The Session Logger integrates with:

- **nets_sessions table**: Stores session data
- **nets_statistics table**: Links to player statistics
- **players table**: Shows which players attended

## Future Enhancements

Potential improvements:

1. **Payment Tracking**: Mark sessions as paid/unpaid
2. **Recurring Sessions**: Create recurring session templates
3. **Session Types**: Categorize sessions (practice, match, training)
4. **Player Attendance**: Quick attendance marking from session view
5. **Financial Reports**: Generate payment reports and summaries
6. **Session Reminders**: Send notifications for upcoming sessions

## Troubleshooting

### Sessions Not Loading

1. Check your internet connection
2. Verify Supabase credentials in `.env` file
3. Check browser console for errors
4. Try refreshing the page

### Cannot Create Session

1. Ensure the date field is filled
2. Check that amount_due is a valid number
3. Verify you have write permissions in Supabase

### Statistics Not Showing

1. Ensure players have been added to the session
2. Check that nets_statistics records exist
3. Verify the session_id matches

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify database migrations have been run
3. Ensure all environment variables are set correctly
4. Review the Supabase logs for backend errors
