-- Script pour corriger les permissions RLS de early_adopter_program
-- À exécuter dans Supabase SQL Editor

-- Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Program config viewable by authenticated" ON early_adopter_program;

-- Créer une nouvelle politique qui permet la lecture publique
-- (Les données sont non sensibles - juste le nombre de places disponibles)
CREATE POLICY "Program config viewable by all"
  ON early_adopter_program FOR SELECT
  USING (true);

-- Vérifier que la table est bien accessible
-- Cette requête devrait fonctionner maintenant
SELECT total_slots, used_slots, program_active 
FROM early_adopter_program;
