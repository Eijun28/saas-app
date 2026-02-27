# NUPLY — Code Patterns Guide

> Guide de référence pour les patterns de code récurrents dans NUPLY.
> Stack: Next.js 16 App Router · TypeScript strict · Supabase · Zod · React Hook Form

---

## 1. Server vs Client Components

### Règle fondamentale
**Server Component par défaut**. N'ajouter `'use client'` que si nécessaire.

### Quand utiliser `'use client'`
- État local React (`useState`, `useReducer`)
- Gestionnaires d'événements DOM (`onClick`, `onChange`, etc.)
- Hooks React (`useEffect`, `useContext`, hooks custom)
- APIs navigateur (`window`, `localStorage`, `navigator`)
- Bibliothèques non compatibles SSR (certaines animations)

### Server Component — pattern standard

```typescript
// app/couple/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: demandes, error } = await supabase
    .from('demandes')
    .select('*, prestataire_profiles(nom_entreprise)')
    .eq('couple_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching demandes:', error)
    // Gérer l'erreur selon le contexte
  }

  return <DashboardView demandes={demandes ?? []} />
}
```

### Client Component — pattern standard

```typescript
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface Props {
  initialData: SomeType[]
}

export function InteractiveList({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  function handleAction(id: string) {
    startTransition(async () => {
      const result = await someServerAction(id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setData(prev => prev.filter(item => item.id !== id))
      toast.success('Supprimé avec succès')
    })
  }

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => handleAction(item.id)} disabled={isPending}>
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  )
}
```

---

## 2. Supabase — Patterns

### Clients disponibles

```typescript
// Client-side (composants 'use client')
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// Server-side (Server Components, API Routes, Server Actions)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Admin — bypass RLS (uniquement dans les API Routes serveur, jamais client)
import { createAdminClient } from '@/lib/supabase/admin'
const supabaseAdmin = createAdminClient()
```

### Requêtes — patterns courants

```typescript
// SELECT avec filtre
const { data, error } = await supabase
  .from('demandes')
  .select('id, status, message, created_at')
  .eq('couple_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)

// SELECT avec JOIN
const { data } = await supabase
  .from('demandes')
  .select(`
    *,
    prestataire_profiles!inner(nom_entreprise, type_prestation),
    conversations(id)
  `)
  .eq('couple_id', userId)

// INSERT
const { data: newDemande, error } = await supabase
  .from('demandes')
  .insert({
    couple_id: userId,
    prestataire_id: prestataireId,
    status: 'new',
    message,
    date_mariage: dateMarriage,
    budget_min: budgetMin,
    budget_max: budgetMax,
    location,
  })
  .select()
  .single()

// UPDATE
const { error } = await supabase
  .from('demandes')
  .update({ status: 'accepted' })
  .eq('id', demandeId)
  .eq('prestataire_id', userId)  // toujours filtrer par propriétaire

// DELETE
const { error } = await supabase
  .from('favoris')
  .delete()
  .eq('couple_id', userId)
  .eq('prestataire_id', prestataireId)

// UPSERT
const { error } = await supabase
  .from('couple_profiles')
  .upsert({ user_id: userId, ...profileData })
  .eq('user_id', userId)
```

### Gestion d'erreurs Supabase

```typescript
import { extractSupabaseError, getErrorMessage } from '@/lib/utils'

const { data, error } = await supabase.from('table').select()

if (error) {
  const details = extractSupabaseError(error)
  // details.message, details.code, details.hint, details.statusCode
  console.error('Supabase error:', details)
  return { error: details.message }
}
```

### Auth — obtenir l'utilisateur courant

```typescript
// Server Component / API Route
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  redirect('/sign-in')  // ou return NextResponse.redirect(...)
}

// Récupérer le profil
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

### Realtime — messagerie

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function useRealtimeMessages(conversationId: string) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Traiter le nouveau message
          handleNewMessage(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])
}
```

---

## 3. Server Actions

