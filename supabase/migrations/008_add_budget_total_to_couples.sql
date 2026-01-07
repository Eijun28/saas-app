-- Migration: Ajouter la colonne budget_total à la table couples
-- Date: 2026-01-07
-- Description: Ajoute la colonne budget_total pour permettre aux couples de définir un budget total unique

-- Ajouter la colonne budget_total à la table couples
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS budget_total NUMERIC(10, 2);

-- Commentaire sur la colonne
COMMENT ON COLUMN couples.budget_total IS 'Budget total du mariage en euros. Prioritaire sur budget_min et budget_max si défini.';
