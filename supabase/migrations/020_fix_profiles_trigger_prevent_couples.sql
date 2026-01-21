-- ============================================
-- Migration: Correction du trigger profiles et prévention des couples
-- ============================================
-- Description: 
-- 1. Modifie le trigger pour ne créer des profils QUE pour les prestataires
-- 2. Ajoute une contrainte CHECK pour empêcher role='couple' dans profiles
-- 3. Supprime les couples existants dans profiles
-- ============================================

-- ÉTAPE 1: Supprimer les couples existants dans profiles
-- ============================================
DELETE FROM profiles
WHERE id IN (
    SELECT p.id
    FROM profiles p
    INNER JOIN couples c ON p.id = c.user_id
);

-- ÉTAPE 2: Ajouter une contrainte CHECK pour empêcher role='couple'
-- ============================================
-- Supprimer la contrainte existante si elle existe
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajouter une nouvelle contrainte qui n'autorise QUE 'prestataire' ou NULL
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IS NULL OR role = 'prestataire');

-- Commentaire pour documentation
COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 
'La table profiles est réservée aux prestataires uniquement. Les couples doivent être dans la table couples.';

-- ÉTAPE 3: Modifier la fonction handle_new_user pour ne créer des profils QUE pour les prestataires
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne créer un profil dans profiles QUE si le rôle est 'prestataire'
  -- Les couples seront créés directement dans la table couples par le code d'application
  IF COALESCE(NEW.raw_user_meta_data->>'role', NULL) = 'prestataire' THEN
    INSERT INTO public.profiles (id, role, onboarding_completed)
    VALUES (
      NEW.id,
      'prestataire',
      FALSE
    )
    ON CONFLICT (id) DO NOTHING; -- Éviter les erreurs si le profil existe déjà
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Crée automatiquement un profil dans profiles UNIQUEMENT pour les prestataires. Les couples sont gérés séparément dans la table couples.';

-- ÉTAPE 4: Vérification finale
-- ============================================
-- Vérifier qu'il ne reste plus de couples dans profiles
DO $$
DECLARE
  couples_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO couples_count
  FROM profiles p
  INNER JOIN couples c ON p.id = c.user_id;
  
  IF couples_count > 0 THEN
    RAISE WARNING 'Il reste % couple(s) dans profiles. Vérifiez manuellement.', couples_count;
  ELSE
    RAISE NOTICE '✅ Aucun couple trouvé dans profiles. Migration réussie.';
  END IF;
END $$;
