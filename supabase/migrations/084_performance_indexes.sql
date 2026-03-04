-- Migration 084 : Index de performance critiques
--
-- Ces index couvrent les requêtes chaudes identifiées dans l'analyse de scalabilité :
--   - getConversationsServer/Client : lookup conversations par request_id
--   - Comptage messages non-lus : filtre sur (conversation_id, sender_id, is_read)
--   - Matching : jointures provider_cultures/provider_zones sur profile_id
--   - Dashboard prestataire : filtrage demandes par prestataire + tri par date

-- Conversations → requests (utilisé dans le JOIN de la messagerie)
CREATE INDEX IF NOT EXISTS idx_conversations_request_id
  ON conversations (request_id);

-- Messages : index composite pour les requêtes de messagerie
-- Note: pas d'index partiel car la colonne read_at n'existe pas encore en production
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages (conversation_id, sender_id);

-- Messages triés par date dans une conversation (pagination historique)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

-- Matching : jointure provider_cultures sur profile_id
CREATE INDEX IF NOT EXISTS idx_provider_cultures_profile_id
  ON provider_cultures (profile_id);

-- Matching : jointure provider_zones sur profile_id
CREATE INDEX IF NOT EXISTS idx_provider_zones_profile_id
  ON provider_zones (profile_id);

-- Requests : filtrage par prestataire + tri chronologique (dashboard prestataire)
CREATE INDEX IF NOT EXISTS idx_requests_provider_created
  ON requests (provider_id, created_at DESC);

-- Requests : filtrage par couple (dashboard couple)
CREATE INDEX IF NOT EXISTS idx_requests_couple_id
  ON requests (couple_id);
