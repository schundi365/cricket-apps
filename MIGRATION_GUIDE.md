# Migration Guide

This guide explains how to migrate hardcoded player data to Supabase.

## Prerequisites

1. Supabase project is set up and configured
2. Database tables are created (players, skills_ratings, nets_sessions, nets_statistics)
3. Environment variables are configured in `.env` file

## Running the Migration

### Option 1: From Browser Console (Recommended)

1. Start the React development server:
   ```bash
   npm start
   ```

2. Open the browser console (F12)

3. Run the migration:
   ```javascript
   import('./scripts/runMigration').then(module => {
     module.runMigration().then(result => {
       console.log('Migration completed:', result);
     });
   });
   ```

### Option 2: Create a Temporary Component

1. Create a migration button component:
   ```javascript
   import { runMigration } from './scripts/runMigration';
   
   function MigrationButton() {
     const handleMigration = async () => {
       const result = await runMigration();
       alert(`Migration complete! Players: ${result.playersInserted}`);
     };
     
     return <button onClick={handleMigration}>Run Migration</button>;
   }
   ```

2. Add it to your App temporarily

3. Click the button to run migration

4. Remove the component after migration is complete

## What Gets Migrated

- **Players**: All 145 players from the hardcoded list
- **Ratings**: None (users will enter these through the UI)
- **Statistics**: None (users will enter these through the UI)

## Migration Results

After running the migration, you should see:
- `playersInserted`: 145
- `ratingsInserted`: 0
- `statisticsInserted`: 0
- `errors`: [] (empty array if successful)

## Verification

After migration, verify the data in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Check the `players` table
4. You should see 145 player records

## Troubleshooting

### Error: "Supabase client not initialized"
- Check your `.env` file has the correct Supabase URL and anon key
- Restart the development server after updating `.env`

### Error: "relation 'players' does not exist"
- Run the database migrations first to create the tables
- Check the `supabase/migrations` folder for SQL scripts

### Duplicate Players
- The migration uses upsert, so running it multiple times is safe
- Duplicate players will update existing records instead of creating new ones

## Important Notes

- **Run this migration only once** after setting up Supabase
- The migration is idempotent (safe to run multiple times)
- Existing player data will not be duplicated
- No ratings or statistics are migrated (these are entered by users)

## Next Steps

After successful migration:
1. Update the React components to use Supabase hooks instead of local state
2. Test the player sync functionality
3. Remove or comment out the hardcoded player array in `App.js`
