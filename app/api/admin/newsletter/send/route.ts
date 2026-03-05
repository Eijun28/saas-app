import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/config/admin'
import { sendEmail } from '@/lib/email/resend'
import { generateEmailTemplate } from '@/lib/email/templates'
import { newsletterSendSchema } from '@/lib/validations/newsletter.schema'

const BATCH_SIZE = 50

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = newsletterSendSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { subject, content } = parsed.data
    const adminClient = createAdminClient()

    // Récupérer tous les abonnés actifs
    const { data: subscribers, error: fetchError } = await adminClient
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'active')

    if (fetchError) {
      console.error('Erreur récupération abonnés:', fetchError)
      return NextResponse.json(
        { error: 'Erreur récupération abonnés' },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Aucun abonné actif' },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Envoyer par batch
    let sent = 0
    let errors = 0

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)

      for (const subscriber of batch) {
        const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`

        const html = generateEmailTemplate({
          title: subject,
          content: `
            ${content}
            <p style="font-size: 12px; color: #999; margin-top: 24px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
              <a href="${unsubscribeUrl}" style="color: #823F91; text-decoration: underline;">Se désinscrire de la newsletter</a>
            </p>
          `,
          hideUnsubscribe: true,
        })

        const result = await sendEmail({
          to: subscriber.email,
          subject,
          html,
        })

        if (result.success) {
          sent++
        } else {
          errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        total: subscribers.length,
        sent,
        errors,
      },
    })
  } catch (err) {
    console.error('Erreur envoi newsletter:', err)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
