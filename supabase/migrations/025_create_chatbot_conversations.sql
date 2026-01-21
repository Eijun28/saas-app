-- Migration: Création de la table chatbot_conversations
-- Date: 2025-01

-- ============================================
-- TABLE: chatbot_conversations
-- ============================================
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_criteria JSONB,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour chatbot_conversations
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_couple_id ON public.chatbot_conversations(couple_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON public.chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at ON public.chatbot_conversations(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_chatbot_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chatbot_conversations_updated_at_trigger
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_conversations_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur chatbot_conversations
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Les couples peuvent voir leurs propres conversations
CREATE POLICY "Couples can view own chatbot conversations"
  ON public.chatbot_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = chatbot_conversations.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Policy: Les couples peuvent créer leurs propres conversations
CREATE POLICY "Couples can insert own chatbot conversations"
  ON public.chatbot_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = chatbot_conversations.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Policy: Les couples peuvent mettre à jour leurs propres conversations
CREATE POLICY "Couples can update own chatbot conversations"
  ON public.chatbot_conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = chatbot_conversations.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- Policy: Les couples peuvent supprimer leurs propres conversations
CREATE POLICY "Couples can delete own chatbot conversations"
  ON public.chatbot_conversations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = chatbot_conversations.couple_id
      AND couples.user_id = auth.uid()
    )
  );
