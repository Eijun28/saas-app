-- ============================================================================
-- STEP 4/4 : Ameliorations de schema et corrections mineures
-- Priorite: MODEREE
-- Impact: Nettoyage, coherence, meilleure tracabilite
-- ============================================================================

-- -------------------------------------------------------
-- 4.1 Ajouter created_at a la table couples
-- Toutes les autres tables ont created_at, couples non.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'couples'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.couples
      ADD COLUMN created_at timestamptz DEFAULT now();

    -- Remplir les lignes existantes avec updated_at si disponible,
    -- sinon now()
    UPDATE public.couples
      SET created_at = COALESCE(updated_at, now())
      WHERE created_at IS NULL;

    -- Rendre NOT NULL apres remplissage
    ALTER TABLE public.couples
      ALTER COLUMN created_at SET NOT NULL;

    RAISE NOTICE 'created_at added to couples table';
  ELSE
    RAISE NOTICE 'created_at already exists on couples, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 4.2 Uniformiser uuid generation : uuid_generate_v4() -> gen_random_uuid()
-- chatbot_conversations et matching_history utilisent uuid_generate_v4()
-- On change les defaults pour gen_random_uuid() (natif PG, pas d'extension)
-- Note: ne touche pas aux donnees existantes
-- -------------------------------------------------------
ALTER TABLE public.chatbot_conversations
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.matching_history
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- -------------------------------------------------------
-- 4.3 Ajouter un index sur messages.conversation_id
-- Pour accelerer les requetes de chat (SELECT ... WHERE conversation_id = ?)
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON public.messages (conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
  ON public.messages (created_at);

-- -------------------------------------------------------
-- 4.4 Ajouter un index sur billing_consent_requests pour les lookups frequents
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_billing_consent_conversation_id
  ON public.billing_consent_requests (conversation_id);

CREATE INDEX IF NOT EXISTS idx_billing_consent_status
  ON public.billing_consent_requests (status)
  WHERE status = 'pending';

-- -------------------------------------------------------
-- 4.5 Ajouter un trigger updated_at sur les tables qui en manquent
-- -------------------------------------------------------

-- Fonction utilitaire (create or replace pour etre idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- couples
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_couples_updated_at'
  ) THEN
    CREATE TRIGGER set_couples_updated_at
      BEFORE UPDATE ON public.couples
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Trigger set_couples_updated_at created';
  END IF;
END $$;

-- billing_consent_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_billing_consent_requests_updated_at'
  ) THEN
    CREATE TRIGGER set_billing_consent_requests_updated_at
      BEFORE UPDATE ON public.billing_consent_requests
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
    RAISE NOTICE 'Trigger set_billing_consent_requests_updated_at created';
  END IF;
END $$;

-- -------------------------------------------------------
-- 4.6 DOCUMENTATION : Inconsistance couple_id connue
--
-- ATTENTION: requests.couple_id et reviews.couple_id contiennent
-- un auth.users.id (via couples.user_id / profiles.id),
-- tandis que toutes les autres tables (devis, factures, favoris...)
-- contiennent un couples.id.
--
-- Cela signifie que les jointures directes entre ces tables sur
-- couple_id ne fonctionneront PAS sans passer par la table couples.
--
-- Pour corriger cela, il faudrait :
-- 1. Ajouter une colonne couple_uuid aux tables requests et reviews
-- 2. Migrer les donnees : UPDATE requests SET couple_uuid = c.id
--    FROM couples c WHERE requests.couple_id = c.user_id
-- 3. Remplacer les FK
-- 4. Mettre a jour tout le code applicatif
--
-- Cette migration est complexe et risquee, elle n'est PAS incluse ici.
-- Elle doit etre planifiee separement avec une phase de test.
-- -------------------------------------------------------

-- Ajout d'un commentaire sur la table pour documenter l'inconsistance
COMMENT ON COLUMN public.requests.couple_id IS
  'Contient auth.users.id (via couples.user_id), PAS couples.id. Jointure avec couples via couples.user_id.';

COMMENT ON COLUMN public.reviews.couple_id IS
  'Contient auth.users.id (= profiles.id), PAS couples.id. Jointure avec couples via couples.user_id.';

COMMENT ON COLUMN public.conversations.couple_id IS
  'Contient auth.users.id (via couples.user_id), PAS couples.id. Coherent avec requests.couple_id.';
