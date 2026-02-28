import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let prevStartDate: Date
    let prevEndDate: Date

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      prevEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      prevEndDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else {
      // 30d
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      prevEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const startISO = startDate.toISOString()
    const prevStartISO = prevStartDate.toISOString()
    const prevEndISO = prevEndDate.toISOString()

    // Fetch all data in parallel
    const [
      impressionsResult,
      impressionLogsResult,
      prevImpressionLogsResult,
      requestsResult,
      prevRequestsResult,
      conversationsResult,
      devisResult,
      prevDevisResult,
      facturesResult,
      reviewsResult,
    ] = await Promise.all([
      // Aggregated impressions
      supabase
        .from('provider_impressions')
        .select('*')
        .eq('profile_id', user.id),

      // Impression logs for current period
      supabase
        .from('impression_logs')
        .select('event_type, created_at, rank_position, score')
        .eq('profile_id', user.id)
        .gte('created_at', startISO)
        .order('created_at', { ascending: true }),

      // Impression logs for previous period
      supabase
        .from('impression_logs')
        .select('event_type, created_at')
        .eq('profile_id', user.id)
        .gte('created_at', prevStartISO)
        .lt('created_at', prevEndISO),

      // Requests for current period
      supabase
        .from('requests')
        .select('id, status, created_at')
        .eq('provider_id', user.id)
        .gte('created_at', startISO)
        .order('created_at', { ascending: true }),

      // Requests for previous period
      supabase
        .from('requests')
        .select('id, status, created_at')
        .eq('provider_id', user.id)
        .gte('created_at', prevStartISO)
        .lt('created_at', prevEndISO),

      // Active conversations
      supabase
        .from('conversations')
        .select('id, created_at')
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false }),

      // Devis for current period
      supabase
        .from('devis')
        .select('id, amount, status, created_at')
        .eq('prestataire_id', user.id)
        .gte('created_at', startISO),

      // Devis for previous period
      supabase
        .from('devis')
        .select('id, amount, status, created_at')
        .eq('prestataire_id', user.id)
        .gte('created_at', prevStartISO)
        .lt('created_at', prevEndISO),

      // Factures
      supabase
        .from('factures')
        .select('id, amount_ttc, status, created_at')
        .eq('prestataire_id', user.id),

      // Reviews
      supabase
        .from('reviews')
        .select('id, rating, created_at')
        .eq('prestataire_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    // --- Compute KPIs ---
    type LogEntry = { event_type: string; created_at: string; rank_position: number; score: number }
    type PrevLogEntry = { event_type: string; created_at: string }
    type RequestEntry = { id: string; status: string; created_at: string }
    type DevisEntry = { id: string; amount: number; status: string; created_at: string }
    type FactureEntry = { id: string; amount_ttc: number; status: string; created_at: string }
    type ReviewEntry = { id: string; rating: number; created_at: string }

    const logs: LogEntry[] = impressionLogsResult.data || []
    const prevLogs: PrevLogEntry[] = prevImpressionLogsResult.data || []
    const requests: RequestEntry[] = requestsResult.data || []
    const prevRequests: RequestEntry[] = prevRequestsResult.data || []
    const devis: DevisEntry[] = devisResult.data || []
    const prevDevis: DevisEntry[] = prevDevisResult.data || []
    const factures: FactureEntry[] = facturesResult.data || []
    const reviews: ReviewEntry[] = reviewsResult.data || []

    // Impressions & clicks
    const impressions = logs.filter(l => l.event_type === 'impression').length
    const clicks = logs.filter(l => l.event_type === 'click').length
    const contacts = logs.filter(l => l.event_type === 'contact').length
    const favorites = logs.filter(l => l.event_type === 'favorite').length

    const prevImpressions = prevLogs.filter(l => l.event_type === 'impression').length
    const prevClicks = prevLogs.filter(l => l.event_type === 'click').length
    const prevContacts = prevLogs.filter(l => l.event_type === 'contact').length

    // Rates
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 1000) / 10 : 0
    const contactRate = clicks > 0 ? Math.round((contacts / clicks) * 1000) / 10 : 0
    const prevCtr = prevImpressions > 0 ? Math.round((prevClicks / prevImpressions) * 1000) / 10 : 0

    // Requests
    const totalRequests = requests.length
    const acceptedRequests = requests.filter(r => r.status === 'accepted').length
    const rejectedRequests = requests.filter(r => r.status === 'rejected').length
    const pendingRequests = requests.filter(r => r.status === 'pending').length
    const prevTotalRequests = prevRequests.length

    const acceptanceRate = totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0

    // Devis
    const totalDevis = devis.length
    const devisAccepted = devis.filter(d => d.status === 'accepted').length
    const devisAmount = devis.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const devisAcceptedAmount = devis.filter(d => d.status === 'accepted').reduce((sum, d) => sum + (Number(d.amount) || 0), 0)
    const prevTotalDevis = prevDevis.length
    const devisConversionRate = totalDevis > 0 ? Math.round((devisAccepted / totalDevis) * 100) : 0

    // Factures / CA
    const facturesPaid = factures.filter(f => f.status === 'paid')
    const totalRevenue = facturesPaid.reduce((sum, f) => sum + (Number(f.amount_ttc) || 0), 0)

    // Reviews
    const avgRating = reviews.length > 0 ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10 : 0

    // Average position
    const rankedLogs = logs.filter(l => l.event_type === 'impression' && l.rank_position)
    const avgPosition = rankedLogs.length > 0 ? Math.round(rankedLogs.reduce((sum, l) => sum + l.rank_position, 0) / rankedLogs.length * 10) / 10 : 0

    // --- Compute daily timeline data ---
    const dayCount = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const timeline: { date: string; impressions: number; clicks: number; contacts: number; requests: number }[] = []

    for (let i = dayCount - 1; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStr = day.toISOString().split('T')[0]

      const dayImpressions = logs.filter(l => l.event_type === 'impression' && l.created_at.startsWith(dayStr)).length
      const dayClicks = logs.filter(l => l.event_type === 'click' && l.created_at.startsWith(dayStr)).length
      const dayContacts = logs.filter(l => l.event_type === 'contact' && l.created_at.startsWith(dayStr)).length
      const dayRequests = requests.filter(r => r.created_at.startsWith(dayStr)).length

      timeline.push({
        date: dayStr,
        impressions: dayImpressions,
        clicks: dayClicks,
        contacts: dayContacts,
        requests: dayRequests,
      })
    }

    // --- Funnel ---
    const funnel = [
      { label: 'Apparitions', value: impressions },
      { label: 'Clics profil', value: clicks },
      { label: 'Contacts', value: contacts },
      { label: 'Demandes', value: totalRequests },
      { label: 'Devis envoyes', value: totalDevis },
      { label: 'Devis acceptes', value: devisAccepted },
    ]

    // --- Devis by status ---
    const devisByStatus = [
      { status: 'accepted', label: 'Acceptes', count: devis.filter(d => d.status === 'accepted').length },
      { status: 'pending', label: 'En attente', count: devis.filter(d => d.status === 'pending').length },
      { status: 'rejected', label: 'Refuses', count: devis.filter(d => d.status === 'rejected').length },
      { status: 'negotiating', label: 'En nego', count: devis.filter(d => d.status === 'negotiating').length },
    ]

    // --- Requests by status ---
    const requestsByStatus = [
      { status: 'accepted', label: 'Acceptees', count: acceptedRequests },
      { status: 'pending', label: 'En attente', count: pendingRequests },
      { status: 'rejected', label: 'Refusees', count: rejectedRequests },
    ]

    return NextResponse.json({
      period,
      kpis: {
        impressions,
        clicks,
        contacts,
        favorites,
        ctr,
        contactRate,
        totalRequests,
        acceptanceRate,
        totalDevis,
        devisConversionRate,
        devisAmount,
        devisAcceptedAmount,
        totalRevenue,
        avgRating,
        reviewCount: reviews.length,
        avgPosition,
        totalConversations: conversationsResult.data?.length || 0,
      },
      deltas: {
        impressions: impressions - prevImpressions,
        clicks: clicks - prevClicks,
        contacts: contacts - prevContacts,
        ctr: Math.round((ctr - prevCtr) * 10) / 10,
        requests: totalRequests - prevTotalRequests,
        devis: totalDevis - prevTotalDevis,
      },
      timeline,
      funnel,
      devisByStatus,
      requestsByStatus,
    })
  } catch (error: any) {
    console.error('Analytics API error:', error)
    // Return empty data on table-not-found errors
    const isIgnorable = ['42P01', 'PGRST116', 'PGRST301'].includes(error?.code) ||
      ['does not exist', 'relation'].some(m => error?.message?.toLowerCase().includes(m))
    if (isIgnorable) {
      return NextResponse.json({
        period: '30d',
        kpis: { impressions: 0, clicks: 0, contacts: 0, favorites: 0, ctr: 0, contactRate: 0, totalRequests: 0, acceptanceRate: 0, totalDevis: 0, devisConversionRate: 0, devisAmount: 0, devisAcceptedAmount: 0, totalRevenue: 0, avgRating: 0, reviewCount: 0, avgPosition: 0, totalConversations: 0 },
        deltas: { impressions: 0, clicks: 0, contacts: 0, ctr: 0, requests: 0, devis: 0 },
        timeline: [],
        funnel: [],
        devisByStatus: [],
        requestsByStatus: [],
      })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
