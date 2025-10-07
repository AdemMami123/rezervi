-- Check if users table has email column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Show sample data to see structure
SELECT *
FROM users
LIMIT 3;
