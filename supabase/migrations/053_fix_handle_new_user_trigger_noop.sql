-- ============================================
-- Migration: Simplification du trigger handle_new_user (no-op)
-- Date: 2025-02
-- Description:
--   Le trigger handle_new_user() causait des erreurs "Database error saving new user"
--   car il référençait des colonnes qui n'existent plus (onboarding_completed renommée
--   en inscription_completee). Cette migration rend le trigger no-op.
--   La création des profils est entièrement gérée par le code application via le client admin.
-- ============================================

-- Recréer la fonction comme un simple pass-through
-- Le code application gère la création des profils via adminClient.upsert()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne rien faire ici. La création des profils est gérée par le code application :
  -- - Prestataires → table profiles (via adminClient.upsert dans signUp)
  -- - Couples → table couples (via adminClient.upsert dans signUp)
  -- Cela évite tout risque d'erreur de colonne manquante ou de contrainte.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger no-op. La création des profils prestataires (profiles) et couples (couples) est entièrement gérée par le code application via le client admin Supabase.';
