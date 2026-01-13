-- Fix RLS policy for messages to ensure sender_id matches auth.uid()
-- Note: The actual database uses provider_id, not prestataire_id

-- Drop existing policy
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;

-- Recreate policy with explicit check that sender_id = auth.uid()
-- Use provider_id (the actual column name in the database)
CREATE POLICY "Users can send messages in own conversations" ON messages
  FOR INSERT
  WITH CHECK (
    messages.sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.couple_id = auth.uid() 
        OR conversations.provider_id = auth.uid()
      )
    )
  );

-- Also update the SELECT policy
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;

CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.couple_id = auth.uid() 
        OR conversations.provider_id = auth.uid()
      )
    )
  );
