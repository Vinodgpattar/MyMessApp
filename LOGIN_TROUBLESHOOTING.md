# Login Troubleshooting Guide

## Issue: "Invalid login credentials" Error

If you're getting this error, follow these steps:

## Step 1: Verify Environment Variables

1. **Check if `.env.local` exists** in `mess-management-mobile/` directory
2. **If it doesn't exist**, create it with these variables:

```env
# Supabase Configuration
# Get these from your Supabase project dashboard: Settings → API
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Web App URL (for email API)
EXPO_PUBLIC_WEB_APP_URL=https://mess-management-app-nu.vercel.app
```

3. **Get your Supabase credentials:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to **Settings → API**
   - Copy:
     - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
     - **Anon/Public Key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. **Restart Expo** after creating/updating `.env.local`:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npx expo start --clear
   ```

## Step 2: Verify/Create Admin User in Supabase

The admin user must exist in **Supabase Auth** (not just in the database).

### Option A: Create Admin User via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication → Users**
4. Click **"Add User"** or **"Invite User"**
5. Enter:
   - **Email:** `admin@example.com` (or your preferred email)
   - **Password:** `Admin123!` (or your preferred password)
   - ✅ **Check "Auto Confirm User"** (important!)
6. Click **"Create User"**

### Option B: Reset Admin Password

If the user already exists but you forgot the password:

1. Go to **Authentication → Users**
2. Find the admin user
3. Click on the user
4. Click **"Reset Password"** or **"Update User"**
5. Set a new password
6. Make sure **"Email Confirmed"** is checked

### Option C: Use SQL to Create Admin User

If you have access to Supabase SQL Editor:

```sql
-- This will create the admin user in Supabase Auth
-- Note: You need to use the Supabase Admin API or Dashboard for this
-- SQL alone won't create Auth users
```

**Note:** SQL cannot directly create Supabase Auth users. Use the Dashboard or Admin API.

## Step 3: Verify Credentials

1. **Email:** Should match exactly (case-insensitive, but use lowercase)
2. **Password:** Should match exactly (case-sensitive)
3. **Default credentials** (if you created user as per README):
   - Email: `admin@example.com`
   - Password: `Admin123!`

## Step 4: Test Login

1. Make sure Expo server is running
2. Open the app on your device/emulator
3. Enter:
   - Email: `admin@example.com` (or your admin email)
   - Password: `Admin123!` (or your admin password)
4. Click **"Sign In"**

## Common Issues

### Issue 1: "Missing Supabase environment variables"
- **Solution:** Create `.env.local` file with correct variables
- **Restart:** Expo dev server after creating file

### Issue 2: "Invalid login credentials" (even with correct password)
- **Solution:** Admin user doesn't exist in Supabase Auth
- **Fix:** Create admin user via Supabase Dashboard (Step 2)

### Issue 3: "Email not confirmed"
- **Solution:** Make sure "Auto Confirm User" is checked when creating user
- **Or:** Go to user settings and manually confirm email

### Issue 4: Wrong Supabase Project
- **Solution:** Make sure you're using the SAME Supabase project as your web app
- **Check:** `EXPO_PUBLIC_SUPABASE_URL` matches your web app's `NEXT_PUBLIC_SUPABASE_URL`

## Verification Checklist

- [ ] `.env.local` file exists in `mess-management-mobile/` directory
- [ ] `EXPO_PUBLIC_SUPABASE_URL` is set correctly
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set correctly
- [ ] Admin user exists in Supabase Auth (Authentication → Users)
- [ ] Admin user email is confirmed
- [ ] Admin user password is correct
- [ ] Expo dev server restarted after environment changes
- [ ] Using the same Supabase project as web app

## Still Having Issues?

1. **Check Supabase Dashboard:**
   - Go to Authentication → Users
   - Verify admin user exists
   - Check if email is confirmed

2. **Check Environment Variables:**
   ```bash
   # In mess-management-mobile directory
   cat .env.local
   ```

3. **Check Supabase Connection:**
   - Verify `EXPO_PUBLIC_SUPABASE_URL` is correct
   - Verify `EXPO_PUBLIC_SUPABASE_ANON_KEY` is correct
   - Make sure there are no extra spaces or quotes

4. **Clear Expo Cache:**
   ```bash
   npx expo start --clear
   ```

5. **Check Console Logs:**
   - Look for any error messages in the Expo console
   - Check for "Missing Supabase environment variables" errors


