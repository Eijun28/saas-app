-- ============================================================================
-- Migration 054: Vendor (Prestataire) Invitation System
-- Permet d'inviter des prestataires sur la plateforme via lien unique
-- Réduit la friction d'onboarding et évite les problèmes de spam email
-- ============================================================================

-- Table des invitations prestataires
CREATE TABLE IF NOT EXISTS vendor_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Qui invite
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_by_role TEXT CHECK (invited_by_role IN ('admin', 'couple', 'prestataire')),

  -- Informations du prestataire invité (pré-remplies)
  email TEXT NOT NULL,
  nom_entreprise TEXT,
  prenom TEXT,
  nom TEXT,
  service_type TEXT,
  message TEXT CHECK (char_length(message) <= 1000),

  -- Token d'invitation
  invitation_token TEXT NOT NULL UNIQUE,
  invitation_expires_at TIMESTAMPTZ NOT NULL,

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),

  -- Tracking
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ,          -- Premier clic sur le lien
  viewed_count INTEGER DEFAULT 0,  -- Nombre de fois que le lien a été ouvert

  -- Canal d'envoi (pour analytics)
  channel TEXT DEFAULT 'email'
    CHECK (channel IN ('email', 'link', 'qr_code', 'whatsapp', 'sms')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par token
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_invitations_token
  ON vendor_invitations(invitation_token);

-- Index pour recherche par email
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_email
  ON vendor_invitations(email);

-- Index pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_status
  ON vendor_invitations(status) WHERE status = 'pending';

-- Index pour lister les invitations d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_vendor_invitations_invited_by
  ON vendor_invitations(invited_by);

-- RLS
ALTER TABLE vendor_invitations ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
CREATE POLICY vendor_invitations_admin_all ON vendor_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Les utilisateurs peuvent voir leurs propres invitations envoyées
CREATE POLICY vendor_invitations_select_own ON vendor_invitations
  FOR SELECT
  USING (invited_by = auth.uid());

-- Les utilisateurs authentifiés peuvent créer des invitations
CREATE POLICY vendor_invitations_insert ON vendor_invitations
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Fonction pour auto-expirer les invitations
CREATE OR REPLACE FUNCTION expire_vendor_invitations()
RETURNS void AS $$
BEGIN
  UPDATE vendor_invitations
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND invitation_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_vendor_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_invitations_updated_at
  BEFORE UPDATE ON vendor_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_invitations_updated_at();
