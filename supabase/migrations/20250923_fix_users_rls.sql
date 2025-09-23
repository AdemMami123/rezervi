-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own user data" ON users;
DROP POLICY IF EXISTS "Users can update their own user data" ON users;

-- Allow users to read their own data
CREATE POLICY "Users can view their own user data" 
ON users
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own user data" 
ON users
FOR UPDATE
USING (auth.uid() = id);

-- Optional: Allow superadmin to view all data
-- CREATE POLICY "Admins can view all user data" 
-- ON users
-- FOR SELECT 
-- USING (auth.email() = 'your-admin-email@example.com');