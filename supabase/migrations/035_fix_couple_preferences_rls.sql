-- Migration: Correction de la politique RLS pour couple_preferences
-- Date: 2025-01
-- Description: Corrige la politique RLS pour permettre l'insertion de couple_preferences
-- 
-- PROBLÈME IDENTIFIÉ:
-- - La politique "Users can manage own preferences" avec FOR ALL peut avoir des problèmes
--   lors de l'INSERT car elle utilise USING et WITH CHECK de la même manière
-- - Il faut séparer les politiques pour INSERT, UPDATE, SELECT, DELETE pour plus de clarté
--
-- SOLUTION:
-- Supprimer la politique FOR ALL et créer des politiques séparées pour chaque opération

-- ============================================
-- CORRECTION: Politiques RLS pour couple_preferences
-- ============================================

-- Supprimer l'ancienne politique FOR ALL
DROP POLICY IF EXISTS "Users can manage own preferences" ON couple_preferences;

-- Créer des politiques séparées pour chaque opération

-- SELECT: Les utilisateurs peuvent voir leurs propres préférences
CREATE POLICY "Users can view own preferences"
  ON couple_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- INSERT: Les utilisateurs peuvent créer leurs propres préférences
CREATE POLICY "Users can insert own preferences"
  ON couple_preferences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- UPDATE: Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update own preferences"
  ON couple_preferences
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- DELETE: Les utilisateurs peuvent supprimer leurs propres préférences
CREATE POLICY "Users can delete own preferences"
  ON couple_preferences
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_preferences.couple_id
      AND couples.user_id = auth.uid()
    )
  );

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Vérifier que les politiques sont créées
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'couple_preferences';
  
  IF policy_count < 4 THEN
    RAISE EXCEPTION 'Erreur: Seulement % politiques créées pour couple_preferences (attendu: 4)', policy_count;
  END IF;
  
  RAISE NOTICE '✅ Migration 035 terminée avec succès : % politiques RLS créées pour couple_preferences', policy_count;
END $$;
