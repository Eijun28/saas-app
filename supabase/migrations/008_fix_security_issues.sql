-- ============================================
-- MIGRATION: Correction des problèmes de sécurité Supabase
-- Date: 2026-01-06
-- Description: Correction des erreurs de sécurité détectées par le linter
-- ============================================

-- ============================================
-- PARTIE 1: CORRECTION DES VUES SECURITY DEFINER
-- ============================================

-- Supprimer et recréer les vues sans SECURITY DEFINER

-- Vue: devis_with_details
DROP VIEW IF EXISTS public.devis_with_details CASCADE;
CREATE OR REPLACE VIEW public.devis_with_details AS
SELECT
  d.*,
  pp.nom_entreprise as provider_name,
  pp.type_prestation as provider_type,
  cp.partner_1_name,
  cp.partner_2_name
FROM public.devis d
LEFT JOIN public.prestataire_profiles pp ON d.provider_id = pp.user_id
LEFT JOIN public.couples cp ON d.couple_id = cp.id;

-- Vue: demandes_with_provider
DROP VIEW IF EXISTS public.demandes_with_provider CASCADE;
CREATE OR REPLACE VIEW public.demandes_with_provider AS
SELECT
  d.*,
  pp.nom_entreprise as provider_name,
  pp.type_prestation as provider_type,
  pp.tarif_min as provider_tarif_min,
  pp.tarif_max as provider_tarif_max,
  ppp.rating as provider_rating,
  ppp.is_verified as provider_is_verified
FROM public.demandes d
LEFT JOIN public.prestataire_profiles pp ON d.prestataire_id = pp.user_id
LEFT JOIN public.prestataire_public_profiles ppp ON d.prestataire_id = ppp.prestataire_id;

-- Vue: favoris_with_provider
DROP VIEW IF EXISTS public.favoris_with_provider CASCADE;
CREATE OR REPLACE VIEW public.favoris_with_provider AS
SELECT
  f.*,
  pp.nom_entreprise as provider_name,
  pp.type_prestation as provider_type,
  pp.ville_exercice as provider_ville,
  pp.tarif_min as provider_tarif_min,
  pp.tarif_max as provider_tarif_max,
  pp.cultures_gerees as provider_cultures,
  ppp.description as provider_description,
  ppp.rating as provider_rating,
  ppp.total_reviews as provider_total_reviews,
  ppp.is_verified as provider_is_verified
FROM public.favoris f
LEFT JOIN public.prestataire_profiles pp ON f.prestataire_id = pp.user_id
LEFT JOIN public.prestataire_public_profiles ppp ON f.prestataire_id = ppp.prestataire_id;

-- ============================================
-- PARTIE 2: ACTIVATION RLS SUR LES TABLES MANQUANTES
-- ============================================

-- Table: cultures (si elle existe)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cultures') THEN
    ALTER TABLE public.cultures ENABLE ROW LEVEL SECURITY;

    -- Policy: lecture publique (ajustez selon vos besoins)
    DROP POLICY IF EXISTS "Public read access" ON public.cultures;
    CREATE POLICY "Public read access" ON public.cultures
      FOR SELECT
      USING (true);

    -- Policy: seul admin peut modifier (ajustez selon vos besoins)
    DROP POLICY IF EXISTS "Admin write access" ON public.cultures;
    CREATE POLICY "Admin write access" ON public.cultures
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- Table: couples_archive_2026_01_05 (table archive)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'couples_archive_2026_01_05') THEN
    ALTER TABLE public.couples_archive_2026_01_05 ENABLE ROW LEVEL SECURITY;

    -- Policy: seul admin peut lire les archives
    DROP POLICY IF EXISTS "Admin only access" ON public.couples_archive_2026_01_05;
    CREATE POLICY "Admin only access" ON public.couples_archive_2026_01_05
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- Table: couple_preferences (re-vérifier que RLS est activé)
ALTER TABLE public.couple_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTIE 3: FIXER LE SEARCH_PATH DES FONCTIONS
-- ============================================

