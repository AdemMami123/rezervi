-- Fix RLS policies for reservations to work with server-side authentication
-- This addresses the "Reservation not found or access denied" issue

-- First, let's drop the existing reservation policies
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Business owners can view their business reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Business owners can update reservations for their business" ON reservations;

-- Create new, more permissive policies that work better with server-side authentication

-- Allow authenticated users to view reservations where they are the client
CREATE POLICY "Users can view own reservations" ON reservations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = client_id OR 
      EXISTS (
        SELECT 1 FROM businesses 
        WHERE businesses.id = reservations.business_id 
        AND businesses.user_id = auth.uid()
      )
    )
  );

-- Allow business owners to view all their business reservations
CREATE POLICY "Business owners can view business reservations" ON reservations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = reservations.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create reservations
CREATE POLICY "Authenticated users can create reservations" ON reservations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = client_id OR 
      client_id IS NULL
    )
  );

-- Allow clients to update their own reservations (status changes, etc.)
CREATE POLICY "Clients can update own reservations" ON reservations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND auth.uid() = client_id
  );

-- Allow business owners to update reservations for their business (accept/decline)
CREATE POLICY "Business owners can update business reservations" ON reservations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = reservations.business_id 
      AND businesses.user_id = auth.uid()
    )
  );

-- Also ensure the status column exists (if not already applied)
ALTER TABLE reservations 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' 
  CHECK (status IN ('pending','confirmed','cancelled','completed'));

-- Backfill any existing rows that might have null status
UPDATE reservations SET status = 'pending' WHERE status IS NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Let's also check if we need to ensure proper auth context for RLS
-- Add a function to help debug auth context (optional)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;