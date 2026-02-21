-- Migration: Programme Ambassadeur
-- Étend le système de parrainage existant pour les ambassadeurs désignés par l'admin.
-- Un ambassadeur gagne :
--   +5€ par filleul inscrit (signup)
--   +10€ si ce filleul prend un abonnement payant (conversion)
--   +2€ bonus par inscription à partir du 20ème filleul (milestone)

-- ─────────────────────────────────────────────────────────────
-- 1. Étendre provider_referrals avec les colonnes ambassadeur
-- ─────────────────────────────────────────────────────────────
ALTER TABLE provider_referrals
  ADD COLUMN IF NOT EXISTS is_ambassador      BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS ambassador_active  BOOLEAN DEFAULT true  NOT NULL,
  ADD COLUMN IF NOT EXISTS ambassador_since   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_by       TEXT;   -- email admin ayant activé

-- ─────────────────────────────────────────────────────────────
-- 2. Étendre referral_usages avec les colonnes de conversion
-- ─────────────────────────────────────────────────────────────
ALTER TABLE referral_usages
  ADD COLUMN IF NOT EXISTS signup_bonus_credited      BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS conversion_bonus_credited  BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS subscription_converted_at  TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 3. Enum type pour les gains ambassadeur
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ambassador_earning_type') THEN
    CREATE TYPE ambassador_earning_type AS ENUM ('signup', 'conversion', 'milestone');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ambassador_earning_status') THEN
    CREATE TYPE ambassador_earning_status AS ENUM ('pending', 'validated', 'paid');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ambassador_payout_status') THEN
    CREATE TYPE ambassador_payout_status AS ENUM ('pending', 'processing', 'done');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. Table ambassador_earnings — chaque événement de gain
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambassador_earnings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_usage_id UUID REFERENCES referral_usages(id) ON DELETE SET NULL,  -- nullable pour milestone sans usage direct
  amount            NUMERIC(8,2) NOT NULL CHECK (amount > 0),
  type              ambassador_earning_type NOT NULL,
  status            ambassador_earning_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT now(),
  validated_at      TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ambassador_earnings_ambassador ON ambassador_earnings(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_earnings_status ON ambassador_earnings(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_earnings_referral ON ambassador_earnings(referral_usage_id);

-- ─────────────────────────────────────────────────────────────
-- 5. Table ambassador_payouts — versements manuels groupés
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambassador_payouts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(8,2) NOT NULL CHECK (amount > 0),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  status        ambassador_payout_status NOT NULL DEFAULT 'pending',
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  processed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_ambassador ON ambassador_payouts(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_status ON ambassador_payouts(status);

-- ─────────────────────────────────────────────────────────────
-- 6. Trigger updated_at sur ambassador_payouts
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- (ambassador_earnings et payouts n'ont pas updated_at, on utilise les champs spécifiques)

-- ─────────────────────────────────────────────────────────────
-- 7. Fonction métier : créditer un gain signup (5€ + milestone éventuel)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION credit_ambassador_signup_bonus(p_referral_usage_id UUID)
RETURNS VOID AS $$
DECLARE
  v_usage         referral_usages%ROWTYPE;
  v_referral      provider_referrals%ROWTYPE;
  v_total         INTEGER;
BEGIN
  -- Charger l'usage
  SELECT * INTO v_usage FROM referral_usages WHERE id = p_referral_usage_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Déjà crédité ?
  IF v_usage.signup_bonus_credited THEN RETURN; END IF;

  -- Vérifier que le parrain est bien ambassadeur actif
  SELECT * INTO v_referral
    FROM provider_referrals
   WHERE referral_code = v_usage.referral_code
     AND is_ambassador = true
     AND ambassador_active = true;
  IF NOT FOUND THEN RETURN; END IF;

  -- Insérer le gain signup (5€)
  INSERT INTO ambassador_earnings (ambassador_id, referral_usage_id, amount, type)
  VALUES (v_usage.referrer_id, p_referral_usage_id, 5.00, 'signup');

  -- Marquer comme crédité
  UPDATE referral_usages SET signup_bonus_credited = true WHERE id = p_referral_usage_id;

  -- Récupérer le total actuel après incrément
  SELECT total_referrals INTO v_total
    FROM provider_referrals
   WHERE referral_code = v_usage.referral_code;

  -- Bonus milestone à partir du 20ème filleul (+2€ par inscription)
  IF v_total >= 20 THEN
    INSERT INTO ambassador_earnings (ambassador_id, referral_usage_id, amount, type)
    VALUES (v_usage.referrer_id, p_referral_usage_id, 2.00, 'milestone');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 8. Fonction métier : créditer un gain conversion (10€)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION credit_ambassador_conversion_bonus(p_referred_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_usage    referral_usages%ROWTYPE;
  v_referral provider_referrals%ROWTYPE;
BEGIN
  -- Trouver l'usage du filleul
  SELECT * INTO v_usage FROM referral_usages WHERE referred_user_id = p_referred_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Déjà crédité ?
  IF v_usage.conversion_bonus_credited THEN RETURN; END IF;

  -- Vérifier que le parrain est bien ambassadeur actif
  SELECT * INTO v_referral
    FROM provider_referrals
   WHERE referral_code = v_usage.referral_code
     AND is_ambassador = true
     AND ambassador_active = true;
  IF NOT FOUND THEN RETURN; END IF;

  -- Insérer le gain conversion (10€)
  INSERT INTO ambassador_earnings (ambassador_id, referral_usage_id, amount, type)
  VALUES (v_usage.referrer_id, v_usage.id, 10.00, 'conversion');

  -- Marquer comme crédité + date de conversion
  UPDATE referral_usages
     SET conversion_bonus_credited = true,
         subscription_converted_at = now()
   WHERE id = v_usage.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 9. RLS — ambassador_earnings
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ambassador_earnings ENABLE ROW LEVEL SECURITY;

-- Le prestataire voit ses propres gains
CREATE POLICY "ambassador_read_own_earnings"
  ON ambassador_earnings FOR SELECT
  USING (auth.uid() = ambassador_id);

-- Le service role peut tout faire (admin + webhooks)
CREATE POLICY "service_role_all_earnings"
  ON ambassador_earnings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- 10. RLS — ambassador_payouts
-- ─────────────────────────────────────────────────────────────
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;

-- Le prestataire voit ses propres versements
CREATE POLICY "ambassador_read_own_payouts"
  ON ambassador_payouts FOR SELECT
  USING (auth.uid() = ambassador_id);

-- Le service role peut tout faire
CREATE POLICY "service_role_all_payouts"
  ON ambassador_payouts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- 11. RLS — provider_referrals : seul le service role peut
--     modifier is_ambassador / ambassador_active
-- ─────────────────────────────────────────────────────────────
-- (Les policies existantes restent, on ajoute une policy service_role en UPDATE)
CREATE POLICY "service_role_update_referrals"
  ON provider_referrals FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
