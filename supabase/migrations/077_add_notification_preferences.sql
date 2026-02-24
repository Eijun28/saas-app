-- Migration: Ajout des préférences de notifications
-- Ajoute une colonne JSONB notification_preferences aux tables couples et profiles
-- pour persister les préférences de notifications des utilisateurs.

-- Colonne pour les couples
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}';

-- Colonne pour les prestataires (table profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}';
