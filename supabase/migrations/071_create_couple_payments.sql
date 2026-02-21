-- ─────────────────────────────────────────────────────────────────────────────
-- 071 · Suivi des paiements (côté couple)
-- ─────────────────────────────────────────────────────────────────────────────
-- Table créée :
--   · couple_payments – jalons de paiement (acomptes, soldes…) déclarés par
--     le couple pour suivre leurs dépenses prestataires.
--
-- Complémentaire à budget_items (estimation) :
--   budget_items = ce qu'on PRÉVOIT de dépenser
--   couple_payments = ce qu'on DOIT et a PAYÉ
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS couple_payments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,

  -- Prestataire concerné (nom libre ; optionnellement lié à un profil)
  provider_name TEXT       NOT NULL,
  provider_id   UUID       REFERENCES profiles(id) ON DELETE SET NULL,

  -- Description du jalon (ex: "Acompte 30%", "Solde final")
  label        TEXT        NOT NULL,

  -- Catégorie (alignée sur les catégories du budget existant)
  category     TEXT        NOT NULL DEFAULT 'autre'
               CHECK (category IN (
                 'lieu', 'traiteur', 'photo', 'video', 'musique',
                 'fleurs', 'decoration', 'robe', 'costume',
                 'beaute', 'transport', 'faire_part', 'autre'
               )),

  -- Montant total du jalon et montant déjà réglé
  amount_total NUMERIC(10, 2) NOT NULL CHECK (amount_total >= 0),
  amount_paid  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),

  -- Statut calculé / forcé
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),

  -- Dates clés
  due_date     DATE,         -- Échéance du paiement
  paid_date    DATE,         -- Date réelle du paiement (null si pas encore payé)

  -- Mode de paiement
  method       TEXT        NOT NULL DEFAULT 'autre'
               CHECK (method IN ('virement', 'cheque', 'carte', 'especes', 'autre')),

  -- Référence (numéro de facture, confirmation…)
  reference    TEXT,

  -- Notes libres
  notes        TEXT,

  -- Timestamps
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Contrainte : amount_paid <= amount_total
  CONSTRAINT payment_amount_check CHECK (amount_paid <= amount_total)
);

COMMENT ON TABLE couple_payments IS 'Jalons de paiement (acomptes, soldes…) déclarés par le couple pour suivre leurs dépenses prestataires.';
COMMENT ON COLUMN couple_payments.status IS 'pending = pas encore payé ; partial = partiellement réglé ; paid = entièrement réglé ; overdue = en retard.';
COMMENT ON COLUMN couple_payments.amount_total IS 'Montant total du jalon (ex: 1000€ pour l''acompte de 30%).';
COMMENT ON COLUMN couple_payments.amount_paid IS 'Montant déjà versé pour ce jalon.';

-- ─── Trigger updated_at ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_couple_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_couple_payments_updated_at
  BEFORE UPDATE ON couple_payments
  FOR EACH ROW EXECUTE FUNCTION update_couple_payments_updated_at();

-- ─── Trigger : recalcul automatique du statut ─────────────────────────────────
-- Si amount_paid = 0 et due_date passée → overdue
-- Si amount_paid = amount_total → paid
-- Sinon si amount_paid > 0 → partial
-- Sinon → pending

CREATE OR REPLACE FUNCTION sync_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_paid >= NEW.amount_total THEN
    NEW.status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date IS NOT NULL AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_couple_payments_sync_status
  BEFORE INSERT OR UPDATE ON couple_payments
  FOR EACH ROW EXECUTE FUNCTION sync_payment_status();

-- ─── Index ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_couple_payments_couple    ON couple_payments (couple_id);
CREATE INDEX IF NOT EXISTS idx_couple_payments_status    ON couple_payments (couple_id, status);
CREATE INDEX IF NOT EXISTS idx_couple_payments_due_date  ON couple_payments (couple_id, due_date);
CREATE INDEX IF NOT EXISTS idx_couple_payments_category  ON couple_payments (couple_id, category);
CREATE INDEX IF NOT EXISTS idx_couple_payments_provider  ON couple_payments (provider_id) WHERE provider_id IS NOT NULL;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE couple_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON couple_payments
  FOR SELECT USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "payments_insert_own" ON couple_payments
  FOR INSERT WITH CHECK (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "payments_update_own" ON couple_payments
  FOR UPDATE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );

CREATE POLICY "payments_delete_own" ON couple_payments
  FOR DELETE USING (
    couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())
  );
