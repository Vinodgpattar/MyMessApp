-- ============================================
-- CLEANUP SCRIPT: Remove Duplicate Profiles
-- ============================================
-- This script removes duplicate profile records for the same user_id
-- Keeps the OLDEST profile record (by createdAt or id)
-- ============================================

-- Step 1: Identify duplicate profiles (for review)
SELECT 
  user_id,
  COUNT(*) as duplicate_count,
  array_agg(id) as profile_ids,
  array_agg(role) as roles,
  array_agg("createdAt") as created_dates
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Show which profiles will be deleted (for review)
-- This keeps the oldest profile by createdAt, and if tied, keeps the one with the smallest id (UUID comparison)
WITH ranked_profiles AS (
  SELECT 
    id,
    user_id,
    role,
    email,
    "createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY "createdAt" ASC, id ASC
    ) as row_num
  FROM profiles
  WHERE user_id IN (
    SELECT user_id
    FROM profiles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  )
)
SELECT 
  id,
  user_id,
  role,
  email,
  "createdAt",
  'WILL BE DELETED' as status
FROM ranked_profiles
WHERE row_num > 1
ORDER BY user_id, "createdAt";

-- Step 3: DELETE duplicate profiles (keeps oldest by createdAt, then by id)
-- ⚠️ WARNING: Run Step 1 and Step 2 first to review what will be deleted!
-- ⚠️ BACKUP YOUR DATABASE BEFORE RUNNING THIS!

DELETE FROM profiles
WHERE id IN (
  WITH ranked_profiles AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id 
        ORDER BY "createdAt" ASC, id ASC
      ) as row_num
    FROM profiles
    WHERE user_id IN (
      SELECT user_id
      FROM profiles
      GROUP BY user_id
      HAVING COUNT(*) > 1
    )
  )
  SELECT id
  FROM ranked_profiles
  WHERE row_num > 1
);

-- Step 4: Add UNIQUE constraint to prevent future duplicates
-- ⚠️ This will fail if duplicates still exist - run Step 3 first!

-- Check if constraint already exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' 
  AND constraint_type = 'UNIQUE' 
  AND constraint_name LIKE '%user_id%';

-- Add UNIQUE constraint (if not exists)
-- Uncomment the line below after verifying no duplicates exist:
-- ALTER TABLE profiles ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Step 5: Verify cleanup (should return 0 rows)
SELECT 
  user_id,
  COUNT(*) as count
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- ============================================
-- NOTES:
-- ============================================
-- 1. This script keeps the OLDEST profile record
-- 2. If multiple profiles have same createdAt, keeps the one with smallest id
-- 3. Run Step 1 and Step 2 FIRST to review what will be deleted
-- 4. BACKUP your database before running DELETE
-- 5. After cleanup, add UNIQUE constraint to prevent future duplicates
-- 6. Column names are quoted ("createdAt") because PostgreSQL is case-sensitive
-- ============================================

