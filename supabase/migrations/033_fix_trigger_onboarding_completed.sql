-- ============================================
-- Migration: Correction du trigger handle_new_user
-- Date: 2025-01
-- Description: Retire la référence à onboarding_completed qui n'existe pas dans la table profiles
-- ============================================

-- Recréer la fonction handle_new_user sans la référence à onboarding_completed
-- Utiliser un délimiteur différent ($function$) pour éviter les conflits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $function$
BEGIN
  -- Ne créer un profil dans profiles QUE si le rôle est 'prestataire'
  -- Les couples seront créés directement dans la table couples par le code d'application
  IF COALESCE(NEW.raw_user_meta_data->>'role', NULL) = 'prestataire' THEN
    -- Utiliser INSERT avec ON CONFLICT DO NOTHING pour éviter les erreurs
    -- Le code d'application fera l'upsert avec toutes les données nécessaires
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
      COALESCE(NEW.email, NULL), -- Utiliser l'email de auth.users si disponible
      COALESCE(NEW.raw_user_meta_data->>'prenom', NULL),
      COALESCE(NEW.raw_user_meta_data->>'nom', NULL),
      COALESCE(NEW.raw_user_meta_data->>'nom_entreprise', NULL)
    )
    ON CONFLICT (id) DO NOTHING; -- Le code d'application fera l'upsert complet
  END IF;
  
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
'Crée automatiquement un profil dans profiles UNIQUEMENT pour les prestataires. Les couples sont gérés séparément dans la table couples. Ne crée qu''un profil basique, le code d''application complétera les données avec un upsert.';
