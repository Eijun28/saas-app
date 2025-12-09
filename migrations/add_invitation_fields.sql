-- Migration: Ajouter les champs d'invitation à la table collaborateurs
-- Date: 2024

-- Ajouter le champ invitation_token si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collaborateurs' 
        AND column_name = 'invitation_token'
    ) THEN
        ALTER TABLE collaborateurs ADD COLUMN invitation_token TEXT UNIQUE;
    END IF;
END $$;

-- Ajouter le champ invitation_expires_at si il n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collaborateurs' 
        AND column_name = 'invitation_expires_at'
    ) THEN
        ALTER TABLE collaborateurs ADD COLUMN invitation_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Créer un index sur invitation_token pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_collaborateurs_invitation_token 
ON collaborateurs(invitation_token);

-- Commentaire sur la table
COMMENT ON COLUMN collaborateurs.invitation_token IS 'Token unique pour l''invitation par email';
COMMENT ON COLUMN collaborateurs.invitation_expires_at IS 'Date d''expiration de l''invitation (par défaut 7 jours)';

