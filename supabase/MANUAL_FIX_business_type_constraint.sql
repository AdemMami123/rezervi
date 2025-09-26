-- ==============================================
-- BUSINESS TYPE CONSTRAINT FIX
-- ==============================================
-- Copy and paste this SQL into your Supabase SQL Editor
-- This will fix the business type constraint issue

-- 1. First, let's see what the current constraint looks like
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'businesses_type_check' 
AND conrelid = (SELECT oid FROM pg_class WHERE relname = 'businesses');

-- 2. Drop the existing constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_type_check;

-- 3. Add the updated constraint with all supported business types
ALTER TABLE businesses ADD CONSTRAINT businesses_type_check 
CHECK (type IN (
  'barbershop', 
  'beauty_salon', 
  'restaurant', 
  'cafe', 
  'football_field', 
  'tennis_court', 
  'gym', 
  'car_wash', 
  'spa', 
  'dentist', 
  'doctor', 
  'other'
));

-- 4. Verify the new constraint was applied correctly
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'businesses_type_check' 
AND conrelid = (SELECT oid FROM pg_class WHERE relname = 'businesses');