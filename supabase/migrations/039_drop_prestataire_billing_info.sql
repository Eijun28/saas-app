-- Migration: Suppression de la table prestataire_billing_info
-- Date: 2025-01
-- Description: Supprime proprement la table prestataire_billing_info et toutes ses dépendances
--              (triggers, politiques RLS, index)

-- ============================================
-- SUPPRESSION DES TRIGGERS
-- ===========================================

DROP TRIGGER IF EXISTS update_prestataire_billing_info_updated_at_trigger 
  ON public.prestataire_billing_info;

-- ============================================
-- SUPPRESSION DES POLITIQUES RLS
-- ===========================================

DROP POLICY IF EXISTS "Prestataires can view own billing info" 
  ON public.prestataire_billing_info;
DROP POLICY IF EXISTS "Prestataires can insert own billing info" 
  ON public.prestataire_billing_info;
DROP POLICY IF EXISTS "Prestataires can update own billing info" 
  ON public.prestataire_billing_info;
DROP POLICY IF EXISTS "Prestataires can delete own billing info" 
  ON public.prestataire_billing_info;

-- ============================================
-- SUPPRESSION DES INDEX
-- ===========================================

DROP INDEX IF EXISTS idx_prestataire_billing_info_user_id;
DROP INDEX IF EXISTS idx_prestataire_billing_info_siret;

-- ============================================
-- SUPPRESSION DE LA FONCTION TRIGGER
-- ===========================================

DROP FUNCTION IF EXISTS update_prestataire_billing_info_updated_at();

-- ============================================
-- SUPPRESSION DE LA TABLE
-- ===========================================

DROP TABLE IF EXISTS public.prestataire_billing_info;
