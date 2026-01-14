-- Migration: Nettoyage des colonnes redondantes et suppression de la table d'archive
-- Date: 2025-01-13
-- Description: 
--   1. Migre les données de couples vers couple_preferences
--   2. Supprime les colonnes redondantes de couples
--   3. Supprime la table couples_archive_2026_01_05

-- ============================================
-- ÉTAPE 1: Migrer les données vers couple_preferences
-- ============================================

-- Fonction pour convertir planning_stage en onboarding_step
CREATE OR REPLACE FUNCTION map_planning_stage_to_onboarding_step(stage TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE stage
    WHEN 'just_engaged' THEN RETURN 0;
    WHEN 'planning_started' THEN RETURN 1;
    WHEN 'almost_ready' THEN RETURN 2;
    WHEN 'last_minute' THEN RETURN 3;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Migrer les données pour chaque couple qui n'a pas encore de couple_preferences
DO $$
DECLARE
  couple_record RECORD;
  prefs_record RECORD;
  cultural_prefs JSONB;
  service_priorities_json JSONB;
  budget_breakdown_json JSONB;
  wedding_desc TEXT;
BEGIN
  FOR couple_record IN 
    SELECT * FROM couples 
    WHERE EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couples' 
      AND column_name IN ('cultures', 'religions', 'cultural_requirements', 'wedding_style', 'ambiance', 'color_theme', 'services_needed', 'service_priorities', 'budget_flexibility', 'planning_stage', 'profile_completion')
    )
  LOOP
    -- Vérifier si couple_preferences existe déjà
    SELECT * INTO prefs_record 
    FROM couple_preferences 
    WHERE couple_id = couple_record.id;
    
    -- Construire cultural_preferences JSONB
    cultural_prefs := '{}'::JSONB;
    
    -- Ajouter religions si présentes
    IF couple_record.religions IS NOT NULL AND array_length(couple_record.religions, 1) > 0 THEN
      -- Prendre la première religion comme religious_ceremony
      cultural_prefs := cultural_prefs || jsonb_build_object(
        'religious_ceremony', couple_record.religions[1]
      );
      -- Ajouter toutes les religions dans un array
      cultural_prefs := cultural_prefs || jsonb_build_object(
        'religions', to_jsonb(couple_record.religions)
      );
    END IF;
    
    -- Ajouter cultural_requirements si présent
    IF couple_record.cultural_requirements IS NOT NULL AND couple_record.cultural_requirements != '' THEN
      cultural_prefs := cultural_prefs || jsonb_build_object(
        'cultural_requirements', couple_record.cultural_requirements
      );
    END IF;
    
    -- Construire wedding_description avec style, ambiance et color_theme
    wedding_desc := '';
    IF couple_record.wedding_style IS NOT NULL THEN
      wedding_desc := 'Style: ' || couple_record.wedding_style;
    END IF;
    IF couple_record.ambiance IS NOT NULL THEN
      IF wedding_desc != '' THEN wedding_desc := wedding_desc || ' | '; END IF;
      wedding_desc := wedding_desc || 'Ambiance: ' || couple_record.ambiance;
    END IF;
    IF couple_record.color_theme IS NOT NULL THEN
      IF wedding_desc != '' THEN wedding_desc := wedding_desc || ' | '; END IF;
      wedding_desc := wedding_desc || 'Couleurs: ' || couple_record.color_theme;
    END IF;
    
    -- Construire service_priorities JSONB
    service_priorities_json := '{}'::JSONB;
    IF couple_record.service_priorities IS NOT NULL AND array_length(couple_record.service_priorities, 1) > 0 THEN
      -- Convertir array en JSONB object avec 'medium' comme valeur par défaut
      FOR i IN 1..array_length(couple_record.service_priorities, 1) LOOP
        service_priorities_json := service_priorities_json || jsonb_build_object(
          couple_record.service_priorities[i], 'medium'
        );
      END LOOP;
    END IF;
    
    -- Construire budget_breakdown JSONB avec budget_flexibility
    budget_breakdown_json := '{}'::JSONB;
    IF couple_record.budget_flexibility IS NOT NULL THEN
      budget_breakdown_json := budget_breakdown_json || jsonb_build_object(
        'flexibility', couple_record.budget_flexibility
      );
    END IF;
    IF couple_record.budget_min IS NOT NULL OR couple_record.budget_max IS NOT NULL THEN
      budget_breakdown_json := budget_breakdown_json || jsonb_build_object(
        'total', jsonb_build_object(
          'min', COALESCE(couple_record.budget_min, 0),
          'max', COALESCE(couple_record.budget_max, 0)
        )
      );
    END IF;
    
    IF prefs_record IS NULL THEN
      -- Créer couple_preferences s'il n'existe pas
      INSERT INTO couple_preferences (
        couple_id,
        -- Cultures: stocker dans cultural_preferences car secondary_culture_ids est UUID[]
        cultural_preferences,
        -- Services: mettre tous dans essential_services pour l'instant
        essential_services,
        service_priorities,
        wedding_description,
        budget_breakdown,
        completion_percentage,
        onboarding_step,
        profile_completed,
        created_at,
        updated_at
      ) VALUES (
        couple_record.id,
        -- Stocker cultures dans cultural_preferences comme JSONB
        CASE 
          WHEN couple_record.cultures IS NOT NULL AND array_length(couple_record.cultures, 1) > 0 THEN
            cultural_prefs || jsonb_build_object('cultures', to_jsonb(couple_record.cultures))
          ELSE
            cultural_prefs
        END,
        COALESCE(couple_record.services_needed, ARRAY[]::TEXT[]),
        service_priorities_json,
        NULLIF(wedding_desc, ''),
        budget_breakdown_json,
        COALESCE(couple_record.profile_completion, 0),
        map_planning_stage_to_onboarding_step(couple_record.planning_stage),
        COALESCE(couple_record.profile_completion, 0) >= 80,
        couple_record.created_at,
        couple_record.updated_at
      );
    ELSE
      -- Mettre à jour couple_preferences existant
      UPDATE couple_preferences SET
        cultural_preferences = CASE 
          WHEN couple_record.cultures IS NOT NULL AND array_length(couple_record.cultures, 1) > 0 THEN
            COALESCE(cultural_preferences, '{}'::JSONB) || jsonb_build_object('cultures', to_jsonb(couple_record.cultures)) || cultural_prefs
          ELSE
            COALESCE(cultural_preferences, '{}'::JSONB) || cultural_prefs
        END,
        essential_services = COALESCE(couple_record.services_needed, essential_services),
        service_priorities = CASE 
          WHEN service_priorities_json != '{}'::JSONB THEN service_priorities_json
          ELSE service_priorities
        END,
        wedding_description = COALESCE(NULLIF(wedding_desc, ''), wedding_description),
        budget_breakdown = CASE 
          WHEN budget_breakdown_json != '{}'::JSONB THEN budget_breakdown_json
          ELSE budget_breakdown
        END,
        completion_percentage = COALESCE(couple_record.profile_completion, completion_percentage),
        onboarding_step = CASE 
          WHEN couple_record.planning_stage IS NOT NULL THEN map_planning_stage_to_onboarding_step(couple_record.planning_stage)
          ELSE onboarding_step
        END,
        profile_completed = COALESCE(couple_record.profile_completion, completion_percentage) >= 80,
        updated_at = NOW()
      WHERE couple_id = couple_record.id;
    END IF;
  END LOOP;
