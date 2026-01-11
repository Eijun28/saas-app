-- ============================================
-- Migration: Ajout des liens de réseaux sociaux
-- Date: 2024
-- Description: Ajoute les colonnes pour les liens sociaux et site web dans la table profiles
-- ============================================

-- Ajouter les colonnes pour les réseaux sociaux dans la table profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS autres_reseaux JSONB DEFAULT '{}'::jsonb;

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN profiles.instagram_url IS 'URL du profil Instagram du prestataire';
COMMENT ON COLUMN profiles.facebook_url IS 'URL du profil Facebook du prestataire';
COMMENT ON COLUMN profiles.website_url IS 'URL du site web du prestataire';
COMMENT ON COLUMN profiles.linkedin_url IS 'URL du profil LinkedIn du prestataire';
COMMENT ON COLUMN profiles.tiktok_url IS 'URL du profil TikTok du prestataire';
COMMENT ON COLUMN profiles.youtube_url IS 'URL de la chaîne YouTube du prestataire';
COMMENT ON COLUMN profiles.autres_reseaux IS 'JSON contenant d''autres réseaux sociaux avec leur nom et URL';

-- Créer un index pour améliorer les performances des recherches
CREATE INDEX IF NOT EXISTS idx_profiles_has_social_links 
  ON profiles((instagram_url IS NOT NULL OR facebook_url IS NOT NULL OR website_url IS NOT NULL));
