import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CRM_STATUSES = ['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost'] as const

const createContactSchema = z.object({
  first_name: z.string().min(1, 'Prenom requis').max(100),
  last_name: z.string().max(100).default(''),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  wedding_date: z.string().optional().or(z.literal('')),
  wedding_location: z.string().max(200).optional().or(z.literal('')),
  budget: z.number().int().nonnegative().optional(),
  guest_count: z.number().int().nonnegative().optional(),
  status: z.enum(CRM_STATUSES).default('lead'),
  source: z.enum(['manual', 'csv_import', 'nuply_request']).default('manual'),
  notes: z.string().max(5000).default(''),
  tags: z.array(z.string().max(50)).default([]),
})

const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid(),
})

// GET /api/prestataire/crm-contacts
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ contacts: data ?? [] })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/prestataire/crm-contacts
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const body = await req.json()
    const parsed = createContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const row = {
      provider_id: user.id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      wedding_date: parsed.data.wedding_date || null,
      wedding_location: parsed.data.wedding_location || null,
      budget: parsed.data.budget ?? null,
      guest_count: parsed.data.guest_count ?? null,
      status: parsed.data.status,
      source: parsed.data.source,
      notes: parsed.data.notes,
      tags: parsed.data.tags,
    }

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(row)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ contact: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH /api/prestataire/crm-contacts
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const body = await req.json()
    const parsed = updateContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 })
    }

    const { id, ...updates } = parsed.data
    // Clean empty strings to null for optional fields
    const cleanUpdates: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value === '') {
        cleanUpdates[key] = null
      } else if (value !== undefined) {
        cleanUpdates[key] = value
      }
    }

    const { data, error } = await supabase
      .from('crm_contacts')
      .update(cleanUpdates)
      .eq('id', id)
      .eq('provider_id', user.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ contact: data })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/prestataire/crm-contacts?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const contactId = new URL(req.url).searchParams.get('id')
    if (!contactId) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', contactId)
      .eq('provider_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
