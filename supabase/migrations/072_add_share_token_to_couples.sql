-- Migration 072 : Ajout du token de partage du programme Jour J
-- Ajoute une colonne share_token (UUID nullable) sur la table couples.
-- Utilisé pour générer un lien public /programme/[token] en lecture seule.

ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT NULL;

-- Index pour accélérer la recherche par token
CREATE UNIQUE INDEX IF NOT EXISTS couples_share_token_idx
  ON couples (share_token)
  WHERE share_token IS NOT NULL;

-- Trigger updated_at déjà présent sur la table couples.
