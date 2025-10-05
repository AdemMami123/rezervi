-- Fix for RLS Policy Issue in Messaging System
-- This allows triggers to insert participant records for both users

-- 1. Update the INSERT policy for conversation_participants to allow trigger inserts
DROP POLICY IF EXISTS "Users can insert participant records" ON conversation_participants;
CREATE POLICY "Users can insert participant records" ON conversation_participants
  FOR INSERT
  WITH CHECK (
    -- Allow user to insert their own record
    user_id = auth.uid() 
    OR
    -- Allow insert if user is part of the conversation (for trigger)
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR 
            business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- 2. Make trigger functions run with elevated privileges
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Get the recipient (the other participant in the conversation)
  SELECT CASE
    WHEN c.customer_id = NEW.sender_id THEN b.user_id
    ELSE c.customer_id
  END INTO recipient_id
  FROM conversations c
  LEFT JOIN businesses b ON b.id = c.business_id
  WHERE c.id = NEW.conversation_id;
  
  -- Update or insert participant unread count
  INSERT INTO conversation_participants (conversation_id, user_id, unread_count, updated_at)
  VALUES (NEW.conversation_id, recipient_id, 1, NOW())
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET 
    unread_count = conversation_participants.unread_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update conversation on message function
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reset unread count function
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    UPDATE conversation_participants
    SET 
      unread_count = GREATEST(0, unread_count - 1),
      last_read_at = NEW.read_at,
      updated_at = NOW()
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