```typescript
// lib/actions/demandes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createDemandeSchema = z.object({
  prestataireId: z.string().uuid(),
  message: z.string().min(10).max(1000),
  dateMarriage: z.string(),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  location: z.string().min(2),
})

export async function createDemande(formData: unknown) {
  const supabase = await createClient()

  // Vérifier l'auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Valider les données
  const parsed = createDemandeSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { prestataireId, message, dateMarriage, budgetMin, budgetMax, location } = parsed.data

  // Insérer en base
  const { data, error } = await supabase
    .from('demandes')
    .insert({
      couple_id: user.id,
      prestataire_id: prestataireId,
      status: 'new',
      message,
      date_mariage: dateMarriage,
      budget_min: budgetMin,
      budget_max: budgetMax,
      location,
    })
    .select()
    .single()

  if (error) return { error: 'Erreur lors de la création de la demande' }

  revalidatePath('/couple/demandes')
  return { data }
}
```

---

## 4. API Routes (Route Handlers)

```typescript
// app/api/matching/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const querySchema = z.object({
  type: z.string(),
  ville: z.string(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validation params
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { type, ville, budgetMin, budgetMax } = parsed.data

    // Query
    let query = supabase
      .from('prestataire_profiles')
      .select(`
        *,
        prestataire_public_profiles(rating, total_reviews, is_verified, description)
      `)
      .eq('type_prestation', type)
      .ilike('ville_exercice', `%${ville}%`)

    if (budgetMin) query = query.gte('tarif_max', budgetMin)
    if (budgetMax) query = query.lte('tarif_min', budgetMax)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Matching API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    // ... traiter le body

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## 5. Formulaires avec React Hook Form + Zod

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// 1. Définir le schéma Zod
const contactSchema = z.object({
  nom: z.string().min(2, 'Nom requis (minimum 2 caractères)'),
  email: z.string().email('Email invalide'),
  message: z.string().min(10, 'Message trop court').max(500, 'Message trop long'),
  budget: z.coerce.number().positive('Budget doit être positif').optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

// 2. Composant formulaire
export function ContactForm() {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nom: '',
      email: '',
      message: '',
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(data: ContactFormData) {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Erreur réseau')

      toast.success('Message envoyé avec succès')
      form.reset()
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Jean Dupont" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jean@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Votre message..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi...' : 'Envoyer'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 6. TypeScript — Conventions

### Types vs Interfaces
```typescript
// Interface pour les objets (préféré)
interface UserProfile {
  id: string
  prenom: string
  nom: string
  role: 'couple' | 'prestataire'
  onboarding_completed: boolean
  created_at: string
}

// Type pour les unions, intersections, utilitaires
type DemandeStatus = 'new' | 'in-progress' | 'accepted' | 'rejected' | 'completed'
type EventStatus = 'confirmed' | 'pending' | 'cancelled'
type MilestoneStatus = 'todo' | 'in-progress' | 'done'

// Type utilitaire
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type WithId<T> = T & { id: string }
```

### Pas de `any` — alternatives

```typescript
// ❌ Mauvais
function process(data: any) { ... }

// ✅ Bon — unknown avec narrowing
function process(data: unknown) {
  if (typeof data === 'string') { ... }
  if (data instanceof Error) { ... }
}

// ✅ Bon — générique
function process<T extends Record<string, unknown>>(data: T): T { ... }

// ✅ Bon — type spécifique
import type { Database } from '@/types/database.types'
type Demande = Database['public']['Tables']['demandes']['Row']
```

### Types depuis la base de données

```typescript
import type { Database } from '@/types/database.types'

// Types de table
type Profile = Database['public']['Tables']['profiles']['Row']
type Demande = Database['public']['Tables']['demandes']['Row']
type Message = Database['public']['Tables']['messages']['Row']

// Types d'insertion
type NewDemande = Database['public']['Tables']['demandes']['Insert']

// Types de mise à jour
type UpdateDemande = Database['public']['Tables']['demandes']['Update']

// Enum types
type DemandeStatus = Database['public']['Enums']['demande_status']
```

### Props de composants

```typescript
// Toujours typer les props
interface CardProps {
  title: string
  description?: string
  status: DemandeStatus
  onAccept: (id: string) => void
  onReject: (id: string) => void
  className?: string  // Pour cn() composition
}

