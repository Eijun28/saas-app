-- ============================================================================
-- TABLE CONVERSATIONS - Pour le chatbot NUPLY
-- ============================================================================
-- Ce script crée la table pour stocker les conversations du chatbot
-- dans Supabase avec les bonnes permissions RLS

-- Créer la table conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- Activer RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leurs propres messages
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    -- Permettre aussi l'accès par session_id (pour les sessions anonymes)
    session_id IN (
      SELECT session_id 
      FROM conversations 
      WHERE user_id = auth.uid()
    )
  );

-- Politique RLS : Les utilisateurs peuvent insérer leurs propres messages
CREATE POLICY "Users can insert their own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    user_id IS NULL -- Permettre les sessions anonymes
  );

-- Politique RLS : Les utilisateurs peuvent supprimer leurs propres messages
CREATE POLICY "Users can delete their own conversations"
  ON conversations
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    session_id IN (
      SELECT session_id 
      FROM conversations 
      WHERE user_id = auth.uid()
    )
  );

-- Commentaire sur la table
COMMENT ON TABLE conversations IS 'Stocke les messages du chatbot NUPLY avec support localStorage + Supabase sync';

