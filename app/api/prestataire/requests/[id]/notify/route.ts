import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendRequestAcceptedEmail, sendRequestRejectedEmail } from '@/lib/email/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await req.json() as { type: 'accepted' | 'rejected' }
  if (type !== 'accepted' && type !== 'rejected') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  // Verify ownership
  const { data: request } = await supabase
    .from('requests')
    .select('id, couple_id, provider_id')
    .eq('id', requestId)
    .eq('provider_id', user.id)
    .single()

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    if (type === 'accepted') {
      await sendRequestAcceptedEmail(request.couple_id, request.provider_id, requestId)
    } else {
      await sendRequestRejectedEmail(request.couple_id, request.provider_id, requestId)
    }
  } catch {
    // Non-blocking — email failure should not block the response
  }

  return NextResponse.json({ ok: true })
}
