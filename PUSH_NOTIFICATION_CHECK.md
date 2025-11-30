# Push Notification System - Verification Guide

## Overview
This guide helps you verify if push notifications are working correctly in your app.

## Components to Check

### 1. ✅ Database Schema
The `user_push_tokens` table should exist with the following structure:
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `push_token` (TEXT)
- `platform` (TEXT: 'ios', 'android', 'web')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- UNIQUE constraint on `(user_id, platform)`

**Check in Supabase:**
```sql
SELECT * FROM user_push_tokens;
```

### 2. ✅ Edge Functions Deployed
Both functions should be deployed:
- ✅ `send-announcement` - Creates notification and triggers push
- ✅ `send-announcement-push` - Sends push notifications via Expo

**Status:** Both are deployed and active.

### 3. ✅ Mobile App Configuration

#### app.json
- ✅ `expo-notifications` plugin is configured
- ✅ EAS project ID is set: `9638ea31-1cb0-4587-bb69-fe880ca6c02b`

#### NotificationContext
- ✅ Automatically registers push token on login
- ✅ Improved error logging (added in latest update)

### 4. 🔍 How to Test Push Notifications

#### Step 1: Check Token Registration
1. Open the app and log in as a student
2. Check the console logs for:
   - `[DEBUG] Getting Expo push token`
   - `[DEBUG] Expo push token received`
   - `[INFO] Push token registered successfully`

3. Verify in Supabase:
```sql
SELECT user_id, platform, push_token, updated_at 
FROM user_push_tokens 
WHERE user_id = 'YOUR_USER_ID';
```

#### Step 2: Test Sending Notification
1. Log in as admin
2. Go to Notifications/Announcements
3. Create and send an announcement
4. Check console logs for:
   - `send-announcement` function call
   - `send-announcement-push` function call

#### Step 3: Verify Push Delivery
1. On the student device, ensure:
   - App has notification permissions granted
   - Device is connected to internet
   - App is either in background or closed (not foreground)

2. Check Supabase logs:
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Check `send-announcement-push` logs for success/failure

### 5. 🐛 Common Issues & Solutions

#### Issue: No push token registered
**Symptoms:**
- No entry in `user_push_tokens` table
- Console shows: "Expo project ID not found"

**Solutions:**
1. Verify `app.json` has correct `extra.eas.projectId`
2. Check if running in Expo Go (push tokens don't work in Expo Go)
3. Rebuild the app: `eas build --platform android`

#### Issue: Token registered but no push received
**Symptoms:**
- Token exists in database
- `send-announcement-push` function runs
- But no notification appears

**Solutions:**
1. Check notification permissions:
   - Android: Settings → Apps → Mess Management → Notifications
   - iOS: Settings → Notifications → Mess Management

2. Verify token format:
   - Should start with `ExponentPushToken[`
   - Check in Supabase: `SELECT push_token FROM user_push_tokens LIMIT 1;`

3. Check Expo Push API:
   - Token might be invalid or expired
   - Try re-registering the token (logout and login again)

#### Issue: Function returns error
**Symptoms:**
- Edge Function logs show errors
- "No push tokens found" message

**Solutions:**
1. Verify `user_push_tokens` table has data:
```sql
SELECT COUNT(*) FROM user_push_tokens;
```

2. Check RLS policies:
```sql
-- Should allow users to insert their own tokens
SELECT * FROM pg_policies WHERE tablename = 'user_push_tokens';
```

3. Verify student has `user_id` in Student table:
```sql
SELECT id, name, user_id FROM Student WHERE user_id IS NOT NULL;
```

### 6. 📊 Debugging Queries

#### Check all registered tokens:
```sql
SELECT 
  upt.user_id,
  p.email,
  upt.platform,
  LEFT(upt.push_token, 30) || '...' as token_preview,
  upt.updated_at
FROM user_push_tokens upt
LEFT JOIN profiles p ON p.user_id = upt.user_id
ORDER BY upt.updated_at DESC;
```

#### Check students without tokens:
```sql
SELECT 
  s.id,
  s.name,
  s.email,
  s.user_id
FROM Student s
WHERE s.isActive = true
  AND s.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_push_tokens upt 
    WHERE upt.user_id = s.user_id
  );
```

#### Check recent notifications:
```sql
SELECT 
  an.id,
  an.title,
  an.sentAt,
  an.totalSent,
  COUNT(anr.id) as recipients_count,
  SUM(CASE WHEN anr.pushSent THEN 1 ELSE 0 END) as push_sent_count
FROM AdminNotification an
LEFT JOIN AdminNotificationRecipient anr ON anr.notificationId = an.id
GROUP BY an.id, an.title, an.sentAt, an.totalSent
ORDER BY an.sentAt DESC
LIMIT 10;
```

### 7. ✅ Verification Checklist

- [ ] `user_push_tokens` table exists and has correct schema
- [ ] RLS policies allow users to insert/update their own tokens
- [ ] `send-announcement` Edge Function is deployed
- [ ] `send-announcement-push` Edge Function is deployed
- [ ] App has notification permissions
- [ ] EAS project ID is configured in `app.json`
- [ ] At least one student has a registered push token
- [ ] Test notification can be sent from admin panel
- [ ] Push notification appears on student device

### 8. 🔧 Next Steps if Not Working

1. **Enable detailed logging:**
   - Check console logs when logging in
   - Check Supabase Edge Function logs
   - Check Expo Push API response

2. **Test with Expo Push Tool:**
   - Go to: https://expo.dev/notifications
   - Enter a push token from your database
   - Send a test notification

3. **Verify app build:**
   - Push notifications don't work in Expo Go
   - Must use development build or production APK
   - Rebuild if needed: `eas build --platform android`

4. **Check network:**
   - Device must have internet connection
   - Firewall should allow Expo Push API (exp.host)

## Summary

The push notification system consists of:
1. **Token Registration:** Mobile app registers Expo push token on login
2. **Notification Creation:** Admin creates announcement via `send-announcement` function
3. **Push Delivery:** `send-announcement-push` function sends push via Expo Push API

All components are deployed and configured. Use the debugging queries above to verify each step is working.

