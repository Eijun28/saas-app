-- 080_add_factures_sent_at.sql
-- Ajoute la colonne sent_at à la table factures pour tracer l'envoi au couple

ALTER TABLE factures ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

COMMENT ON COLUMN factures.sent_at IS 'Date à laquelle la facture a été envoyée par email au couple';
