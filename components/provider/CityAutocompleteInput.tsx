'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Command, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

interface CityAutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CityAutocompleteInput({
  value,
  onChange,
  placeholder = 'Tapez votre ville...',
  className,
}: CityAutocompleteInputProps) {
  const [query, setQuery] = useState(value)
  const [cities, setCities] = useState<Array<{ name: string; code: string }>>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (query.length < 2) {
      setCities([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(() => {
      fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&limit=5`)
        .then(res => res.json())
        .then(data => {
          const mappedCities = data.map((city: any) => ({
            name: city.nom,
            code: city.code,
          }))
          setCities(mappedCities)
          setIsOpen(mappedCities.length > 0)
        })
        .catch(() => {
          setCities([])
          setIsOpen(false)
        })
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (cityName: string) => {
    onChange(cityName)
    setQuery(cityName)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        onFocus={() => {
          if (cities.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
      />
      {isOpen && cities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg max-h-60 overflow-auto border-0 shadow-[0_4px_12px_rgba(130,63,145,0.12),0_0_0_1px_rgba(130,63,145,0.08)]">
          <Command>
            <CommandList>
              {cities.map((city) => (
                <CommandItem
                  key={city.code}
                  onSelect={() => handleSelect(city.name)}
                  className="cursor-pointer"
                >
                  {city.name}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
