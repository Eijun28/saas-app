-- ============================================================================
-- STEP 1/4 : Ajouter les FK manquantes
-- Priorite: CRITIQUE
-- Impact: Garantir l'integrite referentielle sur les tables orphelines
-- ============================================================================

-- -------------------------------------------------------
-- 1.1 factures.prestataire_id -> profiles(id)
-- La colonne existe, un index existe, mais aucune FK n'est declaree.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'factures_prestataire_id_fkey'
      AND table_name = 'factures'
  ) THEN
    ALTER TABLE public.factures
      ADD CONSTRAINT factures_prestataire_id_fkey
      FOREIGN KEY (prestataire_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK factures_prestataire_id_fkey created';
  ELSE
    RAISE NOTICE 'FK factures_prestataire_id_fkey already exists, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 1.2 conversations.couple_id -> couples(user_id)
-- On utilise couples(user_id) car requests.couple_id utilise aussi
-- couples(user_id), et la conversation est creee a partir d'une request.
-- Donc conversations.couple_id contient un auth.users.id.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_couple_id_fkey'
      AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_couple_id_fkey
      FOREIGN KEY (couple_id) REFERENCES public.couples(user_id) ON DELETE CASCADE;
    RAISE NOTICE 'FK conversations_couple_id_fkey created';
  ELSE
    RAISE NOTICE 'FK conversations_couple_id_fkey already exists, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 1.3 conversations.provider_id -> profiles(id)
-- Le provider_id dans conversations est un auth.users.id = profiles.id
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'conversations_provider_id_fkey'
      AND table_name = 'conversations'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT conversations_provider_id_fkey
      FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK conversations_provider_id_fkey created';
  ELSE
    RAISE NOTICE 'FK conversations_provider_id_fkey already exists, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 1.4 devis.demande_id -> requests(id)
-- La migration 036 devrait l'avoir cree, mais le schema dump ne le montre pas.
-- On s'assure qu'elle existe.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'devis_demande_id_fkey'
      AND table_name = 'devis'
  ) THEN
    ALTER TABLE public.devis
      ADD CONSTRAINT devis_demande_id_fkey
      FOREIGN KEY (demande_id) REFERENCES public.requests(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK devis_demande_id_fkey created';
  ELSE
    RAISE NOTICE 'FK devis_demande_id_fkey already exists, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 1.5 devis.prestataire_id -> profiles(id)
-- Le schema montre fk_devis_prestataire, verifions qu'elle existe bien.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_devis_prestataire'
      AND table_name = 'devis'
  ) THEN
    ALTER TABLE public.devis
      ADD CONSTRAINT fk_devis_prestataire
      FOREIGN KEY (prestataire_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'FK fk_devis_prestataire created';
  ELSE
    RAISE NOTICE 'FK fk_devis_prestataire already exists, skipping';
  END IF;
END $$;
