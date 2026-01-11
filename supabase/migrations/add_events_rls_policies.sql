-- ============================================
-- Migration: Ajout des politiques RLS pour la table evenements_prestataire
-- Date: 2024
-- Description: Permet aux prestataires de gérer leurs propres événements
-- ============================================

-- Activer RLS sur la table evenements_prestataire si ce n'est pas déjà fait
ALTER TABLE public.evenements_prestataire ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Prestataires can view own events" ON public.evenements_prestataire;
DROP POLICY IF EXISTS "Prestataires can insert own events" ON public.evenements_prestataire;
DROP POLICY IF EXISTS "Prestataires can update own events" ON public.evenements_prestataire;
DROP POLICY IF EXISTS "Prestataires can delete own events" ON public.evenements_prestataire;

-- Lecture : Les prestataires peuvent voir leurs propres événements
CREATE POLICY "Prestataires can view own events"
  ON public.evenements_prestataire FOR SELECT
  USING (auth.uid() = prestataire_id);

-- Insertion : Les prestataires peuvent créer leurs propres événements
CREATE POLICY "Prestataires can insert own events"
  ON public.evenements_prestataire FOR INSERT
  WITH CHECK (auth.uid() = prestataire_id);

-- Mise à jour : Les prestataires peuvent mettre à jour leurs propres événements
CREATE POLICY "Prestataires can update own events"
  ON public.evenements_prestataire FOR UPDATE
  USING (auth.uid() = prestataire_id)
  WITH CHECK (auth.uid() = prestataire_id);

-- Suppression : Les prestataires peuvent supprimer leurs propres événements
CREATE POLICY "Prestataires can delete own events"
  ON public.evenements_prestataire FOR DELETE
  USING (auth.uid() = prestataire_id);
