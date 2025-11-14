# Custom Domain Setup Guide

This guide covers all the steps needed to configure your app to work with a custom domain.

## Prerequisites

1. ✅ Custom domain added in Firebase Console (Hosting → Add custom domain)
2. ✅ DNS records configured (Firebase will provide instructions)
3. ✅ SSL certificate provisioned (automatic via Firebase)

## Steps to Complete

### 1. Update Environment Variables

Update your `.env` file with the custom domain:

```bash
# Replace YOUR_CUSTOM_DOMAIN with your actual domain (e.g., app.yourdomain.com)
VITE_FIREBASE_AUTH_DOMAIN=YOUR_CUSTOM_DOMAIN
```

**Important**: 
- Do NOT include `https://` or trailing slashes
- Use the exact domain you configured in Firebase Hosting
- Example: `app.yourdomain.com` or `haydamin.yourdomain.com`

### 2. Firebase Console - Authorized Domains

Add your custom domain to Firebase Authentication authorized domains:

1. Go to [Firebase Console](https://console.firebase.google.com/project/haydamin/authentication/settings)
2. Navigate to **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain**
4. Enter your custom domain (e.g., `yourdomain.com` or `app.yourdomain.com`)
5. Click **Add**

**Note**: Firebase automatically adds your Firebase hosting domain (`*.web.app` and `*.firebaseapp.com`), but you must manually add custom domains.

### 3. Rebuild and Deploy

After updating environment variables:

```bash
# Rebuild the app with new environment variables
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### 4. Verify Configuration

After deployment, verify:

1. ✅ App loads at custom domain
2. ✅ Firebase Authentication works (if using auth)
3. ✅ Service worker registers correctly
4. ✅ PWA manifest loads correctly
5. ✅ All Firebase services (Firestore, Storage) work

### 5. Test Authentication (if applicable)

If you're using Firebase Authentication:

1. Try logging in at your custom domain
2. Verify OAuth redirects work correctly
3. Check browser console for any CORS or domain errors

## Current Configuration Files

### Files That Use Domain Configuration

- **`src/services/firebase.ts`**: Uses `VITE_FIREBASE_AUTH_DOMAIN` from environment
- **`firebase.json`**: Hosting configuration (no domain-specific changes needed)
- **`vite.config.ts`**: PWA manifest (uses relative paths, no changes needed)
- **`cors.json`**: Firebase Storage CORS (already allows all origins)

### Files That Don't Need Changes

- ✅ `index.html` - Uses relative paths
- ✅ `vite.config.ts` - PWA manifest uses relative paths
- ✅ Service worker - Uses relative paths
- ✅ All React components - Use relative paths

## Troubleshooting

### Issue: Authentication not working
- **Solution**: Verify `VITE_FIREBASE_AUTH_DOMAIN` matches your custom domain exactly
- **Solution**: Ensure domain is added to Firebase Authentication authorized domains

### Issue: CORS errors
- **Solution**: Verify `cors.json` allows your domain (currently allows all with `"origin": ["*"]`)
- **Solution**: Check Firebase Storage CORS settings in Firebase Console

### Issue: Service worker not updating
- **Solution**: Clear browser cache and unregister old service worker
- **Solution**: Verify `dist/sw.js` is deployed correctly

### Issue: PWA not installing
- **Solution**: Verify manifest.webmanifest is accessible at custom domain
- **Solution**: Check that HTTPS is working (required for PWA)

## Additional Notes

- The app uses relative paths throughout, so most functionality will work automatically
- Firebase Storage CORS is configured to allow all origins, so no changes needed there
- The PWA manifest uses relative paths, so it will work on any domain
- Service worker uses relative paths, so it will work on any domain

## Next Steps After Setup

1. Update any documentation that references the old Firebase hosting URL
2. Update any external integrations that reference your app URL
3. Test all features thoroughly on the custom domain
4. Consider setting up a redirect from the old Firebase hosting URL to your custom domain

