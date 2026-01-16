# Supabase Setup Guide

This guide will help you set up your Supabase project for the MK Air Cricket Club training tracker application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: MK Air Cricket Tracker (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for getting started
5. Click "Create new project"
6. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. Once your project is ready, go to **Settings** (gear icon in the sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Step 3: Configure Your Application

1. Open the `.env` file in the root of the `my-cricket-app` directory
2. Replace the placeholder values with your actual credentials:

```env
REACT_APP_SUPABASE_URL=https://your-actual-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

3. Save the file

## Step 4: Verify the Connection

1. Start your development server:
   ```bash
   npm start
   ```

2. Open the browser console (F12 or right-click → Inspect → Console)

3. You should see a message indicating the Supabase connection status

## Step 5: Create Database Tables

The next task in the implementation plan will guide you through creating the necessary database tables:
- `players` - Store player information
- `skills_ratings` - Store player skill ratings
- `nets_sessions` - Store practice session information
- `nets_statistics` - Store session statistics for each player

These will be created using the Supabase SQL Editor in the next task.

## Security Notes

- **Never commit your `.env` file to version control** - it contains sensitive credentials
- The `.env` file is already added to `.gitignore` to prevent accidental commits
- Use `.env.example` as a template for other developers
- The `anon` key is safe to use in client-side code as it has limited permissions
- Row Level Security (RLS) policies will be configured to control data access

## Troubleshooting

### Connection Issues

If you see connection errors:
1. Verify your credentials are correct in the `.env` file
2. Make sure there are no extra spaces or quotes around the values
3. Restart your development server after changing `.env` values
4. Check that your Supabase project is active and not paused

### Environment Variables Not Loading

If environment variables aren't being recognized:
1. Make sure the variable names start with `REACT_APP_`
2. Restart your development server (Create React App only loads `.env` on startup)
3. Clear your browser cache and reload

## Next Steps

Once your Supabase project is configured:
1. Proceed to Task 2: Create database schema in Supabase
2. Use the Supabase SQL Editor to create the required tables
3. Set up Row Level Security policies
4. Test the database connection with the `testConnection()` function

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Create React App Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
