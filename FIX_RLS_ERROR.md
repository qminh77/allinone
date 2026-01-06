# 🚨 FIX: 500 Internal Server Error - RLS Circular Dependency

## Problem
Your application is getting 500 errors when querying `user_profiles` because of circular dependencies in the Row Level Security (RLS) policies.

## Root Cause
The RLS policy "Admins can view all profiles" tries to check if a user is admin by querying `user_profiles`, which causes Postgres to re-evaluate the RLS policies again → infinite recursion → 500 error.

## Solution
Apply the fixed migration that uses a `SECURITY DEFINER` function to bypass RLS when checking admin status.

---

## 📋 Steps to Fix

### 1. Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qlobiachlzpuiybvnnxv
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

### 2. Run the Fixed Migration
Copy and paste the entire contents of this file into the SQL Editor:
```
supabase/migrations/002_rls_policies_fixed.sql
```

Then click **Run** (or press Ctrl+Enter).

### 3. Verify the Fix
After running the migration, refresh your application in the browser. The 500 errors should be gone.

---

## 🔍 What Changed?

### Before (Broken):
```sql
-- ❌ This causes circular dependency
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up  -- ← Queries user_profiles again!
      JOIN roles r ON r.id = up.role_id
      WHERE up.id = auth.uid() AND r.name = 'Admin'
    )
  );
```

### After (Fixed):
```sql
-- ✅ SECURITY DEFINER function bypasses RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER  -- ← This is the key!
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid() AND r.name = 'Admin'
  );
$$;

-- ✅ Now use the function
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin());  -- ← No more circular dependency!
```

---

## 🧪 Test After Fix

1. **Reload your app**: The errors should disappear
2. **Check browser console**: No more 500 errors
3. **Test admin routes**: `/admin` should work if you have admin role
4. **Test regular user**: Dashboard should load profile correctly

---

## ⚠️ Important Notes

- The `SECURITY DEFINER` function runs with the privileges of the function owner (which is the superuser), so it can bypass RLS
- This is safe because the function only checks if `auth.uid()` is an admin, it doesn't expose any sensitive data
- All other RLS policies remain intact and secure

---

## 🆘 If You Still Have Issues

Check the browser console for the exact error message and verify:
1. The migration ran successfully without SQL errors
2. The function `is_admin()` was created
3. All policies were recreated

You can verify the function exists:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'is_admin';
```