END $$;

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS map_planning_stage_to_onboarding_step(TEXT);

-- ============================================
-- ÉTAPE 2: Supprimer les colonnes redondantes de couples
-- ============================================

-- Supprimer les colonnes redondantes si elles existent
DO $$
BEGIN
  -- Supprimer cultures
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'cultures'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS cultures;
    RAISE NOTICE 'Colonne cultures supprimée';
  END IF;

  -- Supprimer religions
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'religions'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS religions;
    RAISE NOTICE 'Colonne religions supprimée';
  END IF;

  -- Supprimer cultural_requirements
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'cultural_requirements'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS cultural_requirements;
    RAISE NOTICE 'Colonne cultural_requirements supprimée';
  END IF;

  -- Supprimer wedding_style
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'wedding_style'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS wedding_style;
    RAISE NOTICE 'Colonne wedding_style supprimée';
  END IF;

  -- Supprimer ambiance
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'ambiance'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS ambiance;
    RAISE NOTICE 'Colonne ambiance supprimée';
  END IF;

  -- Supprimer color_theme
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'color_theme'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS color_theme;
    RAISE NOTICE 'Colonne color_theme supprimée';
  END IF;

  -- Supprimer services_needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'services_needed'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS services_needed;
    RAISE NOTICE 'Colonne services_needed supprimée';
  END IF;

  -- Supprimer service_priorities
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'service_priorities'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS service_priorities;
    RAISE NOTICE 'Colonne service_priorities supprimée';
  END IF;

  -- Supprimer budget_flexibility
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'budget_flexibility'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS budget_flexibility;
    RAISE NOTICE 'Colonne budget_flexibility supprimée';
  END IF;

  -- Supprimer planning_stage
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'planning_stage'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS planning_stage;
    RAISE NOTICE 'Colonne planning_stage supprimée';
  END IF;

  -- Supprimer profile_completion
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couples' AND column_name = 'profile_completion'
  ) THEN
    ALTER TABLE couples DROP COLUMN IF EXISTS profile_completion;
    RAISE NOTICE 'Colonne profile_completion supprimée';
  END IF;
END $$;

-- ============================================
-- ÉTAPE 3: Supprimer la table d'archive
-- ============================================

-- Supprimer la table d'archive si elle existe
DROP TABLE IF EXISTS public.couples_archive_2026_01_05;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 016 terminée avec succès : colonnes redondantes supprimées et données migrées vers couple_preferences';
END $$;
