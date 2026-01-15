-- ============================================
-- CORRECTION RLS POUR PERMETTRE AUX PRESTATAIRES DE VOIR LES COUPLES
-- ============================================
-- Les prestataires doivent pouvoir voir les données des couples
-- pour afficher les demandes qu'ils reçoivent
-- ============================================

-- Vérifier si la politique existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'couples'
    AND policyname = 'Prestataires can view couples in demandes'
  ) THEN
    RAISE NOTICE 'La politique existe déjà, suppression...';
    DROP POLICY IF EXISTS "Prestataires can view couples in demandes" ON couples;
  END IF;
END $$;

-- Créer une politique pour permettre aux prestataires de voir les couples
-- qui leur ont envoyé des demandes
CREATE POLICY "Prestataires can view couples in demandes"
  ON couples FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM demandes
      WHERE demandes.couple_id = couples.id
      AND demandes.prestataire_id = auth.uid()
    )
  );

SELECT '✅ Politique RLS créée : Les prestataires peuvent maintenant voir les couples qui leur ont envoyé des demandes.' as result;
