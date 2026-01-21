-- ============================================
-- Migration: Correction du trigger handle_new_user
-- Date: 2025-01
-- Description: Corrige le trigger pour s'adapter automatiquement à la structure de la table profiles
-- ============================================

-- Recréer la fonction handle_new_user en vérifiant dynamiquement les colonnes disponibles
-- Utiliser un délimiteur différent ($function$) pour éviter les conflits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $function$
DECLARE
  has_onboarding_completed BOOLEAN;
  has_inscription_completee BOOLEAN;
BEGIN
  -- Ne créer un profil dans profiles QUE si le rôle est 'prestataire'
  -- Les couples seront créés directement dans la table couples par le code d'application
  IF COALESCE(NEW.raw_user_meta_data->>'role', NULL) = 'prestataire' THEN
    -- Vérifier quelles colonnes existent dans la table profiles
    SELECT 
      EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
      ) INTO has_onboarding_completed;
    
    SELECT 
      EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'inscription_completee'
      ) INTO has_inscription_completee;
    
    -- Construire l'INSERT dynamiquement selon les colonnes disponibles
    IF has_onboarding_completed THEN
      -- Utiliser onboarding_completed si elle existe
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
        COALESCE(NEW.email, NULL),
        COALESCE(NEW.raw_user_meta_data->>'prenom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'nom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'nom_entreprise', NULL)
      )
      ON CONFLICT (id) DO NOTHING;
    ELSIF has_inscription_completee THEN
      -- Utiliser inscription_completee si elle existe
      INSERT INTO public.profiles (
        id, 
        role, 
        inscription_completee,
        email,
        prenom,
        nom,
        nom_entreprise
      )
      VALUES (
        NEW.id,
        'prestataire',
        FALSE,
        COALESCE(NEW.email, NULL),
        COALESCE(NEW.raw_user_meta_data->>'prenom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'nom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'nom_entreprise', NULL)
      )
      ON CONFLICT (id) DO NOTHING;
    ELSE
      -- Si aucune des deux colonnes n'existe, créer sans cette colonne
      INSERT INTO public.profiles (
        id, 
        role, 
        email,
        prenom,
        nom,
        nom_entreprise
      )
      VALUES (
        NEW.id,
        'prestataire',
        COALESCE(NEW.email, NULL),
        COALESCE(NEW.raw_user_meta_data->>'prenom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'nom', NULL),
        COALESCE(NEW.raw_user_meta_data->>'nom_entreprise', NULL)
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Crée automatiquement un profil dans profiles UNIQUEMENT pour les prestataires. Les couples sont gérés séparément dans la table couples. Ne crée qu''un profil basique, le code d''application complétera les données avec un upsert.';
