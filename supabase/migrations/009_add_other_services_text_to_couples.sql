-- Migration: Ajouter la colonne other_services_text à la table couples
-- Date: 2026-01-XX
-- Description: Ajoute la colonne other_services_text pour permettre aux couples de préciser les services personnalisés lorsqu'ils sélectionnent "Autre"

-- Ajouter la colonne other_services_text à la table couples
ALTER TABLE couples 
ADD COLUMN IF NOT EXISTS other_services_text TEXT;

-- Commentaire sur la colonne
COMMENT ON COLUMN couples.other_services_text IS 'Texte personnalisé pour préciser les services nécessaires lorsque "Autre" est sélectionné dans services_needed';
