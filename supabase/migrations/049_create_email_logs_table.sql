-- Table pour tracker les emails envoyés (éviter les doublons de relances)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  reminder_number INTEGER,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT valid_email_type CHECK (
    email_type IN (
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
      'new_devis'
    )
  )
);

-- Index pour rechercher rapidement les emails d'un utilisateur
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_type_user ON email_logs(email_type, user_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);

-- RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Seul le service role peut lire/écrire (pas d'accès utilisateur)
CREATE POLICY "Service role only" ON email_logs
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE email_logs IS 'Historique des emails envoyés pour éviter les doublons';
