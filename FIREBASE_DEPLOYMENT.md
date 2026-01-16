# Firebase Deployment Guide

## Deployment Information

**Project Name:** trainiwithmkair  
**Hosting URL:** https://trainiwithmkair.web.app  
**Firebase Console:** https://console.firebase.google.com/project/trainiwithmkair/overview

## What Was Deployed

This deployment includes:

1. **Authentication System**
   - User sign up and sign in
   - Password reset functionality
   - Secure session management

2. **RLS Security Policies**
   - All database tables now require authentication
   - Users can only access data when logged in
   - Profile data is user-specific (users can only view/edit their own profile)
   - All other data (players, sessions, statistics) is shared among authenticated users

3. **Full Application Features**
   - Player management
   - Skills ratings tracking
   - Nets session logging
   - Performance improvement tracking
   - Excel export functionality
   - Admin panel

## Deployment Commands

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to Firebase
npm run deploy
```

### Automatic Deployment
The application is configured for automatic deployment via GitHub Actions:

- **On Push to `mk-air-cricket-tracker` branch:** Automatically deploys to live site
- **On Pull Request:** Creates a preview deployment for testing

## Configuration Files

- `firebase.json` - Firebase hosting configuration
- `.firebaserc` - Firebase project configuration
- `.github/workflows/firebase-hosting-merge.yml` - Auto-deploy on merge
- `.github/workflows/firebase-hosting-pull-request.yml` - Preview on PR

## Environment Variables

Make sure the following environment variables are set in your `.env` file:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Notes

1. **Authentication Required:** All users must sign up and log in to access the application
2. **RLS Policies:** Database access is restricted to authenticated users only
3. **Shared Data Model:** All authenticated users can view and edit all club data (appropriate for a single club application)
4. **User Profiles:** Each user has their own profile that only they can access

## Testing the Deployment

1. Visit https://trainiwithmkair.web.app
2. Sign up for a new account or log in with existing credentials
3. Verify all features work correctly:
   - Player list and search
   - Skills ratings
   - Session logging
   - Performance tracking
   - Excel export
   - Sign out functionality

## Troubleshooting

### Build Issues
If the build fails, check:
- All dependencies are installed: `npm install`
- Environment variables are set correctly
- No TypeScript/ESLint errors

### Deployment Issues
If deployment fails:
- Ensure you're logged into Firebase: `firebase login`
- Check Firebase project permissions
- Verify the build directory exists and contains files

### Authentication Issues
If users can't log in:
- Check Supabase authentication is enabled
- Verify environment variables are correct
- Check browser console for errors

## Rollback

To rollback to a previous version:
```bash
firebase hosting:rollback
```

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Supabase Authentication Documentation](https://supabase.com/docs/guides/auth)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
