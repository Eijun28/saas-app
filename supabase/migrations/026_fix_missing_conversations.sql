-- ============================================
-- Migration: Créer les conversations manquantes pour les demandes acceptées
-- Date: 2025-01-21
-- ============================================

-- Créer les conversations manquantes pour toutes les demandes acceptées
-- qui n'ont pas encore de conversation associée
INSERT INTO public.conversations (request_id, couple_id, provider_id)
SELECT 
  r.id as request_id,
  r.couple_id,
  r.provider_id
FROM public.requests r
WHERE r.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.conversations c 
    WHERE c.request_id = r.id
  )
ON CONFLICT (request_id) DO NOTHING;

-- Vérification : compter les conversations créées
-- (Cette requête peut être exécutée manuellement pour vérifier)
-- SELECT COUNT(*) as conversations_created
-- FROM public.conversations c
-- INNER JOIN public.requests r ON c.request_id = r.id
-- WHERE r.status = 'accepted';
