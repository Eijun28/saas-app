-- Migration: Create referral/parrainage system for providers
-- Each provider gets a unique referral code they can share
-- New providers can enter a referral code at signup

-- Table to store referral codes and track referrals
CREATE TABLE IF NOT EXISTS provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The provider who owns this referral code
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Unique referral code (e.g., NUPLY-XXXX)
  referral_code TEXT NOT NULL UNIQUE,
  -- Stats
  total_referrals INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT provider_referrals_provider_unique UNIQUE (provider_id)
);

-- Table to track individual referral usages
CREATE TABLE IF NOT EXISTS referral_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The referral code used
  referral_code TEXT NOT NULL REFERENCES provider_referrals(referral_code) ON DELETE CASCADE,
  -- The provider who referred (owner of the code)
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The new user who signed up with the code
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT referral_usages_referred_unique UNIQUE (referred_user_id)
);

-- RLS policies
ALTER TABLE provider_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_usages ENABLE ROW LEVEL SECURITY;

-- Providers can read their own referral code
CREATE POLICY "providers_read_own_referral"
  ON provider_referrals FOR SELECT
  USING (auth.uid() = provider_id);

-- Providers can update their own referral stats (via triggers)
CREATE POLICY "providers_update_own_referral"
  ON provider_referrals FOR UPDATE
  USING (auth.uid() = provider_id);

-- Anyone can read referral codes (needed to validate at signup)
CREATE POLICY "anyone_can_validate_referral_code"
  ON provider_referrals FOR SELECT
  USING (true);

-- Referral usages: users can see their own
CREATE POLICY "users_read_own_referral_usage"
  ON referral_usages FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Service role can insert referral usages
CREATE POLICY "service_role_insert_referral_usage"
  ON referral_usages FOR INSERT
  WITH CHECK (true);

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code like NUPLY-XXXX (4 alphanumeric chars)
    new_code := 'NUPLY-' || upper(substring(md5(random()::text) from 1 for 5));
    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM provider_referrals WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create referral code for new providers
CREATE OR REPLACE FUNCTION create_provider_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create for prestataire role
  IF NEW.role = 'prestataire' THEN
    INSERT INTO provider_referrals (provider_id, referral_code)
    VALUES (NEW.id, generate_referral_code())
    ON CONFLICT (provider_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create referral code when a prestataire profile is created
CREATE TRIGGER trigger_create_referral_code
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_provider_referral_code();

-- Generate referral codes for existing providers
INSERT INTO provider_referrals (provider_id, referral_code)
SELECT id, generate_referral_code()
FROM profiles
WHERE role = 'prestataire'
ON CONFLICT (provider_id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_referrals_code ON provider_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_usages_referrer ON referral_usages(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_usages_referred ON referral_usages(referred_user_id);
