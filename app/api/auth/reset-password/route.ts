import { NextResponse } from 'next/server'
import { sendPasswordResetEmail } from '@/lib/email/password-reset'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      // Don't reveal validation details for security
      return NextResponse.json({ success: true })
    }

    const { email } = parsed.data

    // Always return success to prevent email enumeration
    await sendPasswordResetEmail(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    // Still return success to prevent information leakage
    console.error('Erreur API reset-password:', error)
    return NextResponse.json({ success: true })
  }
}
