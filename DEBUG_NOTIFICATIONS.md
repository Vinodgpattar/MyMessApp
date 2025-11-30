# Debugging: No Announcements Showing

## Quick Checks

### 1. Verify Student Has Notifications
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Replace STUDENT_ID with actual student ID
SELECT 
  anr.id,
  anr."studentId",
  anr.read,
  an.id as notification_id,
  an.title,
  an.message,
  an."sentAt"
FROM "AdminNotificationRecipient" anr
JOIN "AdminNotification" an ON an.id = anr."notificationId"
WHERE anr."studentId" = STUDENT_ID
ORDER BY an."sentAt" DESC;
```

### 2. Check if Student Has user_id
```sql
SELECT id, name, email, "user_id" 
FROM "Student" 
WHERE id = STUDENT_ID;
```

### 3. Check RLS Policies
```sql
-- Verify students can view their own recipients
SELECT * FROM pg_policies 
WHERE tablename = 'AdminNotificationRecipient';
```

### 4. Test RLS as Student User
```sql
-- Replace STUDENT_USER_ID with actual auth.users.id
SET ROLE authenticated;
SET request.jwt.claim.sub = 'STUDENT_USER_ID';

-- Should return student's notifications
SELECT * FROM "AdminNotificationRecipient" 
WHERE "studentId" = (
  SELECT id FROM "Student" WHERE "user_id" = 'STUDENT_USER_ID'
);

RESET ROLE;
```

## Common Issues

### Issue 1: No Recipient Records Created
**Symptom:** Admin sends announcement but no records in `AdminNotificationRecipient`

**Check:**
```sql
-- Check if announcement was created
SELECT * FROM "AdminNotification" ORDER BY "sentAt" DESC LIMIT 5;

-- Check if recipients were created
SELECT COUNT(*) FROM "AdminNotificationRecipient";
```

**Fix:** Check `send-announcement` Edge Function logs for errors

### Issue 2: Student Not in Target List
**Symptom:** Announcement sent but student not included

**Check:**
```sql
-- Check target type and student IDs
SELECT 
  id,
  title,
  "targetType",
  "targetStudentIds",
  "totalSent"
FROM "AdminNotification"
ORDER BY "sentAt" DESC
LIMIT 5;
```

**Fix:** Ensure student matches the target criteria (active, expiring, etc.)

### Issue 3: RLS Policy Blocking Access
**Symptom:** Records exist but student can't see them

**Check:**
```sql
-- Verify policy exists
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'AdminNotificationRecipient'
AND cmd = 'SELECT';
```

**Fix:** Ensure "Students can view own recipients" policy exists

### Issue 4: studentId Mismatch
**Symptom:** Query uses wrong studentId

**Check in app:**
- Console logs should show `studentId` value
- Verify it matches the actual student ID in database

## Debugging Steps

1. **Check Console Logs:**
   - Open app and navigate to Announcements tab
   - Check console for:
     - `[DEBUG] Fetching notifications`
     - `[DEBUG] Test query successful`
     - `[DEBUG] Notifications fetched successfully`
     - Any error messages

2. **Verify Data Exists:**
   - Run SQL queries above
   - Confirm records exist in database

3. **Test RLS:**
   - Run RLS test query above
   - Verify student can see their own records

4. **Check Edge Function:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Check `send-announcement` function logs
   - Look for errors when sending announcements

## Quick Fix Script

If you need to manually create a test notification:

```sql
-- 1. Create test notification
INSERT INTO "AdminNotification" (title, message, "sentBy", "targetType", "totalSent")
VALUES ('Test Announcement', 'This is a test', 'ADMIN_USER_ID', 'all', 1)
RETURNING id;

-- 2. Create recipient record (replace NOTIFICATION_ID and STUDENT_ID)
INSERT INTO "AdminNotificationRecipient" ("notificationId", "studentId", read, "pushSent")
VALUES (NOTIFICATION_ID, STUDENT_ID, false, false);
```

