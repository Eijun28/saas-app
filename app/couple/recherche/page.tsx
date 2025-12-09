'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, MapPin, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import Link from 'next/link'

export default function RecherchePage() {
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [prestataires, setPrestataires] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadPrestataires()
    }
  }, [user, searchQuery])

  const loadPrestataires = async () => {
    setLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('prestataire_profiles')
      .select(`
        *,
        profiles:prestataire_profiles!inner(
          id,
          prenom,
          nom
        ),
        prestataire_public_profiles(
          rating,
          total_reviews,
          is_verified
        )
      `)

    if (searchQuery.trim()) {
      query = query.or(`nom_entreprise.ilike.%${searchQuery}%,type_prestation.ilike.%${searchQuery}%,ville_exercice.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query.limit(20)

    if (error) {
      console.error('Erreur lors du chargement des prestataires:', error)
      setPrestataires([])
    } else {
      setPrestataires(data || [])
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-semibold text-[#0D0D0D]">
            Recherche de prestataires
          </h1>
          <p className="text-[#4A4A4A]">
            Trouvez les prestataires qui correspondent à vos besoins
          </p>
        </motion.div>

        {/* Barre de recherche */}
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#4A4A4A]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un prestataire, un type de prestation, une ville..."
                  className="pl-10 border-gray-200 focus-visible:ring-[#823F91]"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résultats */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#4A4A4A]">Chargement...</p>
          </div>
        ) : prestataires.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-12 text-center">
              <p className="text-[#4A4A4A]">
                {searchQuery ? 'Aucun prestataire trouvé pour votre recherche.' : 'Commencez votre recherche pour trouver des prestataires.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prestataires.map((prestataire) => (
              <motion.div
                key={prestataire.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <Card className="h-full cursor-pointer hover:shadow-lg transition-all border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {prestataire.nom_entreprise || `${prestataire.profiles?.prenom} ${prestataire.profiles?.nom}`}
                    </CardTitle>
                    {prestataire.prestataire_public_profiles?.is_verified && (
                      <span className="text-xs text-[#823F91] font-medium">✓ Vérifié</span>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                      <span className="font-medium">{prestataire.type_prestation}</span>
                    </div>
                    {prestataire.ville_exercice && (
                      <div className="flex items-center gap-2 text-sm text-[#4A4A4A]">
                        <MapPin className="h-4 w-4" />
                        <span>{prestataire.ville_exercice}</span>
                      </div>
                    )}
                    {prestataire.prestataire_public_profiles?.rating && (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-[#0D0D0D]">
                          {prestataire.prestataire_public_profiles.rating.toFixed(1)}
                        </span>
                        {prestataire.prestataire_public_profiles.total_reviews > 0 && (
                          <span className="text-[#4A4A4A]">
                            ({prestataire.prestataire_public_profiles.total_reviews} avis)
                          </span>
                        )}
                      </div>
                    )}
                    {prestataire.tarif_min && prestataire.tarif_max && (
                      <div className="text-sm text-[#0D0D0D] font-semibold">
                        {prestataire.tarif_min.toLocaleString('fr-FR')} € - {prestataire.tarif_max.toLocaleString('fr-FR')} €
                      </div>
                    )}
                    <Link href={`/prestataire/${prestataire.user_id}`}>
                      <Button className="w-full bg-[#823F91] hover:bg-[#6D3478] text-white mt-4">
                        Voir le profil
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

