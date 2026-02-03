-- Migration: Enhanced Devis System
-- Date: 2026-02
-- Description: Adds devis templates, factures (invoices), and provider devis settings
--              for automated quote generation

-- ============================================
-- TABLE 1: devis_templates
-- Templates de devis réutilisables par prestataire
-- ============================================

CREATE TABLE IF NOT EXISTS public.devis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,

  -- Pre-filled content
  title_template TEXT NOT NULL,
  description_template TEXT,
  default_amount NUMERIC(10, 2),
  currency TEXT DEFAULT 'EUR',
  included_services TEXT[] DEFAULT '{}',
  excluded_services TEXT[] DEFAULT '{}',
  conditions TEXT,
  validity_days INTEGER DEFAULT 30,

  -- Metadata
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour devis_templates
CREATE INDEX IF NOT EXISTS idx_devis_templates_prestataire_id ON public.devis_templates(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_devis_templates_is_default ON public.devis_templates(is_default) WHERE is_default = true;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_devis_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_devis_templates_updated_at_trigger ON public.devis_templates;
CREATE TRIGGER update_devis_templates_updated_at_trigger
  BEFORE UPDATE ON public.devis_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_templates_updated_at();

-- RLS pour devis_templates
ALTER TABLE public.devis_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can manage own templates" ON public.devis_templates;
CREATE POLICY "Prestataires can manage own templates"
  ON public.devis_templates
  FOR ALL
  USING (auth.uid() = prestataire_id)
  WITH CHECK (auth.uid() = prestataire_id);

-- ============================================
-- TABLE 2: factures (invoices)
-- Factures générées à partir des devis acceptés
-- ============================================

CREATE TABLE IF NOT EXISTS public.factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
  prestataire_id UUID NOT NULL,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,

  -- Facture info
  facture_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Amounts
  amount_ht NUMERIC(10, 2) NOT NULL,
  tva_rate NUMERIC(5, 2) DEFAULT 0,
  amount_tva NUMERIC(10, 2) DEFAULT 0,
  amount_ttc NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',

  -- Content
  included_services TEXT[] DEFAULT '{}',
  conditions TEXT,
  payment_terms TEXT,

  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  -- PDF
  pdf_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour factures
CREATE INDEX IF NOT EXISTS idx_factures_prestataire_id ON public.factures(prestataire_id);
CREATE INDEX IF NOT EXISTS idx_factures_couple_id ON public.factures(couple_id);
CREATE INDEX IF NOT EXISTS idx_factures_devis_id ON public.factures(devis_id);
CREATE INDEX IF NOT EXISTS idx_factures_status ON public.factures(status);
CREATE INDEX IF NOT EXISTS idx_factures_issue_date ON public.factures(issue_date DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_factures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_factures_updated_at_trigger ON public.factures;
CREATE TRIGGER update_factures_updated_at_trigger
  BEFORE UPDATE ON public.factures
  FOR EACH ROW
  EXECUTE FUNCTION update_factures_updated_at();

-- RLS pour factures
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couples can view own factures" ON public.factures;
CREATE POLICY "Couples can view own factures"
  ON public.factures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE couples.id = factures.couple_id
      AND couples.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Prestataires can manage own factures" ON public.factures;
CREATE POLICY "Prestataires can manage own factures"
  ON public.factures
  FOR ALL
  USING (auth.uid() = prestataire_id)
  WITH CHECK (auth.uid() = prestataire_id);

-- ============================================
-- TABLE 3: provider_devis_settings
-- Paramètres par défaut pour les devis
-- ============================================

CREATE TABLE IF NOT EXISTS public.provider_devis_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Default values for devis
  default_validity_days INTEGER DEFAULT 30,
  default_conditions TEXT,
  default_payment_terms TEXT,

  -- TVA settings
  is_subject_to_tva BOOLEAN DEFAULT false,
  default_tva_rate NUMERIC(5, 2) DEFAULT 20.00,

  -- Numbering
  devis_prefix TEXT DEFAULT 'DEV',
  facture_prefix TEXT DEFAULT 'FAC',
  next_devis_number INTEGER DEFAULT 1,
  next_facture_number INTEGER DEFAULT 1,

  -- Auto-reminders
  send_reminder_before_expiry BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3,

  -- Display options
  show_iban_on_devis BOOLEAN DEFAULT false,
  show_iban_on_facture BOOLEAN DEFAULT true,

  -- Logo/branding
  custom_logo_url TEXT,
  header_text TEXT,
  footer_text TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour provider_devis_settings
CREATE INDEX IF NOT EXISTS idx_provider_devis_settings_prestataire_id ON public.provider_devis_settings(prestataire_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_provider_devis_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_provider_devis_settings_updated_at_trigger ON public.provider_devis_settings;
CREATE TRIGGER update_provider_devis_settings_updated_at_trigger
  BEFORE UPDATE ON public.provider_devis_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_devis_settings_updated_at();

-- RLS pour provider_devis_settings
ALTER TABLE public.provider_devis_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Prestataires can manage own devis settings" ON public.provider_devis_settings;
CREATE POLICY "Prestataires can manage own devis settings"
  ON public.provider_devis_settings
  FOR ALL
  USING (auth.uid() = prestataire_id)
  WITH CHECK (auth.uid() = prestataire_id);

-- ============================================
-- ADD MISSING COLUMNS TO devis TABLE
-- ============================================

DO $$
BEGIN
  -- Add devis_number if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'devis'
    AND column_name = 'devis_number'
  ) THEN
    ALTER TABLE public.devis ADD COLUMN devis_number TEXT;
  END IF;

  -- Add pdf_url if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'devis'
    AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.devis ADD COLUMN pdf_url TEXT;
  END IF;

  -- Add template_id reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'devis'
    AND column_name = 'template_id'
  ) THEN
    ALTER TABLE public.devis ADD COLUMN template_id UUID REFERENCES public.devis_templates(id) ON DELETE SET NULL;
  END IF;

  -- Add sent_at for tracking when devis was sent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'devis'
    AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.devis ADD COLUMN sent_at TIMESTAMPTZ;
  END IF;

  -- Add notes for internal provider notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'devis'
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.devis ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Index on devis_number
CREATE INDEX IF NOT EXISTS idx_devis_devis_number ON public.devis(devis_number);

-- ============================================
-- FUNCTION: Generate devis number
-- ============================================

CREATE OR REPLACE FUNCTION generate_devis_number(p_prestataire_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next_number INTEGER;
  v_year TEXT;
  v_result TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Get settings if prestataire_id provided
  IF p_prestataire_id IS NOT NULL THEN
    SELECT COALESCE(devis_prefix, 'DEV'), COALESCE(next_devis_number, 1)
    INTO v_prefix, v_next_number
    FROM public.provider_devis_settings
    WHERE prestataire_id = p_prestataire_id;

    -- Update next number
    IF v_next_number IS NOT NULL THEN
      UPDATE public.provider_devis_settings
      SET next_devis_number = next_devis_number + 1
      WHERE prestataire_id = p_prestataire_id;
    END IF;
  END IF;

  -- Default values if no settings
  v_prefix := COALESCE(v_prefix, 'DEV');
  v_next_number := COALESCE(v_next_number, (
    SELECT COALESCE(MAX(CAST(SPLIT_PART(devis_number, '-', 3) AS INTEGER)), 0) + 1
    FROM public.devis
    WHERE devis_number LIKE v_prefix || '-' || v_year || '-%'
  ));

  v_result := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Generate facture number
-- ============================================

CREATE OR REPLACE FUNCTION generate_facture_number(p_prestataire_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_next_number INTEGER;
  v_year TEXT;
  v_result TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Get settings if prestataire_id provided
  IF p_prestataire_id IS NOT NULL THEN
    SELECT COALESCE(facture_prefix, 'FAC'), COALESCE(next_facture_number, 1)
    INTO v_prefix, v_next_number
    FROM public.provider_devis_settings
    WHERE prestataire_id = p_prestataire_id;

    -- Update next number
    IF v_next_number IS NOT NULL THEN
      UPDATE public.provider_devis_settings
      SET next_facture_number = next_facture_number + 1
      WHERE prestataire_id = p_prestataire_id;
    END IF;
  END IF;

  -- Default values if no settings
  v_prefix := COALESCE(v_prefix, 'FAC');
  v_next_number := COALESCE(v_next_number, (
    SELECT COALESCE(MAX(CAST(SPLIT_PART(facture_number, '-', 3) AS INTEGER)), 0) + 1
    FROM public.factures
    WHERE facture_number LIKE v_prefix || '-' || v_year || '-%'
  ));

  v_result := v_prefix || '-' || v_year || '-' || LPAD(v_next_number::TEXT, 4, '0');

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Convert devis to facture
-- ============================================

CREATE OR REPLACE FUNCTION convert_devis_to_facture(
  p_devis_id UUID,
  p_tva_rate NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_devis RECORD;
  v_settings RECORD;
  v_facture_id UUID;
  v_facture_number TEXT;
  v_tva_rate NUMERIC;
  v_amount_tva NUMERIC;
  v_amount_ttc NUMERIC;
BEGIN
  -- Get the devis
  SELECT * INTO v_devis FROM public.devis WHERE id = p_devis_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Devis not found';
  END IF;

  IF v_devis.status != 'accepted' THEN
    RAISE EXCEPTION 'Devis must be accepted to convert to facture';
  END IF;

  -- Check if facture already exists for this devis
  IF EXISTS (SELECT 1 FROM public.factures WHERE devis_id = p_devis_id) THEN
    RAISE EXCEPTION 'A facture already exists for this devis';
  END IF;

  -- Get provider settings
  SELECT * INTO v_settings
  FROM public.provider_devis_settings
  WHERE prestataire_id = v_devis.prestataire_id;

  -- Calculate TVA
  v_tva_rate := COALESCE(p_tva_rate, v_settings.default_tva_rate, 0);

  IF v_settings.is_subject_to_tva AND v_tva_rate > 0 THEN
    v_amount_tva := v_devis.amount * (v_tva_rate / 100);
    v_amount_ttc := v_devis.amount + v_amount_tva;
  ELSE
    v_amount_tva := 0;
    v_amount_ttc := v_devis.amount;
  END IF;

  -- Generate facture number
  v_facture_number := generate_facture_number(v_devis.prestataire_id);

  -- Create facture
  INSERT INTO public.factures (
    devis_id,
    prestataire_id,
    couple_id,
    facture_number,
    title,
    description,
    amount_ht,
    tva_rate,
    amount_tva,
    amount_ttc,
    currency,
    included_services,
    conditions,
    payment_terms,
    issue_date,
    due_date,
    status
  ) VALUES (
    p_devis_id,
    v_devis.prestataire_id,
    v_devis.couple_id,
    v_facture_number,
    v_devis.title,
    v_devis.description,
    v_devis.amount,
    v_tva_rate,
    v_amount_tva,
    v_amount_ttc,
    v_devis.currency,
    v_devis.included_services,
    v_devis.conditions,
    COALESCE(v_settings.default_payment_terms, 'Paiement à 30 jours'),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'draft'
  )
  RETURNING id INTO v_facture_id;

  RETURN v_facture_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD RLS POLICY FOR PRESTATAIRES TO DELETE DEVIS
-- ============================================

DROP POLICY IF EXISTS "Prestataires can delete own devis" ON public.devis;
CREATE POLICY "Prestataires can delete own devis"
  ON public.devis FOR DELETE
  USING (auth.uid() = prestataire_id);

DROP POLICY IF EXISTS "Prestataires can update own devis" ON public.devis;
CREATE POLICY "Prestataires can update own devis"
  ON public.devis FOR UPDATE
  USING (auth.uid() = prestataire_id);

-- ============================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION generate_devis_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_facture_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION convert_devis_to_facture(UUID, NUMERIC) TO authenticated;
