// app/api/devis/[id]/verify-signature/route.ts
// Vérifie l'OTP et finalise la signature électronique du devis

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { createHash } from 'crypto'
import { generateDevisPdf } from '@/lib/pdf/devis-generator'
import { sendEmail } from '@/lib/email/resend'
import { generateEmailTemplate, generateContentBlock, escapeHtml } from '@/lib/email/templates'
import type { DevisPdfData } from '@/types/billing'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const MAX_OTP_ATTEMPTS = 3

const verifySchema = z.object({
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres'),
})

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

/**
 * POST /api/devis/[id]/verify-signature
 * Vérifie le code OTP et signe le devis électroniquement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: devisId } = await params
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Parse + validate body
    const body = await request.json()
    const validation = verifySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Code invalide (6 chiffres requis)' }, { status: 400 })
    }

    const { otp } = validation.data

    // Récupérer le couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner_1_name, partner_2_name, email')
      .eq('user_id', user.id)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Profil couple non trouvé' }, { status: 404 })
    }

    // Récupérer le devis avec tous les champs nécessaires pour le PDF
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select(
        'id, couple_id, prestataire_id, amount, title, description, currency, included_services, excluded_services, conditions, valid_until, devis_number, created_at'
      )
      .eq('id', devisId)
      .single()

    if (devisError || !devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    if (devis.couple_id !== couple.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Vérifier statut (il faut relire avec admin pour avoir le champ status)
    const adminClient = createAdminClient()
    const { data: devisStatus } = await adminClient
      .from('devis')
      .select('status')
      .eq('id', devisId)
      .single()

    if (devisStatus?.status !== 'pending') {
      return NextResponse.json({ error: 'Ce devis ne peut plus être signé' }, { status: 400 })
    }

    // Récupérer l'enregistrement OTP
    const { data: sigRecord, error: sigError } = await adminClient
      .from('devis_signatures')
      .select('id, otp_hash, otp_expires_at, otp_attempts')
      .eq('devis_id', devis.id)
      .eq('couple_id', couple.id)
      .is('signed_at', null)
      .single()

    if (sigError || !sigRecord) {
      return NextResponse.json(
        {
          error: 'Aucun code de signature en cours. Veuillez en demander un nouveau.',
        },
        { status: 400 }
      )
    }

    // Vérifier expiration
    if (new Date(sigRecord.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code expiré. Veuillez en demander un nouveau.' },
        { status: 400 }
      )
    }

    // Vérifier le nombre de tentatives
    if (sigRecord.otp_attempts >= MAX_OTP_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Trop de tentatives incorrectes. Veuillez demander un nouveau code.' },
        { status: 429 }
      )
    }

    // Vérifier le code OTP
    const submittedHash = hashOtp(otp)
    if (submittedHash !== sigRecord.otp_hash) {
      await adminClient
        .from('devis_signatures')
        .update({ otp_attempts: sigRecord.otp_attempts + 1 })
        .eq('id', sigRecord.id)

      const remaining = MAX_OTP_ATTEMPTS - sigRecord.otp_attempts - 1
      return NextResponse.json(
        {
          error: `Code incorrect. ${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`,
          attemptsRemaining: remaining,
        },
        { status: 400 }
      )
    }

    // Code correct — extraire IP et User-Agent
    const signerIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const signerUserAgent = request.headers.get('user-agent') || 'unknown'
    const signedAt = new Date()

    // Récupérer toutes les infos pour le PDF signé
    const [
      { data: prestataire },
      { data: bankingInfo },
      { data: coupleBilling },
    ] = await Promise.all([
      adminClient
        .from('profiles')
        .select('prenom, nom, nom_entreprise, email')
        .eq('id', devis.prestataire_id)
        .single(),
      adminClient
        .from('prestataire_banking_info')
        .select('siret, tva_number, adresse_siege, nom_banque, iban, bic')
        .eq('prestataire_id', devis.prestataire_id)
        .single(),
      adminClient
        .from('couple_billing_info')
        .select('nom_complet, adresse, code_postal, ville, email_facturation, telephone')
        .eq('couple_id', devis.couple_id)
        .single(),
    ])

    type PrestataireData = {
      nom_entreprise?: string | null
      prenom?: string | null
      nom?: string | null
      email?: string | null
    }
    type BankingData = {
      siret?: string | null
      tva_number?: string | null
      adresse_siege?: string | null
      nom_banque?: string | null
      iban?: string | null
      bic?: string | null
    }
    type CoupleBillingData = {
      nom_complet: string
      adresse: string
      code_postal?: string | null
      ville?: string | null
      email_facturation?: string | null
      telephone?: string | null
    }

    const p = prestataire as PrestataireData | null
    const b = bankingInfo as BankingData | null
    const cb = coupleBilling as CoupleBillingData | null

    const prestataireName =
      p?.nom_entreprise || `${p?.prenom || ''} ${p?.nom || ''}`.trim() || 'Prestataire'
    const coupleName = [couple.partner_1_name, couple.partner_2_name].filter(Boolean).join(' et ')

    // Regénérer le PDF avec la page de signature
    let signedPdfUrl: string | null = null

    try {
      const pdfData: DevisPdfData = {
        devisNumber: devis.devis_number,
        createdAt: devis.created_at ? new Date(devis.created_at) : new Date(),
        validUntil: devis.valid_until ? new Date(devis.valid_until) : new Date(),
        prestataireName,
        prestataireEmail: p?.email || '',
        prestataireSiret: b?.siret || undefined,
        prestataireTva: b?.tva_number || undefined,
        prestataireAddress: b?.adresse_siege || undefined,
        prestataireBankName: b?.nom_banque || undefined,
        prestataireIban: b?.iban || undefined,
        prestataireBic: b?.bic || undefined,
        clientName: cb?.nom_complet || coupleName,
        clientAddress: cb
          ? `${cb.adresse}${cb.code_postal ? ', ' + cb.code_postal : ''}${cb.ville ? ' ' + cb.ville : ''}`
          : '',
        clientEmail: cb?.email_facturation || undefined,
        clientPhone: cb?.telephone || undefined,
        title: devis.title || '',
        description: devis.description || '',
        amount: devis.amount,
        currency: devis.currency || 'EUR',
        includedServices: (devis.included_services as string[]) || [],
        excludedServices: (devis.excluded_services as string[]) || [],
        conditions: devis.conditions || undefined,
        signatureInfo: {
          signedAt,
          signerName: coupleName,
          signerIp,
        },
      }

      const pdfBytes = await generateDevisPdf(pdfData)
      const fileName = `devis-signe-${devis.devis_number.replace(/[/\\]/g, '-')}-${Date.now()}.pdf`
      const filePath = `${devis.prestataire_id}/${fileName}`

      const { error: uploadError } = await adminClient.storage
        .from('devis-pdfs')
        .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: false })

      if (!uploadError) {
        const { data: urlData } = adminClient.storage.from('devis-pdfs').getPublicUrl(filePath)
        signedPdfUrl = urlData?.publicUrl || null
      }
    } catch (pdfError) {
      // Non bloquant — le devis sera quand même marqué signé
      logger.error('Erreur génération PDF signé (non bloquant):', pdfError)
    }

    // Mettre à jour la signature et le statut du devis
    await Promise.all([
      adminClient
        .from('devis_signatures')
        .update({
          signed_at: signedAt.toISOString(),
          signer_ip: signerIp,
          signer_user_agent: signerUserAgent,
        })
        .eq('id', sigRecord.id),
      adminClient
        .from('devis')
        .update({
          status: 'accepted',
          accepted_at: signedAt.toISOString(),
          signed_at: signedAt.toISOString(),
          signer_name: coupleName,
          ...(signedPdfUrl ? { signed_pdf_url: signedPdfUrl } : {}),
        })
        .eq('id', devis.id),
    ])

    // Notifier le prestataire par email (non bloquant)
    try {
      const { data: prestataireProfile } = await adminClient
        .from('profiles')
        .select('email, prenom')
        .eq('id', devis.prestataire_id)
        .single()

      type PrestataireProfile = { email?: string | null; prenom?: string | null }
      const pp = prestataireProfile as PrestataireProfile | null

      if (pp?.email) {
        const amountFormatted = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(devis.amount)

        const html = generateEmailTemplate({
          title: '✅ Devis signé !',
          greeting: `Bonjour ${pp.prenom || ''}`,
          content: `
            <p style="font-size: 16px; margin-bottom: 20px;">
              <strong>${escapeHtml(coupleName)}</strong> a signé votre devis électroniquement.
            </p>
            ${generateContentBlock(
              `<p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">
                 📋 ${escapeHtml(devis.title || 'Devis')}
               </p>
               <p style="margin: 0 0 4px 0; color: #047857; font-size: 20px; font-weight: 700;">
                 ${escapeHtml(amountFormatted)}
               </p>
               <p style="margin: 10px 0 0 0; font-size: 13px; color: #6B7280;">
                 Signé le ${signedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à ${signedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
               </p>`,
              '#10b981'
            )}
          `,
          buttonText: 'Voir dans la messagerie',
          buttonUrl: `${siteUrl}/prestataire/messagerie`,
          footer: `Le PDF signé est disponible dans votre espace messagerie.<br><br>L'équipe Nuply 💜`,
          hideUnsubscribe: true,
        })

        await sendEmail({
          to: pp.email,
          subject: `✅ ${coupleName} a signé votre devis !`,
          html,
        })
      }
    } catch (emailError) {
      logger.error('Erreur email prestataire post-signature (non bloquant):', emailError)
    }

    logger.info('Devis signé avec succès', { devisId: devis.id, coupleId: couple.id })

    return NextResponse.json({
      success: true,
      signedAt: signedAt.toISOString(),
      signedPdfUrl,
    })
  } catch (error) {
    logger.error('Erreur API devis verify-signature:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
