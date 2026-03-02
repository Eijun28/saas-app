// app/api/factures/[id]/send/route.ts
// Génère le PDF de la facture, le stocke et envoie un email au couple

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { generateFacturePdf } from '@/lib/pdf/facture-generator'
import { sendEmail } from '@/lib/email/resend'
import { generateEmailTemplate, generateContentBlock, escapeHtml } from '@/lib/email/templates'
import type { FacturePdfData } from '@/types/billing'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * POST /api/factures/[id]/send
 * Génère le PDF de la facture, le stocke dans Supabase Storage,
 * met à jour le statut à "sent" et envoie un email au couple.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: factureId } = await params
    const supabase = await createClient()

    // Auth check (prestataire)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer la facture + vérifier propriété prestataire
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select(
        'id, facture_number, prestataire_id, couple_id, title, amount_ht, tva_rate, amount_tva, amount_ttc, currency, included_services, conditions, payment_terms, issue_date, due_date, status'
      )
      .eq('id', factureId)
      .eq('prestataire_id', user.id)
      .single()

    if (factureError || !facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    if (facture.status === 'paid' || facture.status === 'cancelled') {
      return NextResponse.json(
        { error: `Impossible d'envoyer une facture au statut "${facture.status}"` },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Récupérer prestataire + infos bancaires + couple en parallèle
    const [{ data: prestataire }, { data: bankingInfo }, { data: coupleRow }] = await Promise.all([
      adminClient
        .from('profiles')
        .select('prenom, nom, nom_entreprise, email')
        .eq('id', user.id)
        .single(),
      adminClient
        .from('prestataire_banking_info')
        .select('siret, tva_number, adresse_siege, nom_banque, iban, bic')
        .eq('prestataire_id', user.id)
        .single(),
      adminClient
        .from('couples')
        .select('id, partner_1_name, partner_2_name, email')
        .eq('id', facture.couple_id)
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

    const p = prestataire as PrestataireData | null
    const b = bankingInfo as BankingData | null
    const c = coupleRow as {
      id: string
      partner_1_name: string | null
      partner_2_name: string | null
      email?: string | null
    } | null

    const prestataireName =
      p?.nom_entreprise || `${p?.prenom || ''} ${p?.nom || ''}`.trim() || 'Prestataire'

    const coupleName = [c?.partner_1_name, c?.partner_2_name].filter(Boolean).join(' et ') || 'Client'

    // Récupérer l'email du couple (via profiles ou couples.email)
    const { data: coupleProfile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('id', (await adminClient.from('couples').select('user_id').eq('id', facture.couple_id).single()).data?.user_id ?? '')
      .single()

    const coupleEmail = (coupleProfile as { email?: string } | null)?.email || c?.email

    // Récupérer les infos de facturation du couple pour l'adresse
    const { data: coupleBilling } = await adminClient
      .from('couple_billing_info')
      .select('nom_complet, adresse, code_postal, ville, email_facturation, telephone')
      .eq('couple_id', facture.couple_id)
      .single()

    type CoupleBillingData = {
      nom_complet?: string
      adresse?: string
      code_postal?: string | null
      ville?: string | null
      email_facturation?: string | null
      telephone?: string | null
    }

    const cb = coupleBilling as CoupleBillingData | null

    // Construire les données PDF
    const pdfData: FacturePdfData = {
      factureNumber: facture.facture_number,
      issueDate: new Date(facture.issue_date),
      dueDate: facture.due_date ? new Date(facture.due_date) : undefined,
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
        ? `${cb.adresse || ''}${cb.code_postal ? ', ' + cb.code_postal : ''}${cb.ville ? ' ' + cb.ville : ''}`
        : '',
      clientEmail: cb?.email_facturation || coupleEmail || undefined,
      clientPhone: cb?.telephone || undefined,
      title: facture.title,
      includedServices: (facture.included_services as string[]) || [],
      amountHt: Number(facture.amount_ht),
      tvaRate: Number(facture.tva_rate),
      amountTva: Number(facture.amount_tva),
      amountTtc: Number(facture.amount_ttc),
      currency: facture.currency || 'EUR',
      conditions: facture.conditions || undefined,
      paymentTerms: facture.payment_terms || undefined,
    }

    // Générer le PDF
    const pdfBytes = await generateFacturePdf(pdfData)

    // Upload vers Supabase Storage (bucket devis-pdfs, dossier factures/)
    const fileName = `facture-${facture.facture_number.replace(/[/\\]/g, '-')}-${Date.now()}.pdf`
    const filePath = `factures/${user.id}/${fileName}`

    const { error: uploadError } = await adminClient.storage
      .from('devis-pdfs')
      .upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      logger.error('Erreur upload PDF facture:', uploadError)
      return NextResponse.json({ error: 'Erreur lors de la génération du PDF' }, { status: 500 })
    }

    const { data: urlData } = adminClient.storage.from('devis-pdfs').getPublicUrl(filePath)
    const pdfUrl = urlData?.publicUrl || null

    // Mettre à jour la facture : pdf_url + statut sent + sent_at
    const { error: updateError } = await adminClient
      .from('factures')
      .update({
        pdf_url: pdfUrl,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', factureId)

    if (updateError) {
      logger.error('Erreur mise à jour facture:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la facture' }, { status: 500 })
    }

    // Envoyer l'email au couple
    if (coupleEmail) {
      try {
        const amountFormatted = new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: facture.currency || 'EUR',
        }).format(Number(facture.amount_ttc))

        const hasTva = Number(facture.tva_rate) > 0
        const tvaLine = hasTva
          ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">dont TVA (${facture.tva_rate}%) : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: facture.currency || 'EUR' }).format(Number(facture.amount_tva))}</p>`
          : `<p style="margin: 4px 0 0 0; font-size: 12px; color: #6B7280;">TVA non applicable (art. 293 B CGI)</p>`

        const html = generateEmailTemplate({
          title: '📄 Nouvelle facture',
          greeting: `Bonjour ${c?.partner_1_name || coupleName}`,
          content: `
            <p style="font-size: 16px; margin-bottom: 20px;">
              Vous avez reçu une nouvelle facture de <strong>${escapeHtml(prestataireName)}</strong>.
            </p>
            ${generateContentBlock(
              `<p style="margin: 0 0 6px 0; font-weight: 600; color: #0B0E12; font-size: 15px;">${escapeHtml(facture.title)}</p>
               <p style="margin: 0; font-size: 22px; font-weight: 700; color: #823F91;">${escapeHtml(amountFormatted)}</p>
               ${tvaLine}
               ${
                 facture.due_date
                   ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #6B7280;">📅 Échéance : <strong>${new Date(facture.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>`
                   : ''
               }`,
              '#823F91'
            )}
            ${
              pdfUrl
                ? `<div style="text-align: center; margin: 20px 0 0 0;">
                     <a href="${pdfUrl}" style="display: inline-block; padding: 10px 20px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px; font-size: 14px; border: 1px solid #e5e7eb;">
                       📥 Télécharger la facture PDF
                     </a>
                   </div>`
                : ''
            }
          `,
          buttonText: 'Voir mes factures',
          buttonUrl: `${siteUrl}/couple/factures`,
          footer: `Pour toute question, contactez ${escapeHtml(prestataireName)} via la messagerie Nuply.<br><br>L'équipe Nuply 💜`,
          hideUnsubscribe: true,
        })

        await sendEmail({
          to: coupleEmail,
          subject: `📄 Facture ${facture.facture_number} — ${escapeHtml(prestataireName)}`,
          html,
        })
      } catch (emailError) {
        logger.error('Erreur envoi email facture (non bloquant):', emailError)
      }
    }

    logger.info('Facture envoyée', { factureId, prestataire: user.id, coupleEmail })

    return NextResponse.json({
      success: true,
      pdfUrl,
    })
  } catch (error) {
    logger.error('Erreur API factures send:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
