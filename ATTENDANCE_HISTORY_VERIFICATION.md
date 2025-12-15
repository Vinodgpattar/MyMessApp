# Attendance History Verification Guide

## Overview
This guide helps verify if the attendance history feature in the student dashboard is working correctly.

## Components to Check

### 1. ✅ Database Schema
The `Attendance` table should exist with the following structure:
- `id` (Primary Key)
- `studentId` (Foreign Key to Student.id)
- `date` (DATE)
- `breakfast` (BOOLEAN)
- `lunch` (BOOLEAN)
- `dinner` (BOOLEAN)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

**Check in Supabase:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Attendance';
```

### 2. ✅ RLS Policies
Students should be able to view their own attendance records.

**Policy:** "Students can view own attendance"
```sql
CREATE POLICY "Students can view own attendance"
  ON "Attendance" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Student" s
      WHERE s.id = "Attendance"."studentId"
      AND s."user_id" = auth.uid()
    )
  );
```

**Verify in Supabase:**
```sql
-- Check if policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'Attendance' 
AND policyname = 'Students can view own attendance';
```

### 3. ✅ Mobile App Implementation

#### Location
- File: `src/app/(student)/(tabs)/attendance.tsx`
- Component: `StudentAttendanceScreen`

#### Features
- ✅ Today's attendance status (breakfast, lunch, dinner)
- ✅ Attendance statistics (total meals, days attended, attendance rate)
- ✅ Attendance history with filters (Week, Month, All Time)
- ✅ Pull-to-refresh functionality
- ✅ Improved error handling and logging (added in latest update)

### 4. 🔍 How to Test Attendance History

#### Step 1: Verify Student Has Attendance Records
1. Log in as admin
2. Mark attendance for a student (via QR code or admin panel)
3. Verify in Supabase:
```sql
SELECT * FROM "Attendance" 
WHERE "studentId" = YOUR_STUDENT_ID 
ORDER BY date DESC 
LIMIT 10;
```

#### Step 2: Test as Student
1. Log in as the student
2. Navigate to Attendance tab
3. Check console logs for:
   - `[DEBUG] Fetching attendance history`
   - `[DEBUG] Attendance history fetched successfully`
   - Or error messages if something fails

#### Step 3: Test Filters
1. Try different filter options:
   - **This Week**: Shows last 7 days
   - **This Month**: Shows current month
   - **All Time**: Shows last 90 days
2. Verify records update correctly when switching filters

#### Step 4: Test Refresh
1. Mark new attendance (as admin or via QR code)
2. Pull down to refresh in the student app
3. Verify new attendance appears in history

### 5. 🐛 Common Issues & Solutions

#### Issue: No attendance records showing
**Symptoms:**
- History shows "No attendance records found"
- Statistics show 0 for all values

**Solutions:**
1. Verify attendance records exist:
```sql
SELECT COUNT(*) FROM "Attendance" 
WHERE "studentId" = YOUR_STUDENT_ID;
```

2. Check if student has `user_id` set:
```sql
SELECT id, name, "user_id" FROM "Student" 
WHERE id = YOUR_STUDENT_ID;
```

3. Verify RLS policy allows access:
```sql
-- Test as the student user
SET ROLE authenticated;
SET request.jwt.claim.sub = 'STUDENT_USER_ID';
SELECT * FROM "Attendance" WHERE "studentId" = YOUR_STUDENT_ID;
```

#### Issue: Error loading attendance history
**Symptoms:**
- Console shows error messages
- Red error message appears in UI

**Solutions:**
1. Check console logs for specific error:
   - Permission denied → Check RLS policies
   - Column not found → Check table schema
   - Network error → Check Supabase connection

2. Verify student authentication:
   - Student must be logged in
   - Session must be valid
   - Student must have `user_id` in Student table

3. Check Supabase logs:
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for any errors related to Attendance table queries

#### Issue: Wrong date range
**Symptoms:**
- History shows incorrect date range
- Records missing from expected period

**Solutions:**
1. Verify date calculation:
   - Week: Last 7 days from today
   - Month: Current month (1st to today)
   - All Time: Last 90 days from today

2. Check date format:
   - Dates should be in `YYYY-MM-DD` format
   - Timezone should be consistent

#### Issue: Statistics incorrect
**Symptoms:**
- Attendance percentage seems wrong
- Total meals count doesn't match records

**Solutions:**
1. Verify calculation logic:
   - Total meals = sum of (breakfast + lunch + dinner) across all records
   - Total days = number of unique dates
   - Attendance % = (total meals / (total days * 3)) * 100

2. Check for null values:
```sql
SELECT 
  COUNT(*) as total_records,
  SUM(CASE WHEN breakfast THEN 1 ELSE 0 END) as breakfast_count,
  SUM(CASE WHEN lunch THEN 1 ELSE 0 END) as lunch_count,
  SUM(CASE WHEN dinner THEN 1 ELSE 0 END) as dinner_count
