DO $$
BEGIN
  ALTER TABLE email_logs
  DROP CONSTRAINT IF EXISTS valid_email_type;

  ALTER TABLE email_logs
  ADD CONSTRAINT valid_email_type CHECK (
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
      'new_devis',
      'provider_low_completion'
    )
  );
END $$;
