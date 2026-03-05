-- Table des abonnés newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- RLS activé - accès via service role uniquement
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Ajouter 'newsletter' au type email_logs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'email_logs_email_type_check'
    AND table_name = 'email_logs'
  ) THEN
    ALTER TABLE email_logs DROP CONSTRAINT email_logs_email_type_check;
    ALTER TABLE email_logs ADD CONSTRAINT email_logs_email_type_check
      CHECK (email_type IN (
        'provider_incomplete_profile',
        'couple_incomplete_profile',
        'inactivity_reminder',
        'pending_requests_reminder',
        'onboarding_complete',
        'welcome',
        'new_message',
        'new_request',
        'request_accepted',
        'request_rejected',
        'new_devis',
        'provider_low_completion',
        'vendor_invitation',
        'newsletter'
      ));
  END IF;
END $$;
