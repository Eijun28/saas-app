-- ============================================================================
-- STEP 3/4 : Ajouter les contraintes UNIQUE manquantes
-- Priorite: IMPORTANTE
-- Impact: Empecher les doublons dans les tables de liaison
-- ============================================================================

-- -------------------------------------------------------
-- 3.1 provider_cultures : UNIQUE(profile_id, culture_id)
-- Empecher un provider d'avoir la meme culture deux fois
-- -------------------------------------------------------
DO $$
BEGIN
  -- D'abord, supprimer les doublons existants (garder le plus ancien)
  DELETE FROM public.provider_cultures a
    USING public.provider_cultures b
    WHERE a.id > b.id
      AND a.profile_id = b.profile_id
      AND a.culture_id = b.culture_id;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'provider_cultures_profile_culture_unique'
  ) THEN
    ALTER TABLE public.provider_cultures
      ADD CONSTRAINT provider_cultures_profile_culture_unique
      UNIQUE (profile_id, culture_id);
    RAISE NOTICE 'UNIQUE(profile_id, culture_id) added to provider_cultures';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on provider_cultures, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 3.2 provider_zones : UNIQUE(profile_id, zone_id)
-- Empecher un provider d'avoir la meme zone deux fois
-- -------------------------------------------------------
DO $$
BEGIN
  DELETE FROM public.provider_zones a
    USING public.provider_zones b
    WHERE a.id > b.id
      AND a.profile_id = b.profile_id
      AND a.zone_id = b.zone_id;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'provider_zones_profile_zone_unique'
  ) THEN
    ALTER TABLE public.provider_zones
      ADD CONSTRAINT provider_zones_profile_zone_unique
      UNIQUE (profile_id, zone_id);
    RAISE NOTICE 'UNIQUE(profile_id, zone_id) added to provider_zones';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on provider_zones, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 3.3 provider_tags : UNIQUE(profile_id, tag_id)
-- Empecher un provider d'avoir le meme tag deux fois
-- -------------------------------------------------------
DO $$
BEGIN
  DELETE FROM public.provider_tags a
    USING public.provider_tags b
    WHERE a.id > b.id
      AND a.profile_id = b.profile_id
      AND a.tag_id = b.tag_id;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'provider_tags_profile_tag_unique'
  ) THEN
    ALTER TABLE public.provider_tags
      ADD CONSTRAINT provider_tags_profile_tag_unique
      UNIQUE (profile_id, tag_id);
    RAISE NOTICE 'UNIQUE(profile_id, tag_id) added to provider_tags';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on provider_tags, skipping';
  END IF;
END $$;

-- -------------------------------------------------------
-- 3.4 favoris : UNIQUE(couple_id, prestataire_id)
-- La migration 036 devrait l'avoir cree, on verifie.
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'favoris_couple_prestataire_unique'
      OR conname = 'idx_favoris_unique_pair'
      OR conname = 'favoris_couple_id_prestataire_id_key'
  ) THEN
    -- Supprimer les doublons existants d'abord
    DELETE FROM public.favoris a
      USING public.favoris b
      WHERE a.id > b.id
        AND a.couple_id = b.couple_id
        AND a.prestataire_id = b.prestataire_id;

    ALTER TABLE public.favoris
      ADD CONSTRAINT favoris_couple_prestataire_unique
      UNIQUE (couple_id, prestataire_id);
    RAISE NOTICE 'UNIQUE(couple_id, prestataire_id) added to favoris';
  ELSE
    RAISE NOTICE 'UNIQUE constraint already exists on favoris, skipping';
  END IF;
END $$;
