-- Diagnostic: Check current users table structure
-- Run this first to see what columns exist

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show existing data
SELECT id, role, full_name, created_at
FROM users
LIMIT 10;
