import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CSVRow {
  first_name: string
  last_name: string
  email: string
  phone: string
  wedding_date: string
  wedding_location: string
  budget: string
  notes: string
  status: string
  tags: string
}

const VALID_STATUSES = ['lead', 'contacted', 'meeting', 'proposal', 'won', 'lost']

function parseCSV(text: string): CSVRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = headerLine.split(/[,;]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''))

  const mapHeader = (h: string): keyof CSVRow | null => {
    const mapping: Record<string, keyof CSVRow> = {
      'prenom': 'first_name', 'first_name': 'first_name', 'prénom': 'first_name', 'firstname': 'first_name',
      'nom': 'last_name', 'last_name': 'last_name', 'lastname': 'last_name', 'name': 'last_name',
      'email': 'email', 'mail': 'email', 'e-mail': 'email',
      'telephone': 'phone', 'phone': 'phone', 'tel': 'phone', 'téléphone': 'phone', 'mobile': 'phone',
      'date_mariage': 'wedding_date', 'wedding_date': 'wedding_date', 'date': 'wedding_date', 'mariage': 'wedding_date',
      'lieu': 'wedding_location', 'wedding_location': 'wedding_location', 'location': 'wedding_location', 'ville': 'wedding_location', 'city': 'wedding_location',
      'budget': 'budget',
      'notes': 'notes', 'note': 'notes', 'commentaire': 'notes', 'comment': 'notes',
      'statut': 'status', 'status': 'status',
      'tags': 'tags', 'labels': 'tags', 'etiquettes': 'tags',
    }
    return mapping[h] ?? null
  }

  const headerMap = headers.map(mapHeader)

  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''))
    const row: CSVRow = { first_name: '', last_name: '', email: '', phone: '', wedding_date: '', wedding_location: '', budget: '', notes: '', status: '', tags: '' }

    headerMap.forEach((key, idx) => {
      if (key && values[idx]) {
        row[key] = values[idx]
      }
    })

    if (row.first_name || row.last_name || row.email) {
      rows.push(row)
    }
  }

  return rows
}

// POST /api/prestataire/crm-contacts/import-csv
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const body = await req.json()
    const csvText = body.csv as string
    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'CSV requis' }, { status: 400 })
    }

    const rows = parseCSV(csvText)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Aucun contact valide dans le CSV' }, { status: 400 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 contacts par import' }, { status: 400 })
    }

    const contacts = rows.map(row => ({
      provider_id: user.id,
      first_name: row.first_name || 'Sans nom',
      last_name: row.last_name || '',
      email: row.email || null,
      phone: row.phone || null,
      wedding_date: row.wedding_date || null,
      wedding_location: row.wedding_location || null,
      budget: row.budget ? parseInt(row.budget, 10) || null : null,
      notes: row.notes || '',
      status: VALID_STATUSES.includes(row.status) ? row.status : 'lead',
      source: 'csv_import' as const,
      tags: row.tags ? row.tags.split(/[|,;]/).map(t => t.trim()).filter(Boolean) : [],
    }))

    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contacts)
      .select('id')

    if (error) throw error

    return NextResponse.json({
      success: true,
      imported: data?.length ?? 0,
      total: rows.length,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
