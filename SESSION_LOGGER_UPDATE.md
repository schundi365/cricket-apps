# Session Logger Update - Player-Level Tracking

## What Changed

The Session Logger has been updated to track amount due and skill ratings at the player level (not session level), allowing you to:

1. Track which players attended each session
2. Record amount due (£) per player per session
3. Log session-specific skill ratings (batting, bowling, fielding, fitness) on a 0-10 scale
4. Track performance statistics (dismissals, wickets, extras) per player
5. Calculate improvement session by session

## Database Changes

Migration `005_add_player_session_details.sql` added the following columns to `nets_statistics`:

- `amount_due` - Amount owed by player for this session (£)
- `session_batting_rating` - Batting performance rating (0-10)
- `session_bowling_rating` - Bowling performance rating (0-10)
- `session_fielding_rating` - Fielding performance rating (0-10)
- `session_fitness_rating` - Fitness performance rating (0-10)

## How to Use

### 1. Create a Session

Click "New Session" and enter:
- Session date (required)
- Notes (optional)

### 2. Select a Session

Click on any session row in the table to view details.

### 3. Manage Player Attendance

Click "Manage Attendance" to see all players. Players are shown with:
- Green border = Present
- Gray border = Absent
- Amount due displayed if > £0

### 4. Log Player Details

Click on any player card to open the detail modal where you can enter:

**Attendance**
- Check/uncheck "Player Attended Session"

**Amount Due**
- Enter amount in £ (e.g., 15.00)

**Session Performance Ratings (0-10)**
- Batting rating
- Bowling rating
- Fielding rating
- Fitness rating

**Performance Statistics**
- Dismissals (number)
- Wickets (number)
- Extras (number)

Click "Save Details" to save all changes.

## Technical Fixes

Fixed a React hooks violation where `useState` was being called inside a render function (IIFE). The modal now properly uses component-level state (`playerFormData`) that is initialized when a player is selected via the `openPlayerModal` function.

## Currency

All amounts are now displayed in British Pounds (£) instead of Indian Rupees (₹).

## Future Enhancements

Consider adding:
- Session-by-session skill progression charts
- Player improvement trends over time
- Automatic calculation of average ratings
- Payment tracking and outstanding balance reports
