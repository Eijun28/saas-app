-- ============================================
-- Script de diagnostic : Identifier les couples dans profiles
-- ============================================
-- Description: Ce script permet d'identifier les couples qui ont été 
--              incorrectement enregistrés dans la table profiles
--              AVANT de les supprimer
-- ============================================

-- DIAGNOSTIC 1: Liste complète des couples trouvés dans profiles
-- ============================================
SELECT 
    '🔍 DIAGNOSTIC: Couples dans profiles' as titre,
    p.id as profile_id,
    p.email as profile_email,
    p.role as profile_role,
    p.prenom,
    p.nom,
    p.nom_entreprise,
    p.created_at as profile_created_at,
    CASE 
        WHEN c.id IS NOT NULL THEN '✅ Existe dans couples'
        ELSE '❌ N''existe PAS dans couples'
    END as statut_couple,
    c.id as couple_id,
    c.user_id as couple_user_id,
    c.email as couple_email,
    c.partner_1_name,
    c.partner_2_name
FROM profiles p
LEFT JOIN couples c ON p.id = c.user_id
WHERE p.role = 'couple' 
   OR (p.role IS NULL AND c.id IS NOT NULL)  -- Cas où role est NULL mais existe dans couples
   OR c.id IS NOT NULL  -- Tous les cas où il y a une correspondance avec couples
ORDER BY p.created_at DESC;

-- DIAGNOSTIC 2: Statistiques générales
-- ============================================
SELECT 
    '📊 STATISTIQUES' as titre,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'prestataire' THEN 1 END) as prestataires,
    COUNT(CASE WHEN role = 'couple' THEN 1 END) as couples_avec_role_couple,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as role_null,
    COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) as correspondance_avec_couples
FROM profiles p
LEFT JOIN couples c ON p.id = c.user_id;

-- DIAGNOSTIC 3: Cas problématiques spécifiques
-- ============================================
-- Cas 1: Role = 'couple' dans profiles
SELECT 
    '⚠️ CAS 1: Role = couple dans profiles' as cas,
    p.id,
    p.email,
    p.created_at,
    CASE WHEN c.id IS NOT NULL THEN 'Existe dans couples' ELSE 'N''existe PAS dans couples' END as statut
FROM profiles p
LEFT JOIN couples c ON p.id = c.user_id
WHERE p.role = 'couple';

-- Cas 2: Role NULL mais existe dans couples
SELECT 
    '⚠️ CAS 2: Role NULL mais existe dans couples' as cas,
    p.id,
    p.email,
    p.created_at,
    c.id as couple_id
FROM profiles p
INNER JOIN couples c ON p.id = c.user_id
WHERE p.role IS NULL;

-- Cas 3: Correspondance avec couples mais role = 'prestataire' (anormal)
SELECT 
    '🚨 CAS 3: Correspondance avec couples mais role = prestataire' as cas,
    p.id,
    p.email,
    p.role,
    p.created_at,
    c.id as couple_id
FROM profiles p
INNER JOIN couples c ON p.id = c.user_id
WHERE p.role = 'prestataire';

-- DIAGNOSTIC 4: Vérifier les données avant suppression
-- ============================================
-- Cette requête liste tous les IDs qui seront supprimés
SELECT 
    '🗑️ IDs à supprimer de profiles' as titre,
    p.id,
    p.email,
    p.role,
    p.created_at,
    c.id as couple_id,
    c.email as couple_email
FROM profiles p
INNER JOIN couples c ON p.id = c.user_id
ORDER BY p.created_at DESC;
