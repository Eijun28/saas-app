import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { newsletterSubscribeSchema } from '@/lib/validations/newsletter.schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = newsletterSubscribeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data
    const supabase = createAdminClient()

    // Upsert : si l'email existe mais est unsubscribed, on le réactive
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email: email.toLowerCase(),
          status: 'active',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('Erreur inscription newsletter:', error)
      return NextResponse.json(
        { error: 'Une erreur est survenue' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
