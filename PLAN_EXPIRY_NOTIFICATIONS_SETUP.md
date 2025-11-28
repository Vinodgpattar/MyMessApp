# Plan Expiry Notifications - Setup Guide

## ✅ Implementation Complete

The plan expiry notification system has been implemented with **zero web app dependency**. Everything runs through Supabase Edge Functions and the mobile app.

## 📋 What Was Implemented

### 1. ✅ Supabase Edge Function
- **Location**: `supabase/functions/check-plan-expiry/index.ts`
- **Function**: Automatically checks for expiring/expired students and sends push notifications
- **Features**:
  - Sends notification 3 days before plan expiry
  - Sends notification when plan has expired
  - Duplicate prevention (3 days for warnings, 7 days for expired)
  - Comprehensive error handling

### 2. ✅ Database Migration
- **Location**: `supabase/migrations/001_push_tokens_and_cron.sql`
- **Creates**:
  - `user_push_tokens` table for storing push notification tokens
  - RLS policies for security
  - pg_cron setup instructions

### 3. ✅ Mobile App Updates
- **Updated**: `src/context/NotificationContext.tsx`
- **Features**:
  - Automatic push token registration on login
  - Handles plan expiry notification taps
  - Navigates to profile screen when notification is tapped

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `supabase/migrations/001_push_tokens_and_cron.sql`
3. Copy and paste the SQL
4. **IMPORTANT**: Comment out the pg_cron schedule section for now (we'll add it after deploying the function)
5. Click **Run**

### Step 2: Deploy Edge Function

From project root (`D:\MarketplaceProject`):

```powershell
# Make sure you're linked to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy check-plan-expiry
```

### Step 3: Set Up pg_cron Schedule

After the function is deployed, go back to Supabase SQL Editor and run:

```sql
-- Replace YOUR_PROJECT_REF with your Supabase project reference
-- Replace YOUR_SERVICE_ROLE_KEY with your service role key (from Supabase Settings → API)
SELECT cron.schedule(
  'check-plan-expiry-daily',
  '0 9 * * *', -- 9 AM daily (UTC) - adjust timezone as needed
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-plan-expiry',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**To find your project reference:**
- Look at your Supabase dashboard URL: `https://xxxxx.supabase.co`
- `xxxxx` is your project reference

**To find your service role key:**
- Go to Supabase Dashboard → Settings → API
- Copy the `service_role` key (keep it secret!)

### Step 4: Add Expo Project ID (If Needed)

If you're using EAS Build, add your Expo project ID to `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

**To find your Expo project ID:**
- Go to https://expo.dev
- Select your project
- Project ID is shown in project settings

**Note**: If you're not using EAS Build, the project ID will be auto-detected from your Expo account.

### Step 5: Test the System

#### Test Push Token Registration

1. Open mobile app
2. Log in as a student
3. Grant notification permissions
4. Check Supabase: `SELECT * FROM user_push_tokens;`
5. You should see a token for the logged-in user

#### Test Edge Function Manually

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-plan-expiry \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "success": true,
  "results": {
    "expiring": { "sent": 0, "failed": 0, "skipped": 0 },
    "expired": { "sent": 0, "failed": 0, "skipped": 0 }
  },
  "timestamp": "2025-01-21T09:00:00.000Z"
}
```

#### Test with Real Data

1. Create a test student with `endDate` = today + 3 days
2. Register push token for that student
3. Manually trigger the Edge Function
4. Student should receive notification

## 📊 Monitoring

### Check Scheduled Jobs

```sql
SELECT * FROM cron.job WHERE jobname = 'check-plan-expiry-daily';
```

### Check Cron Job History

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-plan-expiry-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

### Check Notification Logs

```sql
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
FROM "NotificationLog"
WHERE type IN ('expiry_warning', 'expired_notification')
  AND "sentAt" >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY type;
```

### Check Students Needing Notifications

```sql
-- Students expiring in 3 days
SELECT id, name, email, "endDate", "user_id"
FROM "Student"
WHERE "isActive" = true
  AND "endDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
  AND "user_id" IS NOT NULL;

