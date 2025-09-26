-- Fix business type constraint to allow all supported business types
-- This updates the existing check constraint to include all business types used in the frontend

-- Drop the existing constraint
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_type_check;

-- Add the updated constraint with all supported business types
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

-- Verify the constraint was applied
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname = 'businesses_type_check' 
AND conrelid = (SELECT oid FROM pg_class WHERE relname = 'businesses');