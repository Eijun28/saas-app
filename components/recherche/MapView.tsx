'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { getCityCoordinates, FRANCE_CENTER, FRANCE_ZOOM } from '@/lib/constants/city-coordinates'

// Dynamically import Leaflet components (no SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(m => m.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then(m => m.Popup),
  { ssr: false }
)

interface MapProvider {
  id: string
  nom_entreprise: string
  ville_principale?: string | null
  service_type?: string | null
  budget_min?: number | null
  budget_max?: number | null
  avgRating?: number
  reviewCount?: number
}

interface MapViewProps {
  providers: MapProvider[]
  onSelectProvider?: (id: string) => void
}

export function MapView({ providers, onSelectProvider }: MapViewProps) {
  // Compute markers with coordinates
  const markers = useMemo(() => {
    const result: Array<{
      provider: MapProvider
      position: [number, number]
    }> = []

    // Group by city to offset overlapping markers
    const cityGroups = new Map<string, MapProvider[]>()

    for (const p of providers) {
      if (!p.ville_principale) continue
      const key = p.ville_principale.toLowerCase()
      const group = cityGroups.get(key) ?? []
      group.push(p)
      cityGroups.set(key, group)
    }

    for (const [, group] of cityGroups) {
      const coords = getCityCoordinates(group[0].ville_principale!)
      if (!coords) continue

      group.forEach((p, i) => {
        // Offset overlapping markers slightly
        const offset = i * 0.003
        const angle = (i * 137.5) * Math.PI / 180 // golden angle
        result.push({
          provider: p,
          position: [
            coords[0] + offset * Math.cos(angle),
            coords[1] + offset * Math.sin(angle),
          ],
        })
      })
    }

    return result
  }, [providers])

  if (typeof window === 'undefined') {
    return <div className="h-[500px] bg-gray-100 rounded-xl animate-pulse" />
  }

  return (
    <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-gray-200">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={FRANCE_CENTER}
        zoom={FRANCE_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(({ provider, position }) => (
          <Marker key={provider.id} position={position}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-sm text-gray-900 mb-1">
                  {provider.nom_entreprise}
                </p>
                {provider.service_type && (
                  <p className="text-xs text-[#823F91] mb-1">{provider.service_type}</p>
                )}
                {provider.ville_principale && (
                  <p className="text-xs text-gray-500 mb-1">{provider.ville_principale}</p>
                )}
                {(provider.budget_min || provider.budget_max) && (
                  <p className="text-xs text-gray-500 mb-2">
                    {provider.budget_min ?? 0}€ – {provider.budget_max ?? '∞'}€
                  </p>
                )}
                {provider.avgRating !== undefined && provider.avgRating > 0 && (
                  <p className="text-xs text-gray-500 mb-2">
                    ★ {provider.avgRating.toFixed(1)} ({provider.reviewCount} avis)
                  </p>
                )}
                {onSelectProvider && (
                  <button
                    onClick={() => onSelectProvider(provider.id)}
                    className="text-xs text-[#823F91] font-medium hover:underline"
                  >
                    Voir le profil →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-600 shadow z-[1000]">
        {markers.length} prestataire{markers.length !== 1 ? 's' : ''} sur la carte
      </div>
    </div>
  )
}
