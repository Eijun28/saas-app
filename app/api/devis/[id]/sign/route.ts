// app/api/devis/[id]/sign/route.ts
// Génère et envoie un OTP de signature par email au couple

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { sendEmail } from '@/lib/email/resend'
import { generateEmailTemplate, generateContentBlock, escapeHtml } from '@/lib/email/templates'
import { createHash } from 'crypto'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

function generateOtp(): string {
  // Génère un code 6 chiffres sécurisé via crypto
  const array = new Uint32Array(1)
  // En environnement Node.js, utiliser crypto.getRandomValues via globalThis
  const code = Math.floor(100000 + (crypto.getRandomValues(array)[0] % 900000))
  return String(code).padStart(6, '0')
}

/**
 * POST /api/devis/[id]/sign
 * Génère un OTP et l'envoie par email au couple pour signer le devis
 */
export async function POST(
  _request: NextRequest,
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

    // Récupérer le couple lié à cet utilisateur
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner_1_name, partner_2_name, email')
      .eq('user_id', user.id)
      .single()

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Profil couple non trouvé' }, { status: 404 })
    }

    // Récupérer le devis
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select('id, couple_id, prestataire_id, amount, title, status, valid_until')
      .eq('id', devisId)
      .single()

    if (devisError || !devis) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Vérifier que ce couple est bien le destinataire
    if (devis.couple_id !== couple.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Vérifier que le devis est en attente de signature
    if (devis.status !== 'pending') {
      return NextResponse.json(
        { error: `Ce devis ne peut plus être signé (statut actuel : ${devis.status})` },
        { status: 400 }
      )
    }

    // Vérifier la date de validité
    if (devis.valid_until && new Date(devis.valid_until) < new Date()) {
      return NextResponse.json({ error: 'Ce devis a expiré' }, { status: 400 })
    }

    // Générer un OTP à 6 chiffres
    const otp = generateOtp()
    const otpHash = hashOtp(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const adminClient = createAdminClient()

    // Upsert la signature OTP (une par devis, on réinitialise si elle existait)
    const { error: upsertError } = await adminClient.from('devis_signatures').upsert(
      {
        devis_id: devis.id,
        couple_id: couple.id,
        otp_hash: otpHash,
        otp_expires_at: expiresAt.toISOString(),
        otp_attempts: 0,
        signed_at: null,
        signer_ip: null,
        signer_user_agent: null,
      },
      { onConflict: 'devis_id' }
    )

    if (upsertError) {
      logger.error('Erreur upsert devis_signature:', upsertError)
      return NextResponse.json({ error: 'Erreur lors de la génération du code' }, { status: 500 })
    }

    // Récupérer l'email du couple
    const { data: profile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const coupleEmail = (profile as { email?: string } | null)?.email || couple.email

    if (!coupleEmail) {
      return NextResponse.json({ error: 'Email du couple non trouvé' }, { status: 400 })
    }

    // Récupérer le nom du prestataire
    const { data: prestataire } = await adminClient
      .from('profiles')
      .select('prenom, nom, nom_entreprise')
      .eq('id', devis.prestataire_id)
      .single()

    const prestataireName =
      (prestataire as { nom_entreprise?: string | null } | null)?.nom_entreprise ||
      `${(prestataire as { prenom?: string | null } | null)?.prenom || ''} ${(prestataire as { nom?: string | null } | null)?.nom || ''}`.trim() ||
      'le prestataire'

    const coupleName = [couple.partner_1_name, couple.partner_2_name].filter(Boolean).join(' et ')
    const amountFormatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(devis.amount)

    // Envoyer l'email avec l'OTP
    const html = generateEmailTemplate({
      title: '🔐 Code de signature',
      greeting: `Bonjour ${couple.partner_1_name || coupleName}`,
      content: `
        <p style="font-size: 16px; margin-bottom: 20px;">
          Vous êtes sur le point de signer électroniquement le devis de
          <strong>${escapeHtml(prestataireName)}</strong>
          pour un montant de <strong>${escapeHtml(amountFormatted)}</strong>.
        </p>
        ${generateContentBlock(
          `<p style="margin: 0 0 12px 0; font-weight: 600; color: #823F91; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
             Votre code de signature à usage unique
           </p>
           <p style="margin: 0; font-size: 38px; font-weight: 700; letter-spacing: 14px; color: #0B0E12; font-family: monospace; text-align: center;">
             ${otp}
           </p>
           <p style="margin: 14px 0 0 0; font-size: 13px; color: #6B7280; text-align: center;">
             ⏱ Valable 10 minutes · Usage unique
           </p>`,
          '#823F91'
        )}
        <p style="font-size: 13px; color: #6B7280; margin-top: 20px; padding: 12px; background: #FEF9C3; border-radius: 6px; border-left: 3px solid #EAB308;">
          ⚠️ Ne communiquez jamais ce code à une autre personne. L'équipe Nuply ne vous le demandera jamais.
        </p>
      `,
      buttonText: 'Signer mon devis',
      buttonUrl: `${siteUrl}/couple/demandes`,
      footer: `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.<br><br>L'équipe Nuply 💜`,
      hideUnsubscribe: true,
    })

    await sendEmail({
      to: coupleEmail,
      subject: `🔐 Code de signature — Devis ${escapeHtml(prestataireName)}`,
      html,
    })

    logger.info('OTP signature envoyé', { devisId: devis.id, coupleId: couple.id })

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error) {
    logger.error('Erreur API devis sign:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
