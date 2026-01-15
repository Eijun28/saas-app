-- ============================================
-- Migration : demandes → requests
-- ============================================
-- Ce script migre les données de l'ancienne table `demandes`
-- vers la nouvelle table `requests` avant suppression
-- ============================================

-- Vérifier si la table demandes existe et contient des données
DO $$
DECLARE
  demandes_count INTEGER;
BEGIN
  -- Vérifier si la table existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'demandes'
  ) THEN
    -- Compter les demandes
    SELECT COUNT(*) INTO demandes_count FROM public.demandes;
    
    RAISE NOTICE 'Table demandes trouvée avec % enregistrements', demandes_count;
    
    IF demandes_count > 0 THEN
      RAISE NOTICE '⚠️  Migration nécessaire : % demandes à migrer vers requests', demandes_count;
    ELSE
      RAISE NOTICE '✅ Aucune donnée à migrer (table vide)';
    END IF;
  ELSE
    RAISE NOTICE '✅ Table demandes n''existe pas (déjà supprimée)';
  END IF;
END $$;

-- Migration des données (si demandes existe et contient des données)
INSERT INTO public.requests (
  couple_id,
  provider_id,
  status,
  initial_message,
  created_at,
  responded_at
)
SELECT 
  -- couple_id : doit être auth.users.id, pas couples.id
  -- Si demandes.couple_id référence couples.id, on doit récupérer couples.user_id
  COALESCE(
    (SELECT user_id FROM public.couples WHERE id = d.couple_id LIMIT 1),
    d.couple_id -- Fallback si déjà auth.users.id
  ) as couple_id,
  
  -- provider_id : doit être auth.users.id
  -- Si demandes.prestataire_id référence profiles.id, on doit utiliser directement (profiles.id = auth.users.id)
  d.prestataire_id as provider_id,
  
  -- Mapping des statuts
  CASE 
    WHEN d.status = 'pending' THEN 'pending'::public.request_status
    WHEN d.status = 'accepted' THEN 'accepted'::public.request_status
    WHEN d.status = 'rejected' THEN 'rejected'::public.request_status
    WHEN d.status IN ('viewed', 'responded') THEN 'pending'::public.request_status -- Considérés comme pending
    ELSE 'pending'::public.request_status
  END as status,
  
  -- initial_message depuis message
  COALESCE(d.message, '') as initial_message,
  
  -- Dates
  COALESCE(d.created_at, now()) as created_at,
  d.responded_at as responded_at

FROM public.demandes d
WHERE NOT EXISTS (
  -- Éviter les doublons : ne pas migrer si une request existe déjà pour ce binôme
  SELECT 1 FROM public.requests r
  WHERE r.couple_id = COALESCE(
    (SELECT user_id FROM public.couples WHERE id = d.couple_id LIMIT 1),
    d.couple_id
  )
  AND r.provider_id = d.prestataire_id
)
ON CONFLICT (couple_id, provider_id) DO NOTHING;

-- Afficher le résultat
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM public.requests;
  RAISE NOTICE '✅ Migration terminée. Total requests après migration : %', migrated_count;
END $$;

-- ============================================
-- SUPPRESSION DE L'ANCIENNE TABLE demandes
-- ============================================
-- ⚠️  ATTENTION : Décommentez les lignes ci-dessous UNIQUEMENT après vérification
-- ============================================

-- Supprimer les politiques RLS sur demandes
-- DROP POLICY IF EXISTS "Couples can view own demandes" ON public.demandes;
-- DROP POLICY IF EXISTS "Prestataires can view demandes" ON public.demandes;
-- DROP POLICY IF EXISTS "Couples can create demandes" ON public.demandes;
-- DROP POLICY IF EXISTS "Prestataires can update demandes" ON public.demandes;
-- DROP POLICY IF EXISTS "Couples can update own demandes" ON public.demandes;

-- Désactiver RLS
-- ALTER TABLE IF EXISTS public.demandes DISABLE ROW LEVEL SECURITY;

-- Supprimer les index
-- DROP INDEX IF EXISTS idx_demandes_couple_id;
-- DROP INDEX IF EXISTS idx_demandes_status;
-- DROP INDEX IF EXISTS idx_demandes_created_at;
-- DROP INDEX IF EXISTS idx_demandes_prestataire_id;

-- Supprimer le trigger
-- DROP TRIGGER IF EXISTS update_demandes_updated_at ON public.demandes;

-- Supprimer la table (CASCADE supprime automatiquement les contraintes)
-- DROP TABLE IF EXISTS public.demandes CASCADE;

-- RAISE NOTICE '✅ Table demandes supprimée avec succès';
