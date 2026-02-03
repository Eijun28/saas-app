// types/billing.ts
// Types pour le système de facturation et génération de devis PDF

/**
 * Statuts possibles pour une demande de consentement
 */
export type BillingConsentStatus = 'pending' | 'approved' | 'rejected'

/**
 * Demande de consentement pour accès aux infos de facturation
 */
export interface BillingConsentRequest {
  id: string
  conversation_id: string
  prestataire_id: string
  couple_id: string
  status: BillingConsentStatus
  requested_at: string
  responded_at: string | null
  expires_at: string
  created_at: string
  updated_at: string
  // Relations optionnelles (pour les joins)
  couple?: {
    id: string
    partner_1_name: string | null
    partner_2_name: string | null
  }
  prestataire?: {
    id: string
    prenom: string | null
    nom: string | null
    business_name: string | null
  }
}

/**
 * Informations de facturation du couple
 */
export interface CoupleBillingInfo {
  id: string
  couple_id: string
  nom_complet: string
  adresse: string
  code_postal: string | null
  ville: string | null
  pays: string
  email_facturation: string | null
  telephone: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload pour créer/mettre à jour les infos de facturation du couple
 */
export interface CoupleBillingInfoPayload {
  nom_complet: string
  adresse: string
  code_postal?: string
  ville?: string
  pays?: string
  email_facturation?: string
  telephone?: string
}

/**
 * Informations bancaires du prestataire (pour les devis/factures)
 */
export interface PrestataireBankingInfo {
  id: string
  prestataire_id: string
  // Infos bancaires
  iban: string | null
  bic: string | null
  nom_banque: string | null
  nom_titulaire: string | null
  adresse_banque: string | null
  // Infos fiscales
  siret: string | null
  siren: string | null
  tva_number: string | null
  forme_juridique: string | null
  adresse_siege: string | null
  code_ape: string | null
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Devis avec informations PDF
 */
export interface DevisWithPdf {
  id: string
  demande_id: string | null
  prestataire_id: string
  couple_id: string
  devis_number: string
  amount: number
  title: string | null
  description: string | null
  details: string | null
  currency: string
  included_services: string[] | null
  excluded_services: string[] | null
  conditions: string | null
  valid_until: string | null
  pdf_url: string
  attachment_url: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating'
  viewed_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  created_at: string
  updated_at: string
  // Relations optionnelles
  couple?: {
    id: string
    partner_1_name: string | null
    partner_2_name: string | null
  }
  prestataire?: {
    id: string
    prenom: string | null
    nom: string | null
    business_name: string | null
  }
}

/**
 * Payload pour créer un nouveau devis
 */
export interface CreateDevisPayload {
  conversation_id: string
  couple_id: string
  amount: number
  title: string
  description: string
  included_services?: string[]
  excluded_services?: string[]
  conditions?: string
  valid_until: string // ISO date string
}

/**
 * Données pour générer le PDF du devis
 */
export interface DevisPdfData {
  devisNumber: string
  createdAt: Date
  validUntil: Date

  // Prestataire
  prestataireName: string
  prestataireEmail: string
  prestataireSiret?: string
  prestataireTva?: string
  prestataireAddress?: string
  prestataireBankName?: string
  prestataireIban?: string
  prestataireBic?: string

  // Client
  clientName: string
  clientAddress: string
  clientEmail?: string
  clientPhone?: string

  // Contenu du devis
  title: string
  description: string
  amount: number
  currency: string
  includedServices: string[]
  excludedServices: string[]
  conditions?: string
}

/**
 * Réponse de l'API de génération de devis
 */
export interface CreateDevisResponse {
  success: boolean
  devis: DevisWithPdf
  pdfUrl: string
}

/**
 * Réponse de l'API de vérification de consentement
 */
export interface ConsentStatusResponse {
  hasConsent: boolean
  status: BillingConsentStatus | null
  consentRequest: BillingConsentRequest | null
  needsBillingInfo: boolean
}

// ============================================
// DEVIS TEMPLATES
// ============================================

/**
 * Template de devis réutilisable
 */
export interface DevisTemplate {
  id: string
  prestataire_id: string
  name: string
  description: string | null
  is_default: boolean
  title_template: string
  description_template: string | null
  default_amount: number | null
  currency: string
  included_services: string[]
  excluded_services: string[]
  conditions: string | null
  validity_days: number
  use_count: number
  created_at: string
  updated_at: string
}

/**
 * Payload pour créer/modifier un template
 */
export interface DevisTemplatePayload {
  name: string
  description?: string
  is_default?: boolean
  title_template: string
  description_template?: string
  default_amount?: number
  currency?: string
  included_services?: string[]
  excluded_services?: string[]
  conditions?: string
  validity_days?: number
}

// ============================================
// FACTURES (INVOICES)
// ============================================

/**
 * Statuts possibles pour une facture
 */
export type FactureStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

/**
 * Facture complète
 */
export interface Facture {
  id: string
  devis_id: string | null
  prestataire_id: string
  couple_id: string
  facture_number: string
  title: string
  description: string | null
  amount_ht: number
  tva_rate: number
  amount_tva: number
  amount_ttc: number
  currency: string
  included_services: string[]
  conditions: string | null
  payment_terms: string | null
  issue_date: string
  due_date: string | null
  paid_date: string | null
  status: FactureStatus
  pdf_url: string | null
  created_at: string
  updated_at: string
  // Relations
  couple?: {
    id: string
    partner_1_name: string | null
    partner_2_name: string | null
  }
  devis?: DevisWithPdf
}

/**
 * Payload pour créer une facture
 */
export interface CreateFacturePayload {
  devis_id?: string
  couple_id: string
  title: string
  description?: string
  amount_ht: number
  tva_rate?: number
  included_services?: string[]
  conditions?: string
  payment_terms?: string
  due_date?: string
}

// ============================================
// PROVIDER DEVIS SETTINGS
// ============================================

/**
 * Paramètres de devis du prestataire
 */
export interface ProviderDevisSettings {
  id: string
  prestataire_id: string
  default_validity_days: number
  default_conditions: string | null
  default_payment_terms: string | null
  is_subject_to_tva: boolean
  default_tva_rate: number
  devis_prefix: string
  facture_prefix: string
  next_devis_number: number
  next_facture_number: number
  send_reminder_before_expiry: boolean
  reminder_days_before: number
  show_iban_on_devis: boolean
  show_iban_on_facture: boolean
  custom_logo_url: string | null
  header_text: string | null
  footer_text: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload pour mettre à jour les paramètres
 */
export interface ProviderDevisSettingsPayload {
  default_validity_days?: number
  default_conditions?: string
  default_payment_terms?: string
  is_subject_to_tva?: boolean
  default_tva_rate?: number
  devis_prefix?: string
  facture_prefix?: string
  send_reminder_before_expiry?: boolean
  reminder_days_before?: number
  show_iban_on_devis?: boolean
  show_iban_on_facture?: boolean
  custom_logo_url?: string
  header_text?: string
  footer_text?: string
}

// ============================================
// QUICK DEVIS GENERATION
// ============================================

/**
 * Couple avec infos pour sélection rapide
 */
export interface CoupleForDevis {
  id: string
  partner_1_name: string | null
  partner_2_name: string | null
  wedding_date: string | null
  has_billing_info: boolean
  has_consent: boolean
  conversation_id?: string
}

/**
 * Payload pour génération rapide de devis
 */
export interface QuickDevisPayload {
  couple_id: string
  template_id?: string
  amount: number
  title: string
  description: string
  included_services?: string[]
  excluded_services?: string[]
  conditions?: string
  validity_days?: number
}
