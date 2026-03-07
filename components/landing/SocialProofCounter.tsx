'use client'

import { useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Globe2, MapPin } from 'lucide-react'

interface Stats {
  providers: number
  cultures: number
  cities: number
}

function AnimatedNumber({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const end = value
    const step = Math.ceil(end / (duration * 60))
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [isInView, value, duration])

  return <span ref={ref}>{count}</span>
}

export function SocialProofCounter() {
  const [stats, setStats] = useState<Stats>({ providers: 0, cultures: 0, cities: 0 })

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      // Count providers
      const { count: providerCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'prestataire')
        .not('nom_entreprise', 'is', null)

      // Count distinct cultures
      const { data: culturesData } = await supabase
        .from('provider_cultures')
        .select('culture_id')
      const uniqueCultures = new Set(culturesData?.map((c: unknown) => (c as { culture_id: string }).culture_id) || [])

      // Count distinct cities
      const { data: citiesData } = await supabase
        .from('profiles')
        .select('ville_principale')
        .eq('role', 'prestataire')
        .not('ville_principale', 'is', null)
      const uniqueCities = new Set(citiesData?.map((c: unknown) => (c as { ville_principale: string }).ville_principale) || [])

      setStats({
        providers: providerCount || 0,
        cultures: uniqueCultures.size,
        cities: uniqueCities.size,
      })
    }
    fetchStats()
  }, [])

  const items = [
    { icon: Users, label: 'Prestataires', value: stats.providers, suffix: '+' },
    { icon: Globe2, label: 'Cultures', value: stats.cultures, suffix: '' },
    { icon: MapPin, label: 'Villes', value: stats.cities, suffix: '+' },
  ]

  // Don't render if no data yet
  if (stats.providers === 0 && stats.cultures === 0 && stats.cities === 0) {
    return null
  }

  return (
    <section className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-8 sm:gap-16">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <item.icon className="h-5 w-5 text-[#823F91]/60" />
              <span className="text-2xl sm:text-3xl font-bold text-[#823F91]">
                <AnimatedNumber value={item.value} />{item.suffix}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