export function DemandeCard({ title, description, status, onAccept, onReject, className }: CardProps) {
  return (
    <div className={cn('...', className)}>
      ...
    </div>
  )
}
```

---

## 7. Zustand — State Management

```typescript
// store/onboarding-store.ts — pattern existant
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  role: 'couple' | 'prestataire' | null
  step: number
  formData: Partial<OnboardingFormData>
  setRole: (role: 'couple' | 'prestataire') => void
  setStep: (step: number) => void
  updateFormData: (data: Partial<OnboardingFormData>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      role: null,
      step: 1,
      formData: {},
      setRole: (role) => set({ role }),
      setStep: (step) => set({ step }),
      updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
      })),
      reset: () => set({ role: null, step: 1, formData: {} }),
    }),
    { name: 'nuply-onboarding' }
  )
)

// Usage dans un composant
const { role, step, setRole, setStep } = useOnboardingStore()
```

---

## 8. Custom Hooks

```typescript
// hooks/use-profile.ts — pattern existant
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return { profile, loading, error }
}
```

---

## 9. Metadata & SEO

```typescript
// app/couple/dashboard/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tableau de bord — NUPLY',
  description: 'Gérez votre mariage depuis votre tableau de bord NUPLY.',
  robots: { index: false },  // pages privées non indexées
}

// Pour les pages publiques avec données dynamiques
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  return {
    title: `${post.title} — Blog NUPLY`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.cover_image }],
    },
  }
}
```

---

## 10. Error Handling — Patterns complets

```typescript
// Dans un Server Component
export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.from('table').select()

  if (error) {
    // Option 1 : laisser error.tsx gérer
    throw new Error('Failed to load data')

    // Option 2 : afficher un état vide
    // return <EmptyState ... />

    // Option 3 : redirect
    // redirect('/error')
  }

  return <Component data={data} />
}

// Dans une API Route
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // ...
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = getErrorMessage(error)
    console.error('[API /api/xxx]', message)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

// Dans un composant client
async function handleSubmit() {
  try {
    const result = await someAction()
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Succès !')
  } catch (error) {
    toast.error(getErrorMessage(error))
  }
}
```

---

## 11. Rate Limiting

```typescript
// app/api/contact/route.ts
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(req: NextRequest) {
  try {
    await limiter.check(req, 10, 'CONTACT_FORM')  // max 10 req/min
  } catch {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
      { status: 429 }
    )
  }

  // ... traiter la requête
}
```

---

## 12. Storage Supabase

```typescript
// Upload fichier
const supabase = await createClient()

const { data, error } = await supabase.storage
  .from('portfolio-images')
  .upload(`${userId}/${Date.now()}-${file.name}`, file, {
    cacheControl: '3600',
    upsert: false,
  })

if (error) throw error

// Récupérer l'URL publique
const { data: { publicUrl } } = supabase.storage
  .from('portfolio-images')
  .getPublicUrl(data.path)

// Upload privé (message-attachments)
const { data: privateFile, error: uploadError } = await supabase.storage
  .from('message-attachments')
  .upload(`${conversationId}/${file.name}`, file)

// Signed URL pour accès temporaire
const { data: { signedUrl } } = await supabase.storage
  .from('message-attachments')
  .createSignedUrl(filePath, 3600)  // expire en 1h
```

---

## 13. Navigation & Routing

```typescript
// Redirect côté serveur
import { redirect } from 'next/navigation'
redirect('/sign-in')

// Navigation côté client
'use client'
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/couple/dashboard')
router.replace('/sign-in')  // sans historique
router.refresh()  // refresh Server Components

// Params dynamiques
// app/blog/[slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BlogPost({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page } = await searchParams
  // ...
}

// Lien avec prefetch
import Link from 'next/link'
<Link href="/couple/dashboard" prefetch={false}>Dashboard</Link>
```

---

## 14. Stripe — Patterns

```typescript
// Créer une session checkout
// app/api/stripe/create-checkout-session/route.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await req.json()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/couple/paiements?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tarifs`,
    customer_email: user.email,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
