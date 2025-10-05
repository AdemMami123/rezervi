-- Migration: Create Messaging System
-- Description: Create tables for real-time messaging between customers and businesses
-- Created: 2025-10-05

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONVERSATIONS TABLE
-- Stores conversation metadata between a customer and a business
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one conversation per customer-business pair
  CONSTRAINT unique_conversation UNIQUE(customer_id, business_id)
);

-- 2. MESSAGES TABLE
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CONVERSATION_PARTICIPANTS TABLE
-- Additional metadata about participants in a conversation
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique participant-conversation pairs
  CONSTRAINT unique_participant UNIQUE(conversation_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CONVERSATIONS

-- Users can view conversations they are part of (either as customer or business owner)
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT
  USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (
      SELECT user_id FROM businesses WHERE businesses.id = conversations.business_id
    )
  );

-- Customers can create conversations with businesses
DROP POLICY IF EXISTS "Customers can create conversations" ON conversations;
CREATE POLICY "Customers can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Both parties can update conversation metadata
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations" ON conversations
  FOR UPDATE
  USING (
    auth.uid() = customer_id OR 
    auth.uid() IN (
      SELECT user_id FROM businesses WHERE businesses.id = conversations.business_id
    )
  );

-- RLS Policies for MESSAGES

-- Users can view messages in their conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR 
            business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR 
            business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- Users can update their own messages (for read status)
DROP POLICY IF EXISTS "Users can update message read status" ON messages;
CREATE POLICY "Users can update message read status" ON messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR 
            business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- RLS Policies for CONVERSATION_PARTICIPANTS

-- Users can view participant data for their conversations
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR 
            business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    )
  );

-- Users can insert their own participant records
DROP POLICY IF EXISTS "Users can insert participant records" ON conversation_participants;
CREATE POLICY "Users can insert participant records" ON conversation_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own participant data
DROP POLICY IF EXISTS "Users can update their participant data" ON conversation_participants;
CREATE POLICY "Users can update their participant data" ON conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid());

-- Function to update conversation's last_message and last_message_at
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
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation ON messages;
CREATE TRIGGER trigger_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to increment unread count for recipient
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
$$ LANGUAGE plpgsql;

-- Trigger to update unread count on new message
DROP TRIGGER IF EXISTS trigger_update_unread_count ON messages;
CREATE TRIGGER trigger_update_unread_count
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count();

-- Function to reset unread count when messages are read
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
$$ LANGUAGE plpgsql;

-- Trigger to reset unread count when message is marked as read
DROP TRIGGER IF EXISTS trigger_reset_unread_count ON messages;
CREATE TRIGGER trigger_reset_unread_count
  AFTER UPDATE OF is_read ON messages
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_count();

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Stores conversation metadata between customers and businesses';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE conversation_participants IS 'Tracks participant-specific conversation data like unread counts';
COMMENT ON COLUMN conversations.customer_id IS 'The customer user participating in the conversation';
COMMENT ON COLUMN conversations.business_id IS 'The business being contacted';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the recipient';
COMMENT ON COLUMN conversation_participants.unread_count IS 'Number of unread messages for this participant';
