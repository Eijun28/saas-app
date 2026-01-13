-- Migration: Corriger la politique RLS pour les couples
-- Date: 2025-01-13
-- Description: Met à jour la politique "Couples can view prestataire profiles" pour vérifier dans la table couples
--               au lieu de profiles avec role='couple'

-- Supprimer l'ancienne politique qui vérifie dans profiles
DROP POLICY IF EXISTS "Couples can view prestataire profiles" ON profiles;

-- Recréer la politique avec la bonne vérification (table couples)
CREATE POLICY "Couples can view prestataire profiles"
  ON profiles
  FOR SELECT
  USING (
    -- L'utilisateur connecté doit être un couple (vérifier dans la table couples)
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.user_id = auth.uid()
    )
    -- ET le profil à lire doit être un prestataire
    AND role = 'prestataire'
  );

-- Note: La politique "Authenticated users can view prestataire profiles" devrait déjà fonctionner
-- mais cette politique spécifique aux couples est plus restrictive et peut être utile pour un contrôle plus fin
