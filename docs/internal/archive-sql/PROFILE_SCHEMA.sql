-- ============================================
-- SCHÉMA PROFIL - NUPLY
-- ============================================
-- Modifications des tables pour la page profil
-- ============================================

-- ============================================
-- MODIFICATIONS TABLE profiles
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================
-- MODIFICATIONS TABLE couple_profiles
-- ============================================
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS nombre_invites INTEGER;
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS type_ceremonie TEXT CHECK (type_ceremonie IN ('religieuse', 'civile', 'les_deux'));
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS couleurs_mariage TEXT[] DEFAULT '{}';
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT TRUE;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_telephone ON profiles(telephone);
CREATE INDEX IF NOT EXISTS idx_couple_profiles_type_ceremonie ON couple_profiles(type_ceremonie);

-- ============================================
-- NOTES
-- ============================================
-- 1. Le bucket 'profile-photos' doit être créé manuellement dans Supabase Storage
-- 2. Configuration du bucket :
--    - Public : true
--    - File size limit : 5MB
--    - Allowed MIME types : image/jpeg, image/png, image/webp
-- 3. Les RLS existants sur profiles et couple_profiles s'appliquent automatiquement

