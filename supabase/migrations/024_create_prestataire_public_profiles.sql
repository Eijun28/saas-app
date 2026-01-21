-- ============================================
-- Migration: Création de la table prestataire_public_profiles
-- Date: 2025-01
-- Description: Table pour stocker les notes et avis publics des prestataires
-- ============================================

-- Créer la table prestataire_public_profiles pour stocker les notes et avis
CREATE TABLE IF NOT EXISTS public.prestataire_public_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  rating numeric(3, 2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prestataire_public_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT prestataire_public_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prestataire_public_profiles_profile_id ON public.prestataire_public_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_prestataire_public_profiles_rating ON public.prestataire_public_profiles(rating);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_prestataire_public_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prestataire_public_profiles_updated_at_trigger
  BEFORE UPDATE ON public.prestataire_public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_prestataire_public_profiles_updated_at();

-- Activer RLS
ALTER TABLE public.prestataire_public_profiles ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Tous les utilisateurs authentifiés peuvent voir les profils publics
DROP POLICY IF EXISTS "Authenticated users can view prestataire public profiles" ON public.prestataire_public_profiles;
CREATE POLICY "Authenticated users can view prestataire public profiles"
  ON public.prestataire_public_profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Politique RLS : Les prestataires peuvent gérer leur propre profil public
DROP POLICY IF EXISTS "Prestataires can manage own public profile" ON public.prestataire_public_profiles;
CREATE POLICY "Prestataires can manage own public profile"
  ON public.prestataire_public_profiles
  FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);
