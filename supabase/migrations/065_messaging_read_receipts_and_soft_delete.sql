-- ============================================
-- 065: Read receipts (UPDATE policy) + soft-delete conversations
-- ============================================

-- 1. Politique UPDATE sur messages : permettre de marquer comme lu (read_at)
-- Les participants d'une conversation peuvent mettre à jour read_at sur les messages reçus
CREATE POLICY messages_update_read_at
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.couple_id, c.provider_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND auth.uid() IN (c.couple_id, c.provider_id)
  )
);

-- 2. Politique DELETE sur messages : permettre de supprimer ses propres messages
CREATE POLICY messages_delete_own
ON public.messages FOR DELETE
USING (
  sender_id = auth.uid()
);

-- 3. Ajouter la colonne status sur conversations pour le soft-delete
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Index pour filtrer rapidement les conversations actives
CREATE INDEX IF NOT EXISTS idx_conversations_status
ON public.conversations (status);

-- 4. Politique UPDATE sur conversations : permettre aux participants de modifier le status
CREATE POLICY conversations_update_status
ON public.conversations FOR UPDATE
USING (
  auth.uid() IN (couple_id, provider_id)
)
WITH CHECK (
  auth.uid() IN (couple_id, provider_id)
);
