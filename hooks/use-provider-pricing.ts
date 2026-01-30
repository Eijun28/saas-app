'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ProviderPricing } from '@/lib/types/pricing'

export function useProviderPricing(providerId: string | null) {
  const [pricings, setPricings] = useState<ProviderPricing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPricing = useCallback(async () => {
    if (!providerId) {
      setPricings([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { data, error: fetchError } = await supabase
        .from('provider_pricing')
        .select('*')
        .eq('provider_id', providerId)
        .order('display_order', { ascending: true })
        .order('is_primary', { ascending: false })

      if (fetchError) {
        // If table doesn't exist yet, return empty array
        if (fetchError.code === '42P01') {
          console.warn('provider_pricing table does not exist yet')
          setPricings([])
          setIsLoading(false)
          return
        }
        throw fetchError
      }

      setPricings(data || [])
    } catch (err: any) {
      console.error('Error loading provider pricing:', err)
      setError(err.message || 'Erreur lors du chargement des tarifs')
      setPricings([])
    } finally {
      setIsLoading(false)
    }
  }, [providerId])

  useEffect(() => {
    loadPricing()
  }, [loadPricing])

  return {
    pricings,
    isLoading,
    error,
    reload: loadPricing,
  }
}

// Hook to fetch pricing for display (read-only, any provider)
export function useProviderPricingPublic(providerId: string | null) {
  const [pricings, setPricings] = useState<ProviderPricing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPricing() {
      if (!providerId) {
        setPricings([])
        setIsLoading(false)
        return
      }

      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('provider_pricing')
          .select('*')
          .eq('provider_id', providerId)
          .order('display_order', { ascending: true })
          .order('is_primary', { ascending: false })

        if (error) {
          // If table doesn't exist, return empty
          if (error.code === '42P01') {
            setPricings([])
            setIsLoading(false)
            return
          }
          throw error
        }

        setPricings(data || [])
      } catch (err) {
        console.error('Error fetching provider pricing:', err)
        setPricings([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPricing()
  }, [providerId])

  return { pricings, isLoading }
}
