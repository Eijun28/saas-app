-- Migration: Créer les politiques RLS pour la table couples
-- Date: 2024

-- Activer RLS sur la table couples (si pas déjà fait)
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies (si elles existent)
DROP POLICY IF EXISTS "Users can view own couple" ON public.couples;
DROP POLICY IF EXISTS "Users can update own couple" ON public.couples;
DROP POLICY IF EXISTS "Users can insert own couple" ON public.couples;

-- Lecture : L'utilisateur peut voir son profil couple
CREATE POLICY "Users can view own couple"
  ON public.couples FOR SELECT
  USING (auth.uid() = id);

-- Mise à jour : L'utilisateur peut mettre à jour son profil couple
CREATE POLICY "Users can update own couple"
  ON public.couples FOR UPDATE
  USING (auth.uid() = id);

-- Insertion : L'utilisateur peut créer son profil couple
-- IMPORTANT : Cette policy permet à l'utilisateur de créer son propre profil lors de l'inscription
CREATE POLICY "Users can insert own couple"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = id);

