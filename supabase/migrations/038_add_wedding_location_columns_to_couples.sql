-- deploy test
-- Migration: Ajouter les colonnes de localisation détaillée du mariage à la table couples
-- Date: 2025-01-XX
-- Description: Ajoute les colonnes wedding_city, wedding_region, wedding_country pour permettre un stockage plus précis de la localisation du mariage

-- Ajouter les colonnes de localisation détaillée
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS wedding_city TEXT,
ADD COLUMN IF NOT EXISTS wedding_region TEXT,
ADD COLUMN IF NOT EXISTS wedding_country TEXT DEFAULT 'France';

-- Migrer les données existantes depuis wedding_location si elle existe
DO $$
BEGIN
  -- Si wedding_location contient des données, essayer de les extraire
  -- Note: Cette migration ne fait pas de parsing automatique car le format peut varier
  -- Les utilisateurs devront compléter ces informations dans leur profil
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' 
    AND column_name = 'wedding_location'
  ) THEN
    -- Pour l'instant, on garde wedding_location pour compatibilité
    -- Les colonnes wedding_city, wedding_region, wedding_country seront remplies via le formulaire de profil
    RAISE NOTICE 'Colonnes wedding_city, wedding_region, wedding_country ajoutées. wedding_location conservée pour compatibilité.';
  ELSE
    RAISE NOTICE 'Colonnes wedding_city, wedding_region, wedding_country ajoutées.';
  END IF;
END $$;

-- Commentaires sur les colonnes
COMMENT ON COLUMN couples.wedding_city IS 'Ville du mariage (ex: Paris, Lyon, Marseille)';
COMMENT ON COLUMN couples.wedding_region IS 'Région ou département du mariage (ex: Île-de-France, Provence)';
COMMENT ON COLUMN couples.wedding_country IS 'Pays du mariage (par défaut: France)';
