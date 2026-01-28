-- Migration: Triggers pour notifications email automatiques
-- Date: 2025-01
-- Description: Ajoute des triggers pour envoyer des emails lors de la création de devis
--              Note: Les autres notifications (demandes, messages) sont gérées côté application

-- ============================================
-- TRIGGER: Envoi email lors de création devis
-- ============================================
-- Note: Ce trigger appelle une fonction Edge qui envoie l'email
-- Pour l'instant, on crée juste la structure. L'appel réel se fera côté application
-- car Resend nécessite une clé API qui ne peut pas être utilisée directement dans SQL

-- Fonction pour logger la création d'un devis (pour déclencher l'email côté app)
CREATE OR REPLACE FUNCTION notify_devis_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction peut être utilisée pour déclencher un webhook ou une notification
  -- Pour l'instant, l'envoi d'email se fait directement dans l'application
  -- après l'insertion du devis
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la création de devis
DROP TRIGGER IF EXISTS trigger_devis_created ON public.devis;
CREATE TRIGGER trigger_devis_created
  AFTER INSERT ON public.devis
  FOR EACH ROW
  EXECUTE FUNCTION notify_devis_created();

-- Note: L'envoi d'email réel se fait dans l'application après l'insertion
-- Voir lib/email/notifications.ts -> sendNewDevisEmail()
