-- RLS Policies pour sécurité
-- À exécuter dans Supabase SQL Editor

-- ============================================
-- COUPLES
-- ============================================
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own couple
CREATE POLICY "Users can view own couple" ON couples
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update own couple
CREATE POLICY "Users can update own couple" ON couples
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert own couple
CREATE POLICY "Users can insert own couple" ON couples
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COUPLE_PREFERENCES
-- ============================================
ALTER TABLE couple_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON couple_preferences
  FOR ALL
  USING (auth.uid() = couple_id);

-- ============================================
-- BUDGET_ITEMS
-- ============================================
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budget items" ON budget_items
  FOR ALL
  USING (auth.uid() = couple_id);

-- ============================================
-- TIMELINE_EVENTS
-- ============================================
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own timeline events" ON timeline_events
  FOR ALL
  USING (auth.uid() = couple_id);

-- ============================================
-- MARRIAGE_ADMINISTRATIVE_FILES
-- ============================================
ALTER TABLE marriage_administrative_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marriage files" ON marriage_administrative_files
  FOR SELECT
  USING (auth.uid() = couple_id);

CREATE POLICY "Users can update own marriage files" ON marriage_administrative_files
  FOR UPDATE
  USING (auth.uid() = couple_id);

CREATE POLICY "Users can insert own marriage files" ON marriage_administrative_files
  FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

-- ============================================
-- UPLOADED_DOCUMENTS
-- ============================================
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own uploaded documents" ON uploaded_documents
  FOR ALL
  USING (auth.uid() = couple_id);

-- ============================================
-- COLLABORATEURS
-- ============================================
ALTER TABLE collaborateurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collaborators" ON collaborateurs
  FOR ALL
  USING (auth.uid() = couple_id);

-- ============================================
-- DEMANDES
-- ============================================
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

-- Couples can view their own demandes
CREATE POLICY "Couples can view own demandes" ON demandes
  FOR SELECT
  USING (auth.uid() = couple_id);

-- Prestataires can view demandes sent to them
CREATE POLICY "Prestataires can view demandes" ON demandes
  FOR SELECT
  USING (auth.uid() = prestataire_id);

-- Couples can create demandes
CREATE POLICY "Couples can create demandes" ON demandes
  FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

-- Prestataires can update demandes sent to them
CREATE POLICY "Prestataires can update demandes" ON demandes
  FOR UPDATE
  USING (auth.uid() = prestataire_id);

-- ============================================
-- CONVERSATIONS
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT
  USING (auth.uid() = couple_id OR auth.uid() = prestataire_id);

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = couple_id OR auth.uid() = prestataire_id);

-- ============================================
-- MESSAGES
-- ============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.couple_id = auth.uid() OR conversations.prestataire_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations" ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.couple_id = auth.uid() OR conversations.prestataire_id = auth.uid())
    )
  );

-- ============================================
-- FAVORIS
-- ============================================
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favoris" ON favoris
  FOR ALL
  USING (auth.uid() = couple_id);

-- ============================================
-- DEVIS
-- ============================================
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;

-- Couples can view their own devis
CREATE POLICY "Couples can view own devis" ON devis
  FOR SELECT
  USING (auth.uid() = couple_id);

-- Prestataires can view devis they created
CREATE POLICY "Prestataires can view own devis" ON devis
  FOR SELECT
  USING (auth.uid() = prestataire_id OR auth.uid() = provider_id);

-- Couples can update devis sent to them
CREATE POLICY "Couples can update own devis" ON devis
  FOR UPDATE
  USING (auth.uid() = couple_id);

-- Prestataires can create devis
CREATE POLICY "Prestataires can create devis" ON devis
  FOR INSERT
  WITH CHECK (auth.uid() = prestataire_id OR auth.uid() = provider_id);

