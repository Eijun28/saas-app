// app/api/devis/generate/route.ts
// API pour générer un devis PDF

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { generateDevisPdf } from '@/lib/pdf/devis-generator'
import type { DevisPdfData } from '@/types/billing'
import { checkSubscriptionAccess } from '@/lib/subscription-guard'

// Schema de validation
const createDevisSchema = z.object({
  conversation_id: z.string().uuid(),
  couple_id: z.string().uuid(),
  amount: z.number().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  included_services: z.array(z.string()).optional().default([]),
  excluded_services: z.array(z.string()).optional().default([]),
  conditions: z.string().optional(),
  valid_until: z.string(), // ISO date string
})

/**
 * POST - Générer un devis PDF
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

    // Parser et valider le body
    const body = await request.json()
    const validation = createDevisSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Vérifier que l'utilisateur est le prestataire de cette conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, provider_id, couple_id, request_id')
      .eq('id', data.conversation_id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation non trouvée' }, { status: 404 })
    }

    if (conversation.provider_id !== user.id) {
      return NextResponse.json(
        { error: 'Seul le prestataire peut créer un devis' },
        { status: 403 }
      )
    }

    // Vérifier le consentement
    const { data: consent } = await supabase
      .from('billing_consent_requests')
      .select('id, status')
      .eq('conversation_id', data.conversation_id)
      .eq('status', 'approved')
      .single()

    if (!consent) {
      return NextResponse.json(
        { error: 'Consentement requis avant de créer un devis' },
        { status: 403 }
      )
    }

    // Récupérer les infos du prestataire
    const { data: prestataire, error: prestaError } = await supabase
      .from('profiles')
      .select('id, prenom, nom, email, business_name')
      .eq('id', user.id)
      .single()

    if (prestaError || !prestataire) {
      return NextResponse.json({ error: 'Profil prestataire non trouvé' }, { status: 404 })
    }

    // Récupérer les infos bancaires du prestataire
    const { data: bankingInfo } = await supabase
      .from('prestataire_banking_info')
      .select('*')
      .eq('prestataire_id', user.id)
      .single()

    // Récupérer les infos de facturation du couple
    const { data: coupleBilling, error: billingError } = await supabase
      .from('couple_billing_info')
      .select('*')
      .eq('couple_id', data.couple_id)
      .single()

    if (billingError || !coupleBilling) {
      return NextResponse.json(
        { error: 'Infos de facturation du couple manquantes', needsBillingInfo: true },
        { status: 400 }
      )
    }

    // Générer le numéro de devis
    const { data: devisNumber } = await supabase.rpc('generate_devis_number')
    const finalDevisNumber = devisNumber || `DEV-${new Date().getFullYear()}-${Date.now()}`

    // Préparer les données pour le PDF
    const prestataireName = prestataire.business_name || `${prestataire.prenom} ${prestataire.nom}`

    const pdfData: DevisPdfData = {
      devisNumber: finalDevisNumber,
      createdAt: new Date(),
      validUntil: new Date(data.valid_until),

      // Prestataire
      prestataireName,
      prestataireEmail: prestataire.email || '',
      prestataireSiret: bankingInfo?.siret || undefined,
      prestataireTva: bankingInfo?.tva_number || undefined,
      prestataireAddress: bankingInfo?.adresse_siege || undefined,
      prestataireBankName: bankingInfo?.nom_banque || undefined,
      prestataireIban: bankingInfo?.iban || undefined,
      prestataireBic: bankingInfo?.bic || undefined,

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
      conditions: data.conditions,
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
      // Continuer même si l'upload échoue - on peut stocker le PDF différemment
    }

    // Récupérer l'URL publique du PDF
    const { data: urlData } = supabase.storage.from('devis-pdfs').getPublicUrl(filePath)

    const pdfUrl = urlData?.publicUrl || null

    // Créer l'entrée dans la table devis
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .insert({
        demande_id: conversation.request_id,
        prestataire_id: user.id,
        couple_id: data.couple_id,
        devis_number: finalDevisNumber,
        amount: data.amount,
        title: data.title,
        description: data.description,
        currency: 'EUR',
        included_services: data.included_services,
        excluded_services: data.excluded_services,
        conditions: data.conditions,
        valid_until: data.valid_until,
        pdf_url: pdfUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (devisError) {
      logger.error('Erreur création devis:', devisError)
      return NextResponse.json({ error: 'Erreur lors de la création du devis' }, { status: 500 })
    }

    logger.info('Devis créé:', devis.id)

    return NextResponse.json({
      success: true,
      devis,
      pdfUrl,
    })
  } catch (error) {
    logger.error('Erreur API devis generate:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
