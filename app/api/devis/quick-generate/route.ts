// app/api/devis/quick-generate/route.ts
// API pour générer un devis rapidement sans contexte de conversation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { generateDevisPdf } from '@/lib/pdf/devis-generator'
import type { DevisPdfData } from '@/types/billing'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'

// Schema de validation
const quickDevisSchema = z.object({
  couple_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  amount: z.number().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  included_services: z.array(z.string()).optional().default([]),
  excluded_services: z.array(z.string()).optional().default([]),
  conditions: z.string().optional(),
  validity_days: z.number().int().positive().optional().default(30),
  notes: z.string().optional(),
})

/**
 * POST - Génération rapide de devis (sans conversation)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le plan (PDF requiert Pro ou supérieur)
    const subscriptionCheck = await checkSubscriptionAccess(user.id, 'pro')
    if (!subscriptionCheck.authorized) {
      return subscriptionCheck.response
    }

    // Vérifier que l'utilisateur est un prestataire
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, prenom, nom, email, business_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'prestataire') {
      return NextResponse.json(
        { error: 'Seuls les prestataires peuvent créer des devis' },
        { status: 403 }
      )
    }

    // Parser et valider le body
    const body = await request.json()
    const validation = quickDevisSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Vérifier que le couple existe et a des infos de facturation
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner_1_name, partner_2_name')
      .eq('id', data.couple_id)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple non trouvé' }, { status: 404 })
    }

    // Récupérer les infos de facturation du couple
    const { data: coupleBilling } = await supabase
      .from('couple_billing_info')
      .select('*')
      .eq('couple_id', data.couple_id)
      .single()

    if (!coupleBilling) {
      return NextResponse.json(
        {
          error: 'Le couple n\'a pas renseigné ses informations de facturation',
          needsBillingInfo: true
        },
        { status: 400 }
      )
    }

    // Récupérer les infos bancaires du prestataire
    const { data: bankingInfo } = await supabase
      .from('prestataire_banking_info')
      .select('*')
      .eq('prestataire_id', user.id)
      .single()

    // Récupérer les paramètres de devis du prestataire
    const { data: devisSettings } = await supabase
      .from('provider_devis_settings')
      .select('*')
      .eq('prestataire_id', user.id)
      .single()

    // Si un template est utilisé, incrémenter son compteur d'utilisation
    if (data.template_id) {
      await supabase
        .from('devis_templates')
        .update({ use_count: supabase.rpc('increment_use_count') })
        .eq('id', data.template_id)
        .eq('prestataire_id', user.id)
    }

    // Générer le numéro de devis
    const { data: devisNumber } = await supabase.rpc('generate_devis_number', {
      p_prestataire_id: user.id,
    })
    const finalDevisNumber = devisNumber || `DEV-${new Date().getFullYear()}-${Date.now()}`

    // Calculer la date de validité
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + (data.validity_days || devisSettings?.default_validity_days || 30))

    // Préparer les données pour le PDF
    const prestataireName = profile.business_name || `${profile.prenom} ${profile.nom}`
    const conditions = data.conditions || devisSettings?.default_conditions || undefined

    const pdfData: DevisPdfData = {
      devisNumber: finalDevisNumber,
      createdAt: new Date(),
      validUntil: validUntil,

      // Prestataire
      prestataireName,
      prestataireEmail: profile.email || '',
      prestataireSiret: bankingInfo?.siret || undefined,
      prestataireTva: bankingInfo?.tva_number || undefined,
      prestataireAddress: bankingInfo?.adresse_siege || undefined,
      prestataireBankName: bankingInfo?.nom_banque || undefined,
      prestataireIban: devisSettings?.show_iban_on_devis ? bankingInfo?.iban : undefined,
      prestataireBic: devisSettings?.show_iban_on_devis ? bankingInfo?.bic : undefined,

      // Client
      clientName: coupleBilling.nom_complet,
      clientAddress: `${coupleBilling.adresse}${coupleBilling.code_postal ? ', ' + coupleBilling.code_postal : ''}${coupleBilling.ville ? ' ' + coupleBilling.ville : ''}`,
      clientEmail: coupleBilling.email_facturation || undefined,
      clientPhone: coupleBilling.telephone || undefined,

      // Contenu
      title: data.title,
      description: data.description,
      amount: data.amount,
      currency: 'EUR',
      includedServices: data.included_services,
      excludedServices: data.excluded_services,
      conditions: conditions,
    }

    // Générer le PDF
    const pdfBytes = await generateDevisPdf(pdfData)

    // Upload vers Supabase Storage
    const fileName = `devis-${finalDevisNumber.replace(/\//g, '-')}-${Date.now()}.pdf`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('devis-pdfs')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      logger.error('Erreur upload PDF:', uploadError)
    }

    // Récupérer l'URL publique du PDF
    const { data: urlData } = supabase.storage.from('devis-pdfs').getPublicUrl(filePath)
    const pdfUrl = urlData?.publicUrl || null

    // Créer l'entrée dans la table devis
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .insert({
        prestataire_id: user.id,
        couple_id: data.couple_id,
        devis_number: finalDevisNumber,
        amount: data.amount,
        title: data.title,
        description: data.description,
        currency: 'EUR',
        included_services: data.included_services,
        excluded_services: data.excluded_services,
        conditions: conditions,
        valid_until: validUntil.toISOString().split('T')[0],
        pdf_url: pdfUrl,
        status: 'pending',
        template_id: data.template_id || null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (devisError) {
      logger.error('Erreur création devis:', devisError)
      return NextResponse.json({ error: 'Erreur lors de la création du devis' }, { status: 500 })
    }

    logger.info('Devis créé rapidement:', devis.id)

    return NextResponse.json({
      success: true,
      devis: {
        ...devis,
        couple_name: `${couple.partner_1_name || ''} & ${couple.partner_2_name || ''}`.trim(),
      },
      pdfUrl,
    })
  } catch (error) {
    logger.error('Erreur API devis quick-generate:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
