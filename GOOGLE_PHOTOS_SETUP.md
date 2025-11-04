# Google Photos Picker Integration Setup Guide

This guide explains how to set up the Google Photos Picker API integration for your Haydamin family tree application.

## Overview

The Google Photos Picker allows users to select photos directly from their Google Photos library when adding profile photos or additional photos to family members.

## Prerequisites

- A Google Cloud Console account
- Your application already configured with Firebase Authentication

## Setup Steps

### 1. Enable the Google Photos Picker API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Photos Picker API"
5. Click on "Google Photos Picker API"
6. Click **Enable**

### 2. Configure OAuth 2.0 Credentials

The Google Photos Picker uses OAuth 2.0 for authentication. Since you're already using Firebase Authentication with Google Sign-In, you may already have OAuth credentials configured.

#### If you don't have OAuth credentials yet:

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the following:
   - **Name**: Your app name (e.g., "Haydamin Family Tree")
   - **Authorized JavaScript origins**: Add your development and production URLs
     - Development: `http://localhost:5173` (or your dev server port)
     - Production: `https://yourdomain.com`
   - **Authorized redirect URIs**: Add Firebase Auth redirect URIs
     - Development: `http://localhost:5173/__/auth/handler`
     - Production: `https://yourdomain.com/__/auth/handler`
5. Click **Create**
6. Save your **Client ID** (you'll need this for Firebase configuration)

### 3. Configure Firebase Authentication

Your application already uses Firebase Authentication. The Google Photos Picker integration automatically adds the required scope (`photospicker.mediaitems.readonly`) when users authenticate.

**No additional configuration needed** - the GooglePhotosPickerButton component handles this automatically.

### 4. App Verification (For Production)

Before launching publicly, you must submit your app for Google verification:

1. Go to **APIs & Services** > **OAuth consent screen**
2. Fill in all required information:
   - App name
   - User support email
   - Developer contact information
   - App logo (recommended)
   - Privacy policy URL
   - Terms of service URL
3. Add scopes:
   - `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`
4. Add test users (for testing before verification)
5. Submit for verification

**Note**: Until verified, users will see an "unverified app" warning during authentication.

## How It Works

### User Flow

1. User navigates to Add Person or Edit Person page
2. User clicks "Select from Google Photos" button
3. User authenticates with Google (if not already authenticated)
4. Google Photos Picker opens in a new window
5. User selects photo(s) from their Google Photos library
6. Window closes automatically after selection
7. Selected photos are downloaded and processed
8. Photos go through the same crop/compress workflow as uploaded files
9. Photos are uploaded to Firebase Storage

### Technical Flow

1. **Authentication**: Uses Firebase Auth with Google provider
2. **Session Creation**: Creates a picker session via Google Photos API
3. **Picker Display**: Opens picker in new window with `/autoclose` parameter
4. **Polling**: Automatically polls session status until photos are selected
5. **Download**: Downloads selected photos as File objects
6. **Integration**: Files integrate seamlessly with existing upload workflow
7. **Cleanup**: Session is automatically cleaned up after use

## API Quotas and Limits

- **Session lifetime**: 120 seconds (2 minutes) by default
- **Base URL expiration**: 60 minutes
- **Quota limits**: Monitor usage in Google Cloud Console

If you exceed quota limits, you'll receive a 429 error. You can request quota increases in the Google Cloud Console.

## Important Notes

### BaseUrl Handling

- Never store `baseUrl` from media items (expires in 60 minutes)
- The integration downloads photos immediately and uploads to Firebase Storage
- Firebase Storage URLs are what get saved to the database

### Security

- The picker cannot be embedded in an iframe (security restriction)
- All API requests require OAuth token in Authorization header
- Scope `photospicker.mediaitems.readonly` is read-only (safe for users)

### Scope Migration (Important!)

**After March 31, 2025**, older Google Photos scopes will return 403 errors:
- ❌ `photoslibrary.readonly`
- ❌ `photoslibrary.readonly.appcreateddata`

The integration uses the new Picker API scope:
- ✅ `photospicker.mediaitems.readonly`

## Testing

### Test Users (Before App Verification)

1. Go to **OAuth consent screen** in Google Cloud Console
2. Add test users under "Test users" section
3. Test users can use the app without seeing verification warnings

### Development Testing

1. Run your development server: `npm run dev`
2. Navigate to Add Person or Person Detail (edit mode)
3. Click "Select from Google Photos"
4. Authenticate with Google
5. Select photos and verify they upload correctly

## Troubleshooting

### "Popup blocked" error
- Ensure popups are allowed for your domain
- The error message includes instructions for the user

### "Failed to create picker session"
- Check that the Photos Picker API is enabled in Google Cloud Console
- Verify OAuth credentials are configured correctly
- Check browser console for detailed error messages

### "Session timed out"
- Sessions expire after 120 seconds
- User needs to click the button again to create a new session

### Photos not downloading
- Check network tab for API request errors
- Verify OAuth token is valid
- Check quota limits in Google Cloud Console

## Files Modified/Created

- ✅ `src/services/googlePhotos.ts` - Google Photos API service
- ✅ `src/components/GooglePhotosPickerButton.tsx` - Reusable button component
- ✅ `src/pages/AddPerson.tsx` - Integration for profile photo selection
- ✅ `src/pages/PersonDetail.tsx` - Integration for profile and additional photos

## Additional Resources

- [Google Photos Picker API Documentation](https://developers.google.com/photos/picker/guides/get-started)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Authentication with Google](https://firebase.google.com/docs/auth/web/google-signin)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the Google Cloud Console for API quota/errors
3. Verify all setup steps were completed correctly
4. Check Firebase Authentication is working properly
