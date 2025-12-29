'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Users } from 'lucide-react'

interface DemandeRecente {
  id: string
  couple_name: string
  service_type: string
  wedding_date: string
  status: string
  created_at: string
  guest_count: number | null
}

export function DemandesRecentesList() {
  const [demandes, setDemandes] = useState<DemandeRecente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDemandes = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Récupérer les demandes
      const { data: allDemandes, error } = await supabase
        .from('demandes')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) {
        console.error('Erreur fetch demandes:', error)
        setLoading(false)
        return
      }

      if (!allDemandes || allDemandes.length === 0) {
        setDemandes([])
        setLoading(false)
        return
      }

      // 2. Récupérer les infos des couples
      const coupleIds = [...new Set(allDemandes.map((d: any) => d.couple_id))]
      const { data: couplesData } = await supabase
        .from('couples')
        .select('user_id, partner_1_name, partner_2_name')
        .in('user_id', coupleIds)

      // 3. Créer un map pour accéder rapidement aux infos couple
      const couplesMap = new Map()
      if (couplesData) {
        couplesData.forEach((couple: any) => {
          couplesMap.set(couple.user_id, couple)
        })
      }

      // 4. Enrichir avec couple_name et mapper les champs
      const enriched = (allDemandes || []).map((d: any) => {
        const couple = couplesMap.get(d.couple_id)
        return {
          ...d,
          couple_name: couple?.partner_1_name && couple?.partner_2_name
            ? `${couple.partner_1_name} & ${couple.partner_2_name}`
            : couple?.partner_1_name || 'Couple',
          service_type: d.service_type || d.type_prestation || 'Service',
          wedding_date: d.wedding_date || d.date_mariage || couple?.wedding_date || null,
          guest_count: d.guest_count || couple?.guest_count || null
        }
      })

      setDemandes(enriched)
      setLoading(false)
    }

    fetchDemandes()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (demandes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p>Aucune demande récente</p>
        <p className="text-xs mt-1">Les nouvelles demandes apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {demandes.map((demande) => (
        <button
          key={demande.id}
          onClick={() => window.location.href = '/prestataire/demandes-recues'}
          className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-[#823F91]/30 transition-all group"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 group-hover:text-[#823F91] transition-colors">
                {demande.couple_name}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {demande.service_type}
              </p>
            </div>
            
            <Badge variant={demande.status === 'pending' ? 'default' : 'secondary'}>
              {demande.status === 'pending' ? 'Nouveau' : demande.status}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(demande.created_at), { addSuffix: true, locale: fr })}
            </span>
            
            {demande.wedding_date && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {new Date(demande.wedding_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
              </span>
            )}
            
            {demande.guest_count && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {demande.guest_count} pers.
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

