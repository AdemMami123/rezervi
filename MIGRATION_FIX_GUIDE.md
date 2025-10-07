# MIGRATION FIX GUIDE - User Registration Fields

## Problem Identified ✅

1. **Error**: `column "username" of relation "users" contains null values`
2. **Cause**: Migration was trying to add NOT NULL constraint before populating existing rows with data

## Solution Applied ✅

The migration has been **FIXED** with the correct order of operations:

### Fixed Migration Order:
1. ✅ Add columns as NULLABLE first
2. ✅ Populate existing rows with default values
3. ✅ Then add NOT NULL constraints
4. ✅ Add other constraints and indexes

---

## How to Run the Fixed Migration

### Option 1: Use the SAFE Version (Recommended)
This version has extra error handling and can be re-run safely:

```sql
-- In Supabase Dashboard > SQL Editor, run:
supabase/migrations/20251007_add_user_registration_fields_SAFE.sql
```

### Option 2: Use the Fixed Original
The original file has been corrected:

```sql
-- In Supabase Dashboard > SQL Editor, run:
supabase/migrations/20251007_add_user_registration_fields.sql
```

---

## Step-by-Step Instructions

### 1. Check Current Table Structure (Optional)
Run this diagnostic query first:

```sql
-- See what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- See existing user data
SELECT id, role, full_name, created_at
FROM users
LIMIT 10;
```

### 2. If Migration Already Failed Partially
If you already tried running the migration and it failed, you may need to clean up:

```sql
-- Remove partially created columns (if they exist)
ALTER TABLE users
DROP COLUMN IF EXISTS username,
DROP COLUMN IF EXISTS phone_number,
DROP COLUMN IF EXISTS birthday;

-- Now you can run the fixed migration
```

### 3. Run the Fixed Migration
Copy the entire content of either:
- `20251007_add_user_registration_fields_SAFE.sql` (recommended)
- OR `20251007_add_user_registration_fields.sql` (fixed version)

Paste into Supabase Dashboard > SQL Editor and execute.

### 4. Verify Migration Success
After running, check that it worked:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check existing users have default values
SELECT id, username, phone_number, birthday, full_name
FROM users;

-- Check constraints
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'users'::regclass;
```

---

## What the Migration Does

### For Existing Users:
- **Username**: Auto-generated as `user_<first-8-chars-of-uuid>`
  - Example: `user_a1b2c3d4`
- **Phone Number**: Set to empty string `''`
- **Birthday**: Set to `2000-01-01`

### For New Users:
- All three fields are **required**
- Username must be **unique**
- Phone number must be **valid format**
- Birthday must be **valid date in the past**
- User must be **13+ years old**

---

## Expected Output

### Success Message:
```
Query executed successfully
ALTER TABLE
UPDATE 5
ALTER TABLE
ALTER TABLE
CREATE INDEX
COMMENT
```

### If You See Errors:

#### Error: "constraint already exists"
**Solution**: The constraint was already added. You can ignore this or drop it first:
```sql
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;
-- Then re-run the migration
```

#### Error: "column already exists"
**Solution**: The column was already added. The migration uses `IF NOT EXISTS` so this shouldn't happen, but if it does:
```sql
-- Check what exists
SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
```

#### Error: "null value in column violates not-null constraint"
**Solution**: Some rows still have null values. Run this:
```sql
UPDATE users
SET 
  username = COALESCE(username, 'user_' || substr(id::text, 1, 8)),
  phone_number = COALESCE(phone_number, ''),
  birthday = COALESCE(birthday, '2000-01-01'::date)
WHERE username IS NULL OR phone_number IS NULL OR birthday IS NULL;
```

---

## About the full_name / Email Column

Based on your screenshot, the `users` table has:
- A `full_name` column (text)
- The data shows email addresses stored in this column

**This is correct** for the current implementation. The application code properly uses:
- `full_name` column to store the user's full name
- `email` is stored in the `auth.users` table (Supabase Auth)

The registration now requires a separate full name field, so new users will have:
- **full_name**: Actual name (e.g., "John Doe")
- **username**: Unique username (e.g., "johndoe123")
- **email**: Stored in auth.users

For existing users (your test accounts), you may want to update them:
```sql
-- Optional: Update existing test accounts
UPDATE users
SET 
  username = 'ademtest1',
  phone_number = '+1234567890',
  birthday = '1995-01-01'
WHERE full_name = 'adem.mami@itbs.tn';
```

---

## After Migration Completes

### 1. Restart Backend Server
```powershell
cd server
node index.js
```

### 2. Test New Registration
Navigate to: http://localhost:3000/register

Try registering with all fields:
- Full Name: Test User
- Username: testuser123
- Phone: +1 234 567 8900
- Birthday: 1995-06-15
- Email: test@example.com
- Password: password123

### 3. Verify Database
```sql
SELECT id, username, phone_number, birthday, full_name
FROM users
ORDER BY created_at DESC
LIMIT 5;
```

---

## Files Available

1. **`20251007_add_user_registration_fields.sql`** - Fixed original migration
2. **`20251007_add_user_registration_fields_SAFE.sql`** - Extra safe version with error handling
3. **`DIAGNOSTIC_check_users_table.sql`** - Query to check current table structure
4. **`MIGRATION_FIX_GUIDE.md`** - This guide

---

## Quick Command Reference

```sql
-- Clean slate (if needed)
ALTER TABLE users DROP COLUMN IF EXISTS username, DROP COLUMN IF EXISTS phone_number, DROP COLUMN IF EXISTS birthday;

-- Check table
\d users

-- See data
SELECT * FROM users;

-- Update existing user
UPDATE users SET username = 'myusername', phone_number = '+1234567890', birthday = '1990-01-01' WHERE id = 'your-user-id';
```

---

## Summary

✅ Migration files have been **FIXED**
✅ Correct order: Add columns → Populate data → Add constraints
✅ Default values for existing users
✅ Safe to run now

**Next Step**: Run the migration in Supabase SQL Editor!