-- Expired students
SELECT id, name, email, "endDate", "user_id"
FROM "Student"
WHERE "isActive" = true
  AND "endDate" < CURRENT_DATE
  AND "user_id" IS NOT NULL;
```

## 🔧 Customization

### Change Notification Timing

Edit `supabase/functions/check-plan-expiry/index.ts`:

```typescript
// Change from 3 days to 5 days
const fiveDaysLater = new Date(today)
fiveDaysLater.setDate(fiveDaysLater.getDate() + 5)
```

### Change Schedule

```sql
-- Run at 8 AM daily instead of 9 AM
SELECT cron.unschedule('check-plan-expiry-daily');
SELECT cron.schedule(
  'check-plan-expiry-daily',
  '0 8 * * *',
  -- ... rest of SQL
);
```

### Change Duplicate Prevention Period

Edit `supabase/functions/check-plan-expiry/index.ts`:

```typescript
// Change from 3 days to 5 days for expiry warnings
.gte('sentAt', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
```

## 🐛 Troubleshooting

### "No push tokens found"
- Ensure students have logged into mobile app
- Check notification permissions are granted
- Verify `user_push_tokens` table has data: `SELECT * FROM user_push_tokens;`

### "Function not found"
- Deploy the function: `npx supabase functions deploy check-plan-expiry`
- Verify deployment: `npx supabase functions list`

### "Cron job not running"
- Check pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
- Verify cron job exists: `SELECT * FROM cron.job;`
- Check for errors: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`

### "Expo project ID not found"
- Add to `app.json` (see Step 4 above)
- Or ensure you're logged into Expo account in mobile app

### Notifications not received
- Check push token is registered: `SELECT * FROM user_push_tokens WHERE user_id = 'USER_ID';`
- Check notification logs: `SELECT * FROM "NotificationLog" WHERE "studentId" = STUDENT_ID ORDER BY "sentAt" DESC;`
- Verify student has `user_id` set: `SELECT id, name, "user_id" FROM "Student" WHERE id = STUDENT_ID;`

## ✅ Verification Checklist

- [ ] Database migration run successfully
- [ ] `user_push_tokens` table exists
- [ ] Edge Function deployed
- [ ] pg_cron schedule set up
- [ ] Expo project ID added to `app.json` (if using EAS)
- [ ] Test student created with expiring plan
- [ ] Push token registered for test student
- [ ] Manual function test successful
- [ ] Notification received on mobile device
- [ ] Notification tap navigates to profile screen

## 📱 How It Works

1. **Daily Check**: pg_cron triggers Edge Function daily at 9 AM
2. **Find Students**: Function queries for expiring (3 days) and expired students
3. **Get Tokens**: Fetches push tokens from `user_push_tokens` table
4. **Check Duplicates**: Prevents sending same notification within time period
5. **Send Notifications**: Uses Expo Push Notification Service
6. **Log Results**: Records all notifications in `NotificationLog` table
7. **Mobile Receives**: Students receive push notifications on their devices
8. **Tap to Navigate**: Tapping notification opens profile screen

## 🎯 Key Features

- ✅ **Zero Web App Dependency**: Everything runs through Supabase
- ✅ **Automatic**: Runs daily via pg_cron
- ✅ **Duplicate Prevention**: Won't spam students
- ✅ **Error Handling**: Continues even if individual notifications fail
- ✅ **Comprehensive Logging**: All notifications logged for tracking
- ✅ **Mobile-First**: Push tokens stored and managed in mobile app

## 📚 Related Files

- Edge Function: `supabase/functions/check-plan-expiry/index.ts`
- SQL Migration: `supabase/migrations/001_push_tokens_and_cron.sql`
- Mobile Context: `mess-management-mobile/src/context/NotificationContext.tsx`
- Deployment Guide: `supabase/functions/check-plan-expiry/DEPLOYMENT_GUIDE.md`










