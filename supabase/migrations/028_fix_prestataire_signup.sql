-- ============================================
-- Migration: Correction de l'inscription prestataire
-- Date: 2025-01
-- Description: Corrige les problèmes d'inscription des prestataires
-- ============================================

-- ============================================
-- ÉTAPE 1: S'assurer que toutes les colonnes nécessaires existent
-- ============================================

-- Ajouter la colonne email si elle n'existe pas (avec gestion de la contrainte UNIQUE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    -- Créer un index unique partiel pour email (seulement pour les emails non NULL)
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
    ON profiles(email) WHERE email IS NOT NULL;
    RAISE NOTICE 'Colonne email ajoutée à profiles';
  END IF;
END $$;

-- S'assurer que nom_entreprise existe (devrait déjà exister d'après migration 010)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'nom_entreprise'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nom_entreprise TEXT;
    RAISE NOTICE 'Colonne nom_entreprise ajoutée à profiles';
  END IF;
END $$;

-- S'assurer que subscription_tier existe avec une valeur par défaut
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    RAISE NOTICE 'Colonne subscription_tier ajoutée à profiles';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 2: Corriger la contrainte UNIQUE sur email
-- ============================================
-- Supprimer la contrainte UNIQUE globale si elle existe (car elle empêche plusieurs NULL)
-- et créer un index unique partiel à la place

DO $$
BEGIN
  -- Supprimer la contrainte UNIQUE globale si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%email%'
  ) THEN
    -- Trouver le nom de la contrainte
    DECLARE
      constraint_name TEXT;
    BEGIN
      SELECT tc.constraint_name INTO constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'profiles'
        AND tc.constraint_type = 'UNIQUE'
        AND ccu.column_name = 'email';
      
      IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Contrainte UNIQUE sur email supprimée: %', constraint_name;
      END IF;
    END;
  END IF;
  
  -- Créer un index unique partiel (permet plusieurs NULL mais pas de doublons)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' 
    AND indexname = 'idx_profiles_email_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_profiles_email_unique 
    ON profiles(email) WHERE email IS NOT NULL;
    RAISE NOTICE 'Index unique partiel créé sur email';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3: Améliorer le trigger pour inclure l'email si disponible
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne créer un profil dans profiles QUE si le rôle est 'prestataire'
  -- Les couples seront créés directement dans la table couples par le code d'application
  IF COALESCE(NEW.raw_user_meta_data->>'role', NULL) = 'prestataire' THEN
    INSERT INTO public.profiles (
      id, 
      role, 
      onboarding_completed,
      email,
      prenom,
      nom,
      nom_entreprise
    )
    VALUES (
      NEW.id,
      'prestataire',
      FALSE,
      COALESCE(NEW.email, NULL), -- Utiliser l'email de auth.users si disponible
      COALESCE(NEW.raw_user_meta_data->>'prenom', NULL),
      COALESCE(NEW.raw_user_meta_data->>'nom', NULL),
      COALESCE(NEW.raw_user_meta_data->>'nom_entreprise', NULL)
    )
    ON CONFLICT (id) DO UPDATE SET
      -- Mettre à jour les champs si le profil existe déjà (cas où le trigger s'exécute après l'upsert)
      role = EXCLUDED.role,
      email = COALESCE(EXCLUDED.email, profiles.email), -- Garder l'ancien email si le nouveau est NULL
      prenom = COALESCE(EXCLUDED.prenom, profiles.prenom),
      nom = COALESCE(EXCLUDED.nom, profiles.nom),
      nom_entreprise = COALESCE(EXCLUDED.nom_entreprise, profiles.nom_entreprise);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Crée automatiquement un profil dans profiles UNIQUEMENT pour les prestataires. Les couples sont gérés séparément dans la table couples. Inclut maintenant l''email et les métadonnées si disponibles.';

-- ============================================
-- ÉTAPE 4: Vérifier que la contrainte CHECK sur role est correcte
-- ============================================

-- S'assurer que la contrainte CHECK empêche role='couple' dans profiles
DO $$
BEGIN
  -- Vérifier si la contrainte existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_name = 'profiles_role_check'
  ) THEN
    -- Ajouter la contrainte si elle n'existe pas
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IS NULL OR role = 'prestataire');
    RAISE NOTICE 'Contrainte profiles_role_check ajoutée';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 5: Nettoyer les profils existants avec email NULL ou invalide
-- ============================================

-- Mettre à jour les profils prestataires existants qui n'ont pas d'email
-- en utilisant l'email de auth.users
UPDATE profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
  AND p.role = 'prestataire'
  AND (p.email IS NULL OR p.email = '')
  AND au.email IS NOT NULL;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

DO $$
DECLARE
  missing_email_count INTEGER;
  invalid_role_count INTEGER;
BEGIN
  -- Vérifier les prestataires sans email
  SELECT COUNT(*) INTO missing_email_count
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.role = 'prestataire'
    AND (p.email IS NULL OR p.email = '')
    AND au.email IS NOT NULL;
  
  IF missing_email_count > 0 THEN
    RAISE WARNING 'Il reste % prestataire(s) sans email dans profiles.', missing_email_count;
  ELSE
    RAISE NOTICE '✅ Tous les prestataires ont un email valide.';
  END IF;
  
  -- Vérifier qu'il n'y a pas de couples dans profiles
  SELECT COUNT(*) INTO invalid_role_count
  FROM profiles p
  INNER JOIN couples c ON p.id = c.user_id;
  
  IF invalid_role_count > 0 THEN
    RAISE WARNING 'Il reste % couple(s) dans profiles. Vérifiez manuellement.', invalid_role_count;
  ELSE
    RAISE NOTICE '✅ Aucun couple trouvé dans profiles.';
  END IF;
END $$;
