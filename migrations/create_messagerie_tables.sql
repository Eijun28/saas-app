-- ============================================================================
-- TABLES MESSAGERIE - Pour la communication couple/prestataire
-- ============================================================================
-- Ce script crée les tables nécessaires pour la messagerie entre couples et prestataires

-- ============================================================================
-- TABLE: conversations
-- ============================================================================
-- Stocke les conversations entre un couple et un prestataire

CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte: un couple ne peut avoir qu'une conversation avec un prestataire
  UNIQUE(couple_id, prestataire_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conversations_couple_id ON conversations(couple_id);
CREATE INDEX IF NOT EXISTS idx_conversations_prestataire_id ON conversations(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- ============================================================================
-- TABLE: messages
-- ============================================================================
-- Stocke les messages individuels dans une conversation

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Vérifier que le sender est soit le couple soit le prestataire de la conversation
  CONSTRAINT check_sender_in_conversation CHECK (
    sender_id IN (
      SELECT couple_id FROM conversations WHERE id = conversation_id
      UNION
      SELECT prestataire_id FROM conversations WHERE id = conversation_id
    )
  )
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Trigger pour mettre à jour last_message et last_message_at dans conversations
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    unread_count = CASE 
      WHEN NEW.sender_id = conversations.couple_id THEN unread_count
      ELSE unread_count + 1
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Les couples peuvent voir leurs conversations
CREATE POLICY "Couples peuvent voir leurs conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (couple_id = auth.uid());

-- Policy: Les prestataires peuvent voir leurs conversations
CREATE POLICY "Prestataires peuvent voir leurs conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (prestataire_id = auth.uid());

-- Policy: Les couples peuvent créer des conversations
CREATE POLICY "Couples peuvent créer des conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (couple_id = auth.uid());

-- Activer RLS sur messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir les messages de leurs conversations
CREATE POLICY "Utilisateurs peuvent voir leurs messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE couple_id = auth.uid() OR prestataire_id = auth.uid()
    )
  );

-- Policy: Les utilisateurs peuvent envoyer des messages dans leurs conversations
CREATE POLICY "Utilisateurs peuvent envoyer des messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE couple_id = auth.uid() OR prestataire_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE conversations IS 'Conversations entre couples et prestataires';
COMMENT ON TABLE messages IS 'Messages individuels dans les conversations';

COMMENT ON COLUMN conversations.couple_id IS 'ID du couple (user_id)';
COMMENT ON COLUMN conversations.prestataire_id IS 'ID du prestataire (user_id)';
COMMENT ON COLUMN conversations.unread_count IS 'Nombre de messages non lus par le couple';

