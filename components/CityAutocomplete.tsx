'use client';

import { useState, useEffect } from 'react';

import { Command, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export function CityAutocomplete({ onSelect }: { onSelect: (city: string) => void }) {
  const [query, setQuery] = useState('');

  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (query.length < 2) return;

    // API Géo Française gratuite
    fetch(`https://geo.api.gouv.fr/communes?nom=${query}&limit=5`)
      .then(res => res.json())
      .then(data => {
        setCities(data.map((city: any) => ({
          name: city.nom,
          code: city.code,
        })));
      });
  }, [query]);

  return (
    <Command>
      <CommandInput 
        placeholder="Tapez votre ville..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {cities.map((city: any) => (
          <CommandItem
            key={city.code}
            onSelect={() => onSelect(city.name)}
          >
            {city.name}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}

