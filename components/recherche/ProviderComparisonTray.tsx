'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeftRight, Star, MapPin, Euro, Briefcase, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ComparisonProvider {
  id: string
  nom_entreprise: string
  avatar_url?: string | null
  service_type?: string | null
  ville_principale?: string | null
  budget_min?: number | null
  budget_max?: number | null
  annees_experience?: number | null
  avgRating?: number
  reviewCount?: number
  cultures: Array<{ id: string; label: string }>
  zones: Array<{ id: string; label: string }>
  description_courte?: string | null
  bio?: string | null
}

interface ProviderComparisonTrayProps {
  providers: ComparisonProvider[]
  onRemove: (id: string) => void
  onClear: () => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatBudget(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Sur devis'
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `Dès ${fmt(min)}`
  if (max) return `Jusqu'à ${fmt(max)}`
  return 'Sur devis'
}

// Ligne de comparaison d'une caractéristique
function CompareRow({
  label,
  values,
}: {
  label: string
  values: (string | React.ReactNode)[]
}) {
  return (
    <div className="grid border-b border-gray-100 last:border-0" style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}>
      <div className="py-3 px-3 text-xs font-medium text-gray-500 bg-gray-50 flex items-center">
        {label}
      </div>
      {values.map((v, i) => (
        <div key={i} className="py-3 px-3 text-sm text-gray-800 border-l border-gray-100 flex items-center">
          {v || <span className="text-gray-400 italic text-xs">—</span>}
        </div>
      ))}
    </div>
  )
}

export function ProviderComparisonTray({ providers, onRemove, onClear }: ProviderComparisonTrayProps) {
  const [showModal, setShowModal] = useState(false)

  if (providers.length === 0) return null

  return (
    <>
      {/* Floating Tray */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
        >
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Label */}
              <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                <ArrowLeftRight className="h-4 w-4 text-[#823F91]" />
                <span className="text-sm font-semibold text-gray-700">
                  Comparer ({providers.length}/3)
                </span>
              </div>

              {/* Provider chips */}
              <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-full pl-1.5 pr-2 py-1 flex-shrink-0"
                  >
                    {p.avatar_url ? (
                      <Image
                        src={p.avatar_url}
                        alt={p.nom_entreprise}
                        width={20}
                        height={20}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#823F91] to-[#9333ea] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {getInitials(p.nom_entreprise)}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[#823F91] max-w-[100px] truncate">
                      {p.nom_entreprise}
                    </span>
                    <button
                      onClick={() => onRemove(p.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Slots vides */}
                {Array.from({ length: 3 - providers.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-1.5 border border-dashed border-gray-300 rounded-full px-3 py-1 flex-shrink-0"
                  >
                    <span className="text-xs text-gray-400">+ Ajouter</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={onClear}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors hidden sm:block"
                >
                  Effacer
                </button>
                <Button
                  onClick={() => setShowModal(true)}
                  disabled={providers.length < 2}
                  size="sm"
                  className="bg-gradient-to-r from-[#823F91] to-[#9333ea] text-white hover:from-[#9333ea] hover:to-[#823F91] text-xs sm:text-sm"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                  Comparer
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal de comparaison */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ArrowLeftRight className="h-5 w-5 text-[#823F91]" />
              Comparaison de prestataires
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto">
            {/* Entêtes providers */}
            <div
              className="grid border-b border-gray-200 bg-gray-50"
              style={{ gridTemplateColumns: `140px repeat(${providers.length}, 1fr)` }}
            >
              <div className="py-4 px-3" />
              {providers.map((p) => (
                <div key={p.id} className="py-4 px-3 border-l border-gray-200 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {p.avatar_url ? (
                      <Image
                        src={p.avatar_url}
                        alt={p.nom_entreprise}
                        width={52}
                        height={52}
                        className="rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#823F91] to-[#9333ea] flex items-center justify-center text-white text-base font-bold shadow">
                        {getInitials(p.nom_entreprise)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {p.nom_entreprise}
                      </p>
                      {p.service_type && (
                        <p className="text-xs text-gray-500 mt-0.5">{p.service_type}</p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        onRemove(p.id)
                        if (providers.length <= 2) setShowModal(false)
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Retirer de la comparaison"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Lignes de comparaison */}
            <div>
              <CompareRow
                label="Localisation"
                values={providers.map((p) =>
                  p.ville_principale ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      {p.ville_principale}
                    </span>
                  ) : null
                )}
              />
              <CompareRow
                label="Budget"
                values={providers.map((p) => (
                  <span className="flex items-center gap-1">
                    <Euro className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    {formatBudget(p.budget_min, p.budget_max)}
                  </span>
                ))}
              />
              <CompareRow
                label="Expérience"
                values={providers.map((p) =>
                  p.annees_experience ? (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      {p.annees_experience} ans
                    </span>
                  ) : null
                )}
              />
              <CompareRow
                label="Note"
                values={providers.map((p) =>
                  p.avgRating ? (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                      {p.avgRating.toFixed(1)}/5
                      {p.reviewCount ? (
                        <span className="text-gray-400 text-xs">({p.reviewCount})</span>
                      ) : null}
                    </span>
                  ) : null
                )}
              />
              <CompareRow
                label="Cultures"
                values={providers.map((p) =>
                  p.cultures.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.cultures.slice(0, 3).map((c) => (
                        <Badge
                          key={c.id}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-purple-50 border-purple-200 text-purple-700"
                        >
                          {c.label}
                        </Badge>
                      ))}
                      {p.cultures.length > 3 && (
                        <span className="text-xs text-gray-400">+{p.cultures.length - 3}</span>
                      )}
                    </div>
                  ) : null
                )}
              />
              <CompareRow
                label="Zones"
                values={providers.map((p) =>
                  p.zones.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.zones.slice(0, 2).map((z) => (
                        <Badge
                          key={z.id}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {z.label}
                        </Badge>
                      ))}
                      {p.zones.length > 2 && (
                        <span className="text-xs text-gray-400">+{p.zones.length - 2}</span>
                      )}
                    </div>
                  ) : null
                )}
              />
              <CompareRow
                label="Description"
                values={providers.map((p) => {
                  const desc = p.description_courte || p.bio
                  return desc ? (
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{desc}</p>
                  ) : null
                })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
