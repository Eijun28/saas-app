-- ============================================
-- DIAGNOSTIC : Pourquoi les messages ne s'affichent pas côté prestataire
-- ============================================

-- ÉTAPE 1: Vérifier la structure de la table conversations
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- ÉTAPE 2: Vérifier si des conversations existent avec provider_id au lieu de prestataire_id
SELECT 
    COUNT(*) as total_conversations,
    COUNT(prestataire_id) as avec_prestataire_id,
    COUNT(provider_id) as avec_provider_id,
    COUNT(CASE WHEN prestataire_id IS NULL AND provider_id IS NOT NULL THEN 1 END) as seulement_provider_id
FROM conversations;

-- ÉTAPE 3: Lister les conversations avec provider_id mais sans prestataire_id
SELECT 
    id,
    couple_id,
    prestataire_id,
    provider_id,
    created_at,
    last_message_at
FROM conversations
WHERE provider_id IS NOT NULL 
AND (prestataire_id IS NULL OR prestataire_id != provider_id)
LIMIT 20;

-- ÉTAPE 4: Vérifier les politiques RLS pour conversations
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'conversations';

-- ÉTAPE 5: Vérifier les politiques RLS pour messages
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'messages';

-- ÉTAPE 6: Tester les permissions pour un prestataire spécifique (remplacer USER_ID)
-- SELECT 
--     id,
--     couple_id,
--     prestataire_id,
--     provider_id,
--     created_at
-- FROM conversations
-- WHERE prestataire_id = 'USER_ID' OR provider_id = 'USER_ID';

-- ÉTAPE 7: Vérifier les messages associés aux conversations
SELECT 
    c.id as conversation_id,
    c.prestataire_id,
    c.provider_id,
    COUNT(m.id) as nombre_messages
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.prestataire_id, c.provider_id
ORDER BY nombre_messages DESC
LIMIT 20;

-- ============================================
-- CORRECTION : Si des conversations ont provider_id mais pas prestataire_id
-- ============================================

-- CORRECTION 1: Copier provider_id vers prestataire_id si prestataire_id est NULL
UPDATE conversations
SET prestataire_id = provider_id
WHERE provider_id IS NOT NULL 
AND (prestataire_id IS NULL OR prestataire_id != provider_id);

-- CORRECTION 2: Vérifier après correction
SELECT 
    COUNT(*) as total_conversations,
    COUNT(prestataire_id) as avec_prestataire_id,
    COUNT(provider_id) as avec_provider_id
FROM conversations;

-- ============================================
-- FIN DU DIAGNOSTIC
-- ============================================
