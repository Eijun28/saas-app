-- Migration: Permettre aux couples de voir les profils des prestataires
-- Date: 2025-01-13
-- Description: Ajoute une politique RLS pour que les couples puissent lire les profils des prestataires
--               Cela est nécessaire pour que la recherche de prestataires fonctionne côté couple

-- ============================================
-- TABLE: profiles
-- ============================================

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Permettre à tous les utilisateurs authentifiés de voir les prestataires
-- Cette politique permet à tous les utilisateurs authentifiés (couples et autres) de lire les profils avec role='prestataire'
-- C'est la politique principale et la plus simple à maintenir
DROP POLICY IF EXISTS "Authenticated users can view prestataire profiles" ON profiles;
CREATE POLICY "Authenticated users can view prestataire profiles"
  ON profiles
  FOR SELECT
  USING (
    -- L'utilisateur doit être authentifié
    auth.uid() IS NOT NULL
    -- ET le profil à lire doit être un prestataire
    AND role = 'prestataire'
  );

-- Policy optionnelle: Les couples peuvent voir les profils des prestataires
-- Cette politique est plus restrictive et vérifie spécifiquement dans la table couples
-- Elle est redondante avec la politique ci-dessus mais peut être utile pour un contrôle plus fin
DROP POLICY IF EXISTS "Couples can view prestataire profiles" ON profiles;
CREATE POLICY "Couples can view prestataire profiles"
  ON profiles
  FOR SELECT
  USING (
    -- L'utilisateur connecté doit être un couple (vérifier dans la table couples)
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.user_id = auth.uid()
    )
    -- ET le profil à lire doit être un prestataire
    AND role = 'prestataire'
  );

-- ============================================
-- TABLES LIÉES: provider_cultures, provider_zones, provider_portfolio
-- ============================================

-- Activer RLS sur les tables liées si elles existent
DO $$
BEGIN
  -- provider_cultures
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_cultures') THEN
    ALTER TABLE provider_cultures ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Couples can view prestataire cultures" ON provider_cultures;
    CREATE POLICY "Couples can view prestataire cultures"
      ON provider_cultures
      FOR SELECT
      USING (
        -- L'utilisateur doit être authentifié
        auth.uid() IS NOT NULL
        -- ET le profil associé doit être un prestataire
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = provider_cultures.profile_id
          AND profiles.role = 'prestataire'
        )
      );
  END IF;

  -- provider_zones
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_zones') THEN
    ALTER TABLE provider_zones ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Couples can view prestataire zones" ON provider_zones;
    CREATE POLICY "Couples can view prestataire zones"
      ON provider_zones
      FOR SELECT
      USING (
        -- L'utilisateur doit être authentifié
        auth.uid() IS NOT NULL
        -- ET le profil associé doit être un prestataire
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = provider_zones.profile_id
          AND profiles.role = 'prestataire'
        )
      );
  END IF;

  -- provider_portfolio
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_portfolio') THEN
    ALTER TABLE provider_portfolio ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Couples can view prestataire portfolio" ON provider_portfolio;
    CREATE POLICY "Couples can view prestataire portfolio"
      ON provider_portfolio
      FOR SELECT
      USING (
        -- L'utilisateur doit être authentifié
        auth.uid() IS NOT NULL
        -- ET le profil associé doit être un prestataire
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = provider_portfolio.profile_id
          AND profiles.role = 'prestataire'
        )
      );
  END IF;
END $$;

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Pour vérifier que les policies sont bien créées :
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'provider_cultures', 'provider_zones', 'provider_portfolio') AND policyname LIKE '%prestataire%';
