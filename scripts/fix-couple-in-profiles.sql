-- ============================================
-- Script de correction : Suppression des couples de la table profiles
-- ============================================
-- Description: Ce script identifie et supprime les couples qui ont été 
--              incorrectement enregistrés dans la table profiles
--              (qui est réservée aux prestataires uniquement)
-- ============================================

-- ÉTAPE 1: Diagnostic - Identifier les couples dans profiles
-- ============================================
-- Vérifier les enregistrements dans profiles qui sont des couples
SELECT 
    p.id,
    p.email,
    p.role,
    p.prenom,
    p.nom,
    p.created_at,
    CASE 
        WHEN c.id IS NOT NULL THEN '✅ Existe dans couples'
        ELSE '❌ N''existe PAS dans couples'
    END as statut_couple,
    c.id as couple_id,
    c.email as couple_email
FROM profiles p
LEFT JOIN couples c ON p.id = c.user_id
WHERE p.role = 'couple' 
   OR (p.role IS NULL AND c.id IS NOT NULL)  -- Cas où role est NULL mais existe dans couples
ORDER BY p.created_at DESC;

-- ÉTAPE 2: Vérifier s'il y a des enregistrements dans profiles qui correspondent à des couples
-- mais qui n'ont pas le bon role
SELECT 
    COUNT(*) as nombre_couples_dans_profiles,
    COUNT(CASE WHEN role = 'couple' THEN 1 END) as avec_role_couple,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as avec_role_null,
    COUNT(CASE WHEN role = 'prestataire' THEN 1 END) as avec_role_prestataire
FROM profiles p
INNER JOIN couples c ON p.id = c.user_id;

-- ÉTAPE 3: CORRECTION - Supprimer les couples de la table profiles
-- ============================================
-- ATTENTION: Cette opération supprime définitivement les enregistrements
-- Assurez-vous d'avoir vérifié les résultats des requêtes précédentes

BEGIN;

-- Supprimer les enregistrements dans profiles qui correspondent à des couples
-- (même si role = 'couple' ou role IS NULL)
DELETE FROM profiles
WHERE id IN (
    SELECT p.id
    FROM profiles p
    INNER JOIN couples c ON p.id = c.user_id
);

-- Vérifier le résultat
SELECT 
    COUNT(*) as couples_restants_dans_profiles
FROM profiles p
INNER JOIN couples c ON p.id = c.user_id;

-- Si le count est 0, tout est bon !
-- Sinon, il y a peut-être des cas particuliers à traiter manuellement

COMMIT;

-- ÉTAPE 4: Vérification finale
-- ============================================
-- Vérifier qu'il ne reste plus de couples dans profiles
SELECT 
    'Vérification finale' as etape,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'prestataire' THEN 1 END) as prestataires,
    COUNT(CASE WHEN role = 'couple' THEN 1 END) as couples_restants,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as role_null
FROM profiles;

-- Cette requête devrait montrer 0 couples_restants si tout est correct
