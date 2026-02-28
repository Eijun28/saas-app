'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Star,
  MapPin,
  Building2,
  Sparkles,
  Trash2,
  StickyNote,
  Check,
  X,
  ArrowLeftRight,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { getCached, setCached, invalidateCache } from '@/lib/cache'
import { CULTURES } from '@/lib/constants/cultures'
import { DEPARTEMENTS } from '@/lib/constants/zones'
import { cn } from '@/lib/utils'
import { PageTitle } from '@/components/couple/shared/PageTitle'
import { toast } from 'sonner'

interface FavProvider {
  id: string
  prestataire_id: string
  note: string | null
  created_at: string
  // Provider data
  nom_entreprise: string | null
  avatar_url: string | null
  service_type: string | null
  ville_principale: string | null
  budget_min: number | null
  budget_max: number | null
  description_courte: string | null
  annees_experience: number | null
  avgRating: number
  reviewCount: number
  cultures: string[]
}

export default function FavorisPage() {
  const { user } = useUser()
  const [favoris, setFavoris] = useState<FavProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)

  useEffect(() => {
    if (user) loadFavoris()
  }, [user])

  async function loadFavoris(skipCache = false) {
    if (!user) return
    const CACHE_KEY = `couple-favoris-${user.id}`

    // Serve cached data instantly, then refresh in background
    if (!skipCache) {
      const cached = getCached<FavProvider[]>(CACHE_KEY)
      if (cached) {
        setFavoris(cached)
        setLoading(false)
        loadFavoris(true) // background refresh
        return
      }
    }

    setLoading(skipCache ? false : true)
    const supabase = createClient()

    try {
      const { data: favsData } = await supabase
        .from('favoris')
        .select('id, prestataire_id, note, created_at')
        .eq('couple_id', user.id)
        .order('created_at', { ascending: false })

      if (!favsData || favsData.length === 0) {
        setFavoris([])
        setLoading(false)
        return
      }

      const providerIds = favsData.map((f: any) => f.prestataire_id)

      // Fetch provider profiles and ratings in parallel
      const [profilesResult, ratingsResult, culturesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nom_entreprise, avatar_url, service_type, ville_principale, budget_min, budget_max, description_courte, annees_experience')
          .in('id', providerIds),
        supabase
          .from('prestataire_public_profiles')
          .select('profile_id, rating, total_reviews')
          .in('profile_id', providerIds),
        supabase
          .from('provider_cultures')
          .select('profile_id, culture_id')
          .in('profile_id', providerIds),
      ])

      const profileMap = new Map((profilesResult.data || []).map((p: any) => [p.id, p]))
      const ratingMap = new Map((ratingsResult.data || []).map((r: any) => [r.profile_id, r]))
      const culturesByProvider = new Map<string, string[]>()
      for (const c of (culturesResult.data || []) as any[]) {
        const existing = culturesByProvider.get(c.profile_id) || []
        const culture = CULTURES.find(cult => cult.id === c.culture_id)
        if (culture) existing.push(culture.label)
        culturesByProvider.set(c.profile_id, existing)
      }

      const enriched: FavProvider[] = favsData.map((fav: any) => {
        const profile = profileMap.get(fav.prestataire_id) || {} as any
        const rating = ratingMap.get(fav.prestataire_id)
        return {
          id: fav.id,
          prestataire_id: fav.prestataire_id,
          note: fav.note,
          created_at: fav.created_at,
          nom_entreprise: profile.nom_entreprise,
          avatar_url: profile.avatar_url,
          service_type: profile.service_type,
          ville_principale: profile.ville_principale,
          budget_min: profile.budget_min,
          budget_max: profile.budget_max,
          description_courte: profile.description_courte,
          annees_experience: profile.annees_experience,
          avgRating: rating ? Number(rating.rating) : 0,
          reviewCount: rating ? rating.total_reviews : 0,
          cultures: culturesByProvider.get(fav.prestataire_id) || [],
        }
      })

      setFavoris(enriched)
      setCached(`couple-favoris-${user.id}`, enriched)
    } catch (err) {
      console.error('Error loading favoris:', err)
    } finally {
      setLoading(false)
    }
  }

  async function removeFavori(favId: string) {
    const supabase = createClient()
    await supabase.from('favoris').delete().eq('id', favId)
    const updated = favoris.filter(f => f.id !== favId)
    setFavoris(updated)
    if (user) setCached(`couple-favoris-${user.id}`, updated)
    setCompareIds(prev => { const n = new Set(prev); n.delete(favId); return n })
    toast.success('Retire des favoris')
  }

  async function saveNote(favId: string) {
    const supabase = createClient()
    await supabase.from('favoris').update({ note: noteText.trim() || null }).eq('id', favId)
    setFavoris(prev => prev.map(f => f.id === favId ? { ...f, note: noteText.trim() || null } : f))
    setEditingNote(null)
    toast.success('Note enregistree')
  }

  function toggleCompare(favId: string) {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(favId)) {
        next.delete(favId)
      } else if (next.size < 3) {
        next.add(favId)
      } else {
        toast.error('Maximum 3 prestataires a comparer')
      }
      return next
    })
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const compareProviders = favoris.filter(f => compareIds.has(f.id))

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto space-y-5">
        <PageTitle
          title="Mes favoris"
          description={`${favoris.length} prestataire${favoris.length > 1 ? 's' : ''} dans votre shortlist`}
        />

        {/* Compare bar */}
        {compareIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-[50] flex items-center justify-between p-3 bg-[#823F91] text-white rounded-xl shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              <span className="text-sm font-medium">{compareIds.size} selectionne{compareIds.size > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 text-xs"
                onClick={() => setCompareIds(new Set())}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                className="bg-white text-[#823F91] hover:bg-white/90 text-xs font-semibold"
                onClick={() => setShowCompare(true)}
                disabled={compareIds.size < 2}
              >
                Comparer ({compareIds.size}/3)
              </Button>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : favoris.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-2xl border border-gray-100"
          >
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Aucun favori pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Ajoutez des prestataires en favori depuis la recherche</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoris.map((fav, index) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'bg-white rounded-2xl border overflow-hidden transition-all',
                  compareIds.has(fav.id)
                    ? 'border-[#823F91] ring-2 ring-[#823F91]/20'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                )}
              >
                {/* Header */}
                <div className="relative h-20 bg-gradient-to-br from-[#823F91]/10 to-[#9D5FA8]/10 flex items-center justify-center">
                  {fav.avatar_url ? (
                    <Image src={fav.avatar_url} alt="" width={56} height={56} className="h-14 w-14 rounded-full object-cover border-[3px] border-white shadow-md" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center border-[3px] border-white shadow-md">
                      <span className="text-lg font-semibold text-white">{getInitials(fav.nom_entreprise || 'P')}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => toggleCompare(fav.id)}
                      className={cn(
                        'p-1.5 rounded-full shadow-sm transition-all text-xs font-bold',
                        compareIds.has(fav.id) ? 'bg-[#823F91] text-white' : 'bg-white/80 text-gray-400 hover:text-[#823F91]'
                      )}
                      title="Comparer"
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFavori(fav.id)}
                      className="p-1.5 rounded-full bg-white/80 text-gray-400 hover:text-red-500 shadow-sm transition-colors"
                      title="Retirer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {fav.nom_entreprise || 'Prestataire'}
                    </h3>
                    {fav.service_type && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        <span className="capitalize">{fav.service_type.replace('_', ' ')}</span>
                      </p>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-wrap gap-1.5">
                    {fav.ville_principale && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        <MapPin className="h-2.5 w-2.5 mr-0.5" />{fav.ville_principale}
                      </Badge>
                    )}
                    {fav.avgRating > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-amber-50 border-amber-200 text-amber-700">
                        <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-400 text-amber-400" />
                        {fav.avgRating.toFixed(1)} ({fav.reviewCount})
                      </Badge>
                    )}
                    {fav.cultures.slice(0, 1).map(c => (
                      <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-50 border-purple-200 text-purple-700">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />{c}
                      </Badge>
                    ))}
                  </div>

                  {/* Budget */}
                  {(fav.budget_min || fav.budget_max) && (
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {fav.budget_min?.toLocaleString('fr-FR')}&euro;
                        {fav.budget_max && ` - ${fav.budget_max.toLocaleString('fr-FR')}\u20AC`}
                      </span>
                    </p>
                  )}

                  {/* Note personnelle */}
                  <div className="pt-2 border-t border-gray-100">
                    {editingNote === fav.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Votre note perso..."
                          rows={2}
                          className="text-xs resize-none"
                          maxLength={200}
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs bg-[#823F91] hover:bg-[#6D3478]" onClick={() => saveNote(fav.id)}>
                            <Check className="h-3 w-3 mr-1" />Enregistrer
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingNote(null)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNote(fav.id); setNoteText(fav.note || '') }}
                        className="flex items-start gap-1.5 text-left w-full group"
                      >
                        <StickyNote className="h-3 w-3 text-gray-300 mt-0.5 flex-shrink-0 group-hover:text-[#823F91]" />
                        {fav.note ? (
                          <span className="text-xs text-gray-600 leading-relaxed">{fav.note}</span>
                        ) : (
                          <span className="text-xs text-gray-300 group-hover:text-[#823F91]">+ Ajouter une note</span>
                        )}
                        <Pencil className="h-2.5 w-2.5 text-gray-300 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Comparison modal */}
        <AnimatePresence>
          {showCompare && compareProviders.length >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[201] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setShowCompare(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[90dvh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Compare header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Comparaison</h2>
                    <p className="text-sm text-gray-500">{compareProviders.length} prestataires</p>
                  </div>
                  <button onClick={() => setShowCompare(false)} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors">
                    <X className="h-5 w-5 text-gray-700" />
                  </button>
                </div>

                {/* Compare table */}
                <div className="p-6">
                  <div className={cn('grid gap-4', compareProviders.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                    {/* Provider headers */}
                    {compareProviders.map(p => (
                      <div key={p.id} className="text-center space-y-2">
                        {p.avatar_url ? (
                          <Image src={p.avatar_url} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover mx-auto border-2 border-gray-100" />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center mx-auto">
                            <span className="text-lg font-semibold text-white">{getInitials(p.nom_entreprise || 'P')}</span>
                          </div>
                        )}
                        <h3 className="text-sm font-bold text-gray-900 truncate">{p.nom_entreprise}</h3>
                        <p className="text-[11px] text-gray-500 capitalize">{p.service_type?.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Comparison rows */}
                  {[
                    {
                      label: 'Note',
                      render: (p: FavProvider) => p.avgRating > 0 ? (
                        <span className="flex items-center justify-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold">{p.avgRating.toFixed(1)}</span>
                          <span className="text-gray-400 text-xs">({p.reviewCount})</span>
                        </span>
                      ) : <span className="text-gray-300">-</span>,
                    },
                    {
                      label: 'Budget',
                      render: (p: FavProvider) => (p.budget_min || p.budget_max) ? (
                        <span className="font-semibold text-sm">
                          {p.budget_min?.toLocaleString('fr-FR')}&euro;
                          {p.budget_max ? ` - ${p.budget_max.toLocaleString('fr-FR')}\u20AC` : ''}
                        </span>
                      ) : <span className="text-gray-300">-</span>,
                    },
                    {
                      label: 'Experience',
                      render: (p: FavProvider) => p.annees_experience ? (
                        <span className="font-medium">{p.annees_experience} an{p.annees_experience > 1 ? 's' : ''}</span>
                      ) : <span className="text-gray-300">-</span>,
                    },
                    {
                      label: 'Ville',
                      render: (p: FavProvider) => p.ville_principale ? (
                        <span className="flex items-center justify-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />{p.ville_principale}
                        </span>
                      ) : <span className="text-gray-300">-</span>,
                    },
                    {
                      label: 'Cultures',
                      render: (p: FavProvider) => p.cultures.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {p.cultures.map(c => (
                            <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-50 border-purple-200 text-purple-700">{c}</Badge>
                          ))}
                        </div>
                      ) : <span className="text-gray-300">-</span>,
                    },
                    {
                      label: 'Description',
                      render: (p: FavProvider) => p.description_courte ? (
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{p.description_courte}</p>
                      ) : <span className="text-gray-300">-</span>,
                    },
                    {
                      label: 'Votre note',
                      render: (p: FavProvider) => p.note ? (
                        <p className="text-xs text-gray-600 italic leading-relaxed">{p.note}</p>
                      ) : <span className="text-gray-300 text-xs">Aucune note</span>,
                    },
                  ].map((row) => (
                    <div key={row.label} className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{row.label}</p>
                      <div className={cn('grid gap-4', compareProviders.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
                        {compareProviders.map(p => (
                          <div key={p.id} className="text-center py-2 px-3 bg-gray-50 rounded-lg min-h-[36px] flex items-center justify-center">
                            {row.render(p)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
