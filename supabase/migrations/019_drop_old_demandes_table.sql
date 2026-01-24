-- ============================================
-- Migration : Suppression de l'ancienne table demandes
-- ============================================
-- ⚠️  À exécuter APRÈS avoir migré les données avec migrate-demandes-to-requests.sql
-- ============================================

-- Vérifier que la table requests existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'requests'
  ) THEN
    RAISE EXCEPTION 'La table requests n''existe pas. Exécutez d''abord la migration 018_messaging_v2_requests_conversations_messages.sql';
  END IF;
END $$;

-- Supprimer les politiques RLS sur demandes (si elles existent)
DROP POLICY IF EXISTS "Couples can view own demandes" ON public.demandes;
DROP POLICY IF EXISTS "Prestataires can view demandes" ON public.demandes;
DROP POLICY IF EXISTS "Couples can create demandes" ON public.demandes;
DROP POLICY IF EXISTS "Prestataires can update demandes" ON public.demandes;
DROP POLICY IF EXISTS "Couples can update own demandes" ON public.demandes;
DROP POLICY IF EXISTS "Couples can delete own demandes" ON public.demandes;

-- Désactiver RLS
ALTER TABLE IF EXISTS public.demandes DISABLE ROW LEVEL SECURITY;

-- Supprimer les index
DROP INDEX IF EXISTS idx_demandes_couple_id;
DROP INDEX IF EXISTS idx_demandes_status;
DROP INDEX IF EXISTS idx_demandes_created_at;
DROP INDEX IF EXISTS idx_demandes_prestataire_id;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS update_demandes_updated_at ON public.demandes;

-- Supprimer la table (CASCADE supprime automatiquement les contraintes et références)
DROP TABLE IF EXISTS public.demandes CASCADE;

-- Vérification finale
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'demandes'
  ) THEN
    RAISE WARNING 'La table demandes existe encore (peut-être des dépendances)';
  ELSE
    RAISE NOTICE '✅ Table demandes supprimée avec succès';
  END IF;
END $$;