-- Fonction: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: handle_updated_at (alias)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_couples_updated_at
CREATE OR REPLACE FUNCTION public.update_couples_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_couple_preferences_updated_at
CREATE OR REPLACE FUNCTION public.update_couple_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_budget_items_updated_at
CREATE OR REPLACE FUNCTION public.update_budget_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_messages_messagerie_updated_at
CREATE OR REPLACE FUNCTION public.update_messages_messagerie_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_conversations_messagerie_updated_at
CREATE OR REPLACE FUNCTION public.update_conversations_messagerie_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_conversations_updated_at
CREATE OR REPLACE FUNCTION public.update_conversations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: update_conversations_timestamp
CREATE OR REPLACE FUNCTION public.update_conversations_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fonction: get_unread_conversations_messagerie_count
CREATE OR REPLACE FUNCTION public.get_unread_conversations_messagerie_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT cm.conversation_id)
  INTO unread_count
  FROM conversations_messagerie cm
  WHERE (cm.couple_id = user_uuid OR cm.prestataire_id = user_uuid)
    AND EXISTS (
      SELECT 1
      FROM messages_messagerie mm
      WHERE mm.conversation_id = cm.id
        AND mm.sender_id != user_uuid
        AND mm.is_read = FALSE
    );
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Fonction: get_unread_conversations_count
CREATE OR REPLACE FUNCTION public.get_unread_conversations_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT c.id)
  INTO unread_count
  FROM conversations c
  WHERE (c.couple_id = user_uuid OR c.prestataire_id = user_uuid)
    AND EXISTS (
      SELECT 1
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != user_uuid
        AND m.is_read = FALSE
    );
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Fonction: update_conversation_unread
CREATE OR REPLACE FUNCTION public.update_conversation_unread()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET has_unread = TRUE
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Fonction: get_conversation_history
CREATE OR REPLACE FUNCTION public.get_conversation_history(p_conversation_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.conversation_id, m.sender_id, m.content, m.is_read, m.created_at
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
  ORDER BY m.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Fonction: update_conversation_messagerie_on_message
CREATE OR REPLACE FUNCTION public.update_conversation_messagerie_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations_messagerie
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Fonction: update_conversation_last_message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Fonction: archive_conversation
CREATE OR REPLACE FUNCTION public.archive_conversation(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET archived = TRUE
  WHERE id = p_conversation_id
    AND (couple_id = p_user_id OR prestataire_id = p_user_id);
  RETURN FOUND;
END;
$$;

-- Fonction: archive_conversation_messagerie
CREATE OR REPLACE FUNCTION public.archive_conversation_messagerie(p_conversation_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations_messagerie
  SET archived = TRUE
  WHERE id = p_conversation_id
    AND (couple_id = p_user_id OR prestataire_id = p_user_id);
  RETURN FOUND;
END;
$$;

-- Fonction: mark_messages_messagerie_as_read
CREATE OR REPLACE FUNCTION public.mark_messages_messagerie_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE messages_messagerie
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;
END;
$$;

-- Fonction: mark_messages_as_read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;
END;
$$;

-- Fonction: update_provider_rating
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE prestataire_public_profiles
  SET
    rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM reviews
      WHERE prestataire_id = NEW.prestataire_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE prestataire_id = NEW.prestataire_id
    )
  WHERE prestataire_id = NEW.prestataire_id;
  RETURN NEW;
END;
$$;

-- Fonction: cleanup_old_conversations
CREATE OR REPLACE FUNCTION public.cleanup_old_conversations()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM conversations
  WHERE archived = TRUE
    AND updated_at < NOW() - INTERVAL '1 year';
END;
$$;

-- Fonction: handle_new_user_referral
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Logique de gestion des parrainages
  -- À adapter selon vos besoins
  RETURN NEW;
END;
$$;

-- Fonction: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Fonction: handle_new_couple
CREATE OR REPLACE FUNCTION public.handle_new_couple()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Créer automatiquement couple_preferences
  INSERT INTO public.couple_preferences (couple_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Fonction: update_profile_completion
CREATE OR REPLACE FUNCTION public.update_profile_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Logique de calcul de complétion du profil
  -- À adapter selon vos besoins
  RETURN NEW;
END;
$$;

-- Fonction: calculate_couple_profile_completion
CREATE OR REPLACE FUNCTION public.calculate_couple_profile_completion(p_couple_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  completion_score INTEGER := 0;
BEGIN
  -- Calculer le pourcentage de complétion
  -- À adapter selon vos champs
  SELECT
    CASE
      WHEN wedding_date IS NOT NULL THEN 20 ELSE 0
    END +
    CASE
      WHEN wedding_location IS NOT NULL THEN 20 ELSE 0
    END +
    CASE
      WHEN guest_count IS NOT NULL THEN 20 ELSE 0
    END +
    CASE
      WHEN budget_min IS NOT NULL AND budget_max IS NOT NULL THEN 20 ELSE 0
    END +
    CASE
      WHEN partner_1_name IS NOT NULL AND partner_2_name IS NOT NULL THEN 20 ELSE 0
    END
  INTO completion_score
  FROM public.couples
  WHERE id = p_couple_id;

  RETURN COALESCE(completion_score, 0);
END;
$$;

-- Fonction: calculate_completion_scores
CREATE OR REPLACE FUNCTION public.calculate_completion_scores()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.couple_preferences cp
  SET completion_percentage = public.calculate_couple_profile_completion(cp.couple_id);
END;
$$;

-- Fonction: get_or_create_conversation_messagerie
CREATE OR REPLACE FUNCTION public.get_or_create_conversation_messagerie(
  p_couple_id UUID,
  p_prestataire_id UUID,
  p_demande_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Chercher conversation existante
  SELECT id INTO v_conversation_id
  FROM conversations_messagerie
  WHERE couple_id = p_couple_id
    AND prestataire_id = p_prestataire_id;

  -- Créer si inexistante
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations_messagerie (couple_id, prestataire_id, demande_id)
    VALUES (p_couple_id, p_prestataire_id, p_demande_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- Fonction: get_or_create_conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_couple_id UUID,
  p_prestataire_id UUID,
  p_demande_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Chercher conversation existante
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE couple_id = p_couple_id
    AND prestataire_id = p_prestataire_id;

  -- Créer si inexistante
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (couple_id, prestataire_id, demande_id)
    VALUES (p_couple_id, p_prestataire_id, p_demande_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ============================================
-- PARTIE 4: DÉPLACER L'EXTENSION VECTOR
-- ============================================

-- Créer le schéma extensions s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- Déplacer l'extension vector vers le schéma extensions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;

-- Mettre à jour le search_path par défaut pour inclure extensions
ALTER DATABASE postgres SET search_path TO public, extensions;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

COMMENT ON MIGRATION '008_fix_security_issues' IS 'Correction des problèmes de sécurité: vues SECURITY DEFINER, RLS manquant, search_path des fonctions, déplacement extension vector';
