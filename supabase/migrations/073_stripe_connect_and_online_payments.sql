-- ─────────────────────────────────────────────────────────────────────────────
-- 073 · Stripe Connect + Paiements en ligne couple→prestataire
-- ─────────────────────────────────────────────────────────────────────────────
-- Tables créées :
--   · prestataire_stripe_connect – comptes Stripe Connect Express des prestataires
--
-- Colonnes ajoutées :
--   · factures.stripe_checkout_session_id  – session Stripe Checkout liée
--   · factures.stripe_payment_intent_id    – Payment Intent Stripe
--   · factures.online_payment_url          – URL de paiement Stripe envoyée au couple
--   · factures.online_payment_enabled      – flag : le prestataire autorise le paiement en ligne
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Table : comptes Stripe Connect des prestataires ─────────────────────────

CREATE TABLE IF NOT EXISTS prestataire_stripe_connect (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Stripe
  stripe_account_id    TEXT        NOT NULL,
  account_status       TEXT        NOT NULL DEFAULT 'pending'
                       CHECK (account_status IN ('pending', 'active', 'restricted', 'rejected')),
  onboarding_completed BOOLEAN     NOT NULL DEFAULT false,
  charges_enabled      BOOLEAN     NOT NULL DEFAULT false,
  payouts_enabled      BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_prestataire_stripe_connect UNIQUE (prestataire_id)
);

COMMENT ON TABLE prestataire_stripe_connect
  IS 'Comptes Stripe Connect Express des prestataires pour recevoir des paiements en ligne.';

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_prestataire_stripe_connect_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prestataire_stripe_connect_updated_at
  BEFORE UPDATE ON prestataire_stripe_connect
  FOR EACH ROW EXECUTE FUNCTION update_prestataire_stripe_connect_updated_at();

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_prestataire_stripe_connect_prestataire
  ON prestataire_stripe_connect (prestataire_id);

CREATE INDEX IF NOT EXISTS idx_prestataire_stripe_connect_account
  ON prestataire_stripe_connect (stripe_account_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE prestataire_stripe_connect ENABLE ROW LEVEL SECURITY;

-- Le prestataire peut lire son propre compte Connect
CREATE POLICY "stripe_connect_select_own" ON prestataire_stripe_connect
  FOR SELECT USING (prestataire_id = auth.uid());

-- Le prestataire peut insérer son propre compte
CREATE POLICY "stripe_connect_insert_own" ON prestataire_stripe_connect
  FOR INSERT WITH CHECK (prestataire_id = auth.uid());

-- Le prestataire peut modifier son propre compte
CREATE POLICY "stripe_connect_update_own" ON prestataire_stripe_connect
  FOR UPDATE USING (prestataire_id = auth.uid());

-- ─── Colonnes Stripe sur la table factures ───────────────────────────────────

ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id   TEXT,
  ADD COLUMN IF NOT EXISTS online_payment_url          TEXT,
  ADD COLUMN IF NOT EXISTS online_payment_enabled      BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN factures.stripe_checkout_session_id
  IS 'ID de la session Stripe Checkout créée pour le paiement de cette facture.';
COMMENT ON COLUMN factures.stripe_payment_intent_id
  IS 'ID du Payment Intent Stripe après paiement réussi.';
COMMENT ON COLUMN factures.online_payment_url
  IS 'URL de paiement Stripe envoyée au couple.';
COMMENT ON COLUMN factures.online_payment_enabled
  IS 'Si true, le prestataire a activé le paiement en ligne pour cette facture.';

-- Index pour retrouver une facture par session Stripe
CREATE INDEX IF NOT EXISTS idx_factures_stripe_session
  ON factures (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