```

---

## 15. Email avec Resend

```typescript
// lib/email/send.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const { data, error } = await resend.emails.send({
    from: 'NUPLY <no-reply@nuply.fr>',
    to,
    subject,
    html,
  })

  if (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }

  return data
}
```

---

## 16. OpenAI / Vercel AI SDK

```typescript
// app/api/chatbot/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'Tu es NUPLY, un assistant mariage expert et bienveillant...',
    messages,
    maxTokens: 1024,
  })

  return result.toDataStreamResponse()
}

// Côté client (hooks/useChatbot.ts utilise useChat)
'use client'
import { useChat } from '@ai-sdk/react'

export function useChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chatbot',
  })

  return { messages, input, handleInputChange, handleSubmit, isLoading }
}
```

---

## 17. Caching

```typescript
// lib/cache.ts — LRU cache
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, unknown>({
  max: 500,
  ttl: 1000 * 60 * 5,  // 5 minutes
})

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

export function setCached(key: string, value: unknown): void {
  cache.set(key, value)
}

// Utilisation
const cacheKey = `prestataires:${type}:${ville}`
const cached = getCached<Prestataire[]>(cacheKey)
if (cached) return cached

const data = await fetchPrestataires(type, ville)
setCached(cacheKey, data)
return data
```

---

## 18. Structure d'une page dashboard complète

```typescript
// app/couple/favoris/page.tsx — Server Component avec données
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { FavorisClient } from './favoris-client'

export const metadata: Metadata = {
  title: 'Mes favoris — NUPLY',
  robots: { index: false },
}

export default async function FavorisPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: favoris, error } = await supabase
    .from('favoris')
    .select(`
      id,
      prestataire_id,
      prestataire_profiles!inner(
        nom_entreprise,
        type_prestation,
        ville_exercice,
        tarif_min,
        tarif_max
      ),
      prestataire_public_profiles(
        rating,
        total_reviews,
        is_verified,
        description
      )
    `)
    .eq('couple_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return <FavorisClient favoris={favoris ?? []} userId={user.id} />
}
```

```typescript
// app/couple/favoris/favoris-client.tsx — Client Component pour interactions
'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HeartOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { removeFavori } from '@/lib/actions/favoris'

interface Props {
  favoris: FavoriWithProfile[]
  userId: string
}

export function FavorisClient({ favoris: initialFavoris, userId }: Props) {
  const [favoris, setFavoris] = useState(initialFavoris)
  const [isPending, startTransition] = useTransition()

  function handleRemove(favoriId: string) {
    startTransition(async () => {
      const result = await removeFavori(favoriId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setFavoris(prev => prev.filter(f => f.id !== favoriId))
      toast.success('Retiré des favoris')
    })
  }

  if (favoris.length === 0) {
    return (
      <EmptyState
        icon={<HeartOff className="w-8 h-8 text-violet-400" />}
        title="Aucun favori"
        description="Ajoutez des prestataires à vos favoris pour les retrouver facilement."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favoris.map(favori => (
        <FavoriCard
          key={favori.id}
          favori={favori}
          onRemove={() => handleRemove(favori.id)}
          disabled={isPending}
        />
      ))}
    </div>
  )
}
```

---

## 19. Middleware & Protection des routes

```typescript
// middleware.ts (racine)
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

La logique de protection des rôles est dans `lib/auth/middleware.ts` :
- `/couple/*` → requiert `role = 'couple'`
- `/prestataire/*` → requiert `role = 'prestataire'`
- `/admin/*` → requiert rôle admin

---

## 20. Conventions de fichiers

```
# Page + composant client séparés (pattern recommandé)
app/couple/[feature]/
  page.tsx           # Server Component (données, metadata)
  [feature]-client.tsx  # Client Component (interactions)
  loading.tsx        # Skeleton de chargement
  error.tsx          # Gestion erreur spécifique

# Composants partagés d'un espace
components/couple/shared/
  BudgetWidget.tsx
  TimelineCard.tsx

# Actions server d'un domaine
lib/actions/
  demandes.ts
  favoris.ts
  messages.ts

# Validations Zod groupées
lib/validations/
  demande.ts
  profile.ts
  onboarding.ts
```

---

*Dernière mise à jour: 2026-02-27*
