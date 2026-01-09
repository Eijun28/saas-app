-- Script de test pour le programme Early Adopter
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier la configuration du programme
SELECT 
  id,
  total_slots,
  used_slots,
  (total_slots - used_slots) as slots_remaining,
  trial_duration_days,
  program_active,
  created_at,
  updated_at
FROM early_adopter_program;

-- 2. Compter les early adopters actuels
SELECT 
  COUNT(*) as total_early_adopters,
  COUNT(CASE WHEN early_adopter_enrolled_at IS NOT NULL THEN 1 END) as with_enrollment_date,
  COUNT(CASE WHEN early_adopter_trial_end_date IS NOT NULL THEN 1 END) as with_trial_end_date
FROM profiles 
WHERE is_early_adopter = true;

-- 3. Liste des early adopters avec détails
SELECT 
  id,
  email,
  prenom,
  nom,
  is_early_adopter,
  early_adopter_enrolled_at,
  early_adopter_trial_end_date,
  subscription_tier,
  created_at,
  -- Calculer les jours restants
  CASE 
    WHEN early_adopter_trial_end_date IS NOT NULL 
    THEN EXTRACT(DAY FROM (early_adopter_trial_end_date::timestamp - NOW()))
    ELSE NULL
  END as days_remaining
FROM profiles 
WHERE is_early_adopter = true
ORDER BY early_adopter_enrolled_at ASC NULLS LAST;

-- 4. Vérifier les notifications de bienvenue
SELECT 
  id,
  user_id,
  notification_type,
  sent_at,
  read_at,
  created_at,
  -- Joindre avec le profil pour voir l'email
  (SELECT email FROM profiles WHERE id = early_adopter_notifications.user_id) as user_email
FROM early_adopter_notifications 
WHERE notification_type = 'welcome'
ORDER BY sent_at DESC
LIMIT 10;

-- 5. Vérifier la cohérence des données
SELECT 
  'Program slots used' as check_type,
  (SELECT used_slots FROM early_adopter_program LIMIT 1) as program_value,
  (SELECT COUNT(*) FROM profiles WHERE is_early_adopter = true) as actual_count,
  CASE 
    WHEN (SELECT used_slots FROM early_adopter_program LIMIT 1) = 
         (SELECT COUNT(*) FROM profiles WHERE is_early_adopter = true)
    THEN '✅ OK'
    ELSE '❌ MISMATCH'
  END as status;

-- 6. Trouver les profils avec incohérences
SELECT 
  id,
  email,
  is_early_adopter,
  early_adopter_enrolled_at,
  early_adopter_trial_end_date,
  subscription_tier,
  CASE 
    WHEN is_early_adopter = true AND early_adopter_enrolled_at IS NULL THEN '❌ Missing enrollment date'
    WHEN is_early_adopter = true AND early_adopter_trial_end_date IS NULL THEN '❌ Missing trial end date'
    WHEN is_early_adopter = true AND subscription_tier != 'early_adopter' THEN '❌ Wrong subscription tier'
    WHEN is_early_adopter = false AND subscription_tier = 'early_adopter' THEN '❌ Early adopter tier but flag false'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE role = 'prestataire'
ORDER BY created_at DESC
LIMIT 20;
