-- ============================================================================
-- STEP 2/4 : Uniformiser les FK prestataire (auth.users -> profiles)
-- Priorite: IMPORTANTE
-- Impact: Coherence relationnelle. Aucun changement de donnees car
--         profiles.id = auth.users.id (meme UUID).
-- ============================================================================

-- -------------------------------------------------------
-- 2.1 devis_templates.prestataire_id : auth.users(id) -> profiles(id)
-- -------------------------------------------------------
DO $$
BEGIN
  -- Drop l'ancienne FK vers auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'devis_templates_prestataire_id_fkey'
      AND table_name = 'devis_templates'
  ) THEN
    ALTER TABLE public.devis_templates
      DROP CONSTRAINT devis_templates_prestataire_id_fkey;
    RAISE NOTICE 'Dropped devis_templates_prestataire_id_fkey (auth.users)';
  END IF;

  -- Cree la nouvelle FK vers profiles
  ALTER TABLE public.devis_templates
    ADD CONSTRAINT devis_templates_prestataire_id_fkey
    FOREIGN KEY (prestataire_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Created devis_templates_prestataire_id_fkey -> profiles(id)';
END $$;

-- -------------------------------------------------------
-- 2.2 provider_devis_settings.prestataire_id : auth.users(id) -> profiles(id)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'provider_devis_settings_prestataire_id_fkey'
      AND table_name = 'provider_devis_settings'
  ) THEN
    ALTER TABLE public.provider_devis_settings
      DROP CONSTRAINT provider_devis_settings_prestataire_id_fkey;
    RAISE NOTICE 'Dropped provider_devis_settings_prestataire_id_fkey (auth.users)';
  END IF;

  ALTER TABLE public.provider_devis_settings
    ADD CONSTRAINT provider_devis_settings_prestataire_id_fkey
    FOREIGN KEY (prestataire_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Created provider_devis_settings_prestataire_id_fkey -> profiles(id)';
END $$;

-- -------------------------------------------------------
-- 2.3 provider_referrals.provider_id : auth.users(id) -> profiles(id)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'provider_referrals_provider_id_fkey'
      AND table_name = 'provider_referrals'
  ) THEN
    ALTER TABLE public.provider_referrals
      DROP CONSTRAINT provider_referrals_provider_id_fkey;
    RAISE NOTICE 'Dropped provider_referrals_provider_id_fkey (auth.users)';
  END IF;

  ALTER TABLE public.provider_referrals
    ADD CONSTRAINT provider_referrals_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Created provider_referrals_provider_id_fkey -> profiles(id)';
END $$;

-- -------------------------------------------------------
-- 2.4 requests.provider_id : auth.users(id) -> profiles(id)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'requests_provider_id_fkey'
      AND table_name = 'requests'
  ) THEN
    ALTER TABLE public.requests
      DROP CONSTRAINT requests_provider_id_fkey;
    RAISE NOTICE 'Dropped requests_provider_id_fkey (auth.users)';
  END IF;

  ALTER TABLE public.requests
    ADD CONSTRAINT requests_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  RAISE NOTICE 'Created requests_provider_id_fkey -> profiles(id)';
END $$;

-- -------------------------------------------------------
-- 2.5 referral_usages.referrer_id et referred_user_id : auth.users(id) -> profiles(id)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'referral_usages_referrer_id_fkey'
      AND table_name = 'referral_usages'
  ) THEN
    ALTER TABLE public.referral_usages
      DROP CONSTRAINT referral_usages_referrer_id_fkey;
  END IF;

  ALTER TABLE public.referral_usages
    ADD CONSTRAINT referral_usages_referrer_id_fkey
    FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'referral_usages_referred_user_id_fkey'
      AND table_name = 'referral_usages'
  ) THEN
    ALTER TABLE public.referral_usages
      DROP CONSTRAINT referral_usages_referred_user_id_fkey;
  END IF;

  ALTER TABLE public.referral_usages
    ADD CONSTRAINT referral_usages_referred_user_id_fkey
    FOREIGN KEY (referred_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

  RAISE NOTICE 'Unified referral_usages FKs -> profiles(id)';
END $$;
