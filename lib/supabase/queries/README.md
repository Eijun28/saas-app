# 📚 Queries Supabase - Documentation

## 📖 Utilisation des Queries Couples

### Import

```typescript
import { 
  getCurrentCoupleProfile,
  createCoupleProfile,
  updateCoupleProfile,
  createCouplePreferences,
  updateCouplePreferences,
  checkCoupleProfileExists,
  getCouplePreferences
} from '@/lib/supabase/queries/couples.queries'
```

### Exemples

#### 1. Récupérer le profil complet

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getCurrentCoupleProfile } from '@/lib/supabase/queries/couples.queries'
import type { CoupleWithPreferences } from '@/types/couples.types'

export function CoupleDashboard() {
  const [couple, setCouple] = useState<CoupleWithPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const profile = await getCurrentCoupleProfile()
        setCouple(profile)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div>Chargement...</div>
  if (!couple) return <div>Aucun profil</div>

  return (
    <div>
      <h1>Bienvenue {couple.partner_1_name}</h1>
      {couple.preferences && (
        <p>Services: {couple.preferences.essential_services.join(', ')}</p>
      )}
    </div>
  )
}
```

#### 2. Créer un profil lors de l'inscription

```typescript
import { createCoupleProfile, createCouplePreferences } from '@/lib/supabase/queries/couples.queries'

async function handleSignUp(email: string, partner1: string, partner2: string) {
  // Après l'inscription Supabase Auth...
  
  // Créer le profil couple
  const couple = await createCoupleProfile({
    email,
    partner_1_name: partner1,
    partner_2_name: partner2,
    currency: 'EUR'
  })

  // Créer les préférences vides
  await createCouplePreferences(couple.id, {
    languages: ['français'],
    essential_services: [],
    optional_services: []
  })
}
```

#### 3. Mettre à jour les préférences

```typescript
import { updateCouplePreferences } from '@/lib/supabase/queries/couples.queries'

async function updateServices(coupleId: string) {
  await updateCouplePreferences(coupleId, {
    essential_services: ['traiteur', 'photographe'],
    optional_services: ['dj', 'decoration'],
    completion_percentage: 40
  })
}
```

---

## 🔍 Notes Techniques

- Toutes les fonctions nécessitent un utilisateur authentifié
- Les erreurs sont loggées dans la console
- Les RLS policies sont appliquées automatiquement
- Les timestamps `updated_at` sont mis à jour automatiquement