FROM "Attendance"
WHERE "studentId" = YOUR_STUDENT_ID;
```

### 6. 📊 Debugging Queries

#### Check student's attendance records:
```sql
SELECT 
  a.date,
  a.breakfast,
  a.lunch,
  a.dinner,
  a."createdAt"
FROM "Attendance" a
JOIN "Student" s ON s.id = a."studentId"
WHERE s."user_id" = 'STUDENT_USER_ID'
ORDER BY a.date DESC
LIMIT 20;
```

#### Check attendance statistics:
```sql
SELECT 
  COUNT(DISTINCT date) as total_days,
  SUM(CASE WHEN breakfast THEN 1 ELSE 0 END) as breakfast_count,
  SUM(CASE WHEN lunch THEN 1 ELSE 0 END) as lunch_count,
  SUM(CASE WHEN dinner THEN 1 ELSE 0 END) as dinner_count,
  SUM(
    (CASE WHEN breakfast THEN 1 ELSE 0 END) +
    (CASE WHEN lunch THEN 1 ELSE 0 END) +
    (CASE WHEN dinner THEN 1 ELSE 0 END)
  ) as total_meals
FROM "Attendance"
WHERE "studentId" = YOUR_STUDENT_ID
  AND date >= CURRENT_DATE - INTERVAL '90 days';
```

#### Check RLS policy effectiveness:
```sql
-- As student user (replace with actual user ID)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'STUDENT_USER_ID';

-- Should only return this student's records
SELECT * FROM "Attendance";

-- Reset
RESET ROLE;
```

#### Check for missing user_id links:
```sql
-- Students without user_id (can't view attendance)
SELECT s.id, s.name, s.email, s."user_id"
FROM "Student" s
WHERE s."user_id" IS NULL
  AND EXISTS (SELECT 1 FROM "Attendance" a WHERE a."studentId" = s.id);
```

### 7. ✅ Verification Checklist

- [ ] `Attendance` table exists with correct schema
- [ ] RLS policies allow students to view own attendance
- [ ] Student has `user_id` set in Student table
- [ ] At least one attendance record exists for the student
- [ ] Student is logged in with valid session
- [ ] Console logs show successful fetch (or specific error)
- [ ] History list displays correctly
- [ ] Filters (Week/Month/All) work correctly
- [ ] Statistics calculate correctly
- [ ] Pull-to-refresh updates the data
- [ ] New attendance appears after marking

### 8. 🔧 Next Steps if Not Working

1. **Enable detailed logging:**
   - Check console logs when opening Attendance tab
   - Look for `[DEBUG]` messages about fetching history
   - Check for any error messages

2. **Test RLS policies:**
   - Use the debugging queries above
   - Verify student can only see their own records
   - Check if admin can see all records

3. **Verify data exists:**
   - Mark some test attendance as admin
   - Verify records appear in database
   - Check if student can see them

4. **Check network:**
   - Verify Supabase connection
   - Check if other queries work (student profile, etc.)
   - Test with different network conditions

## Summary

The attendance history feature:
1. **Fetches data** from `Attendance` table filtered by student ID and date range
2. **Respects RLS** - students can only see their own records
3. **Displays statistics** - calculates total meals, days, and percentage
4. **Supports filtering** - Week, Month, or All Time views
5. **Handles errors** - shows error messages if something fails

All components are implemented. Use the debugging queries above to verify each step is working.



