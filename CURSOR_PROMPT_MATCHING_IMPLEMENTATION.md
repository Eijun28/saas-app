# PROMPT CURSOR - IMPLÉMENTATION MATCHING IA COMPLET

## CONTEXTE
Implémenter le système de matching intelligent basé sur un algorithme de scoring à 6 critères pondérés + chat IA (Nora) pour collecter les informations.

**Vision :** Matching hyper-personnalisé qui calcule un score 0-100% pour chaque prestataire selon l'affinité culturelle, budget, disponibilité, localisation, style et réputation.

---

## 🎯 ARCHITECTURE GLOBALE

### Flux Utilisateur
```
1. Couple remplit profil → couples_profiles
2. Couple va sur Matching → Sélectionne service (Traiteur, DJ, etc.)
3. Chat IA (Nora) s'ouvre → Pose questions contextuelles
4. Couple répond → Budget, styles, préférences
5. Système calcule scores → Pour tous les prestataires du service
6. Top 10 affichés → Triés par score avec explications
7. Couple contacte → Message pré-rempli au prestataire
```

### Tables Supabase Nécessaires

#### Table 1 : `couples_profiles`
```sql
CREATE TABLE IF NOT EXISTS couples_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  couple_id UUID REFERENCES couples(id),
  prenom_1 TEXT,
  prenom_2 TEXT,
  cultures TEXT[] DEFAULT '{}',
  wedding_date DATE,
  wedding_city TEXT,
  wedding_region TEXT,
  guests_count INTEGER,
  budget_global INTEGER,
  style TEXT, -- fusion_moderne, traditionnel, boheme, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table 2 : `couple_budgets`
```sql
CREATE TABLE IF NOT EXISTS couple_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id),
  service_type TEXT NOT NULL, -- traiteur, photographe, dj, etc.
  budget_min INTEGER,
  budget_max INTEGER,
  priority INTEGER DEFAULT 5, -- 1-10 (importance du service)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, service_type)
);
```

#### Table 3 : `providers` (extension de profiles existant)
```sql
-- Ajouter colonnes à la table profiles existante
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_types TEXT[] DEFAULT '{}'; -- ['traiteur', 'dj']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cultures TEXT[] DEFAULT '{}'; -- ['french', 'algerian', 'moroccan']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 500;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_min INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_max INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}'; -- ['fusion_moderne', 'traditionnel']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disponibilites JSONB DEFAULT '[]'; -- [{date: '2026-06-15', available: true}]
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

#### Table 4 : `match_scores`
```sql
CREATE TABLE IF NOT EXISTS match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id),
  provider_id UUID REFERENCES profiles(id),
  service_type TEXT NOT NULL,

  -- Scores individuels (0-100)
  cultural_score DECIMAL(5,2) DEFAULT 0,
  budget_score DECIMAL(5,2) DEFAULT 0,
  availability_score DECIMAL(5,2) DEFAULT 0,
  location_score DECIMAL(5,2) DEFAULT 0,
  style_score DECIMAL(5,2) DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 0,

  -- Score total pondéré (0-100)
  total_score DECIMAL(5,2) DEFAULT 0,

  -- Explications
  match_explanation JSONB, -- Détails du pourquoi

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(couple_id, provider_id, service_type)
);

-- Index pour performances
CREATE INDEX idx_match_scores_couple ON match_scores(couple_id);
CREATE INDEX idx_match_scores_total ON match_scores(total_score DESC);
```

#### Table 5 : `chat_conversations`
```sql
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id),
  service_type TEXT, -- traiteur, dj, photographe
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  context JSONB, -- Toutes les infos collectées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Table 6 : `chat_messages`
```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'assistant' (Nora) ou 'user' (couple)
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id, created_at);
```

---

## 🤖 PARTIE 1 : CHAT IA (NORA)

### 1.1 Backend - Route API Chat

```typescript
// CRÉER : app/api/matching/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { logger } from '@/lib/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { conversationId, message, serviceType } = await request.json()

    // 1. Récupérer le profil du couple
    const { data: coupleProfile } = await supabase
      .from('couples_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. Récupérer ou créer la conversation
    let conversation
    if (conversationId) {
      const { data } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()
      conversation = data
    } else {
      const { data } = await supabase
        .from('chat_conversations')
        .insert({
          couple_id: user.id,
          service_type: serviceType,
          context: {},
        })
        .select()
        .single()
      conversation = data
    }

    // 3. Sauvegarder le message utilisateur
    await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
    })

    // 4. Construire le contexte pour l'IA
    const systemPrompt = `Tu es Nora, l'assistante IA de Nuply, spécialisée dans l'organisation de mariages.

Informations sur le couple :
- Prénoms : ${coupleProfile?.prenom_1 || 'Non renseigné'} et ${coupleProfile?.prenom_2 || 'Non renseigné'}
- Cultures : ${coupleProfile?.cultures?.join(', ') || 'Non renseignées'}
- Date du mariage : ${coupleProfile?.wedding_date || 'Non renseignée'}
- Ville : ${coupleProfile?.wedding_city || 'Non renseignée'}
- Nombre d'invités : ${coupleProfile?.guests_count || 'Non renseigné'}
- Budget global : ${coupleProfile?.budget_global || 'Non renseigné'}€
- Style : ${coupleProfile?.style || 'Non renseigné'}

Service recherché : ${serviceType}

Ta mission :
1. Poser des questions ciblées pour comprendre leurs besoins SPÉCIFIQUES pour ce service
2. Collecter : budget min/max, préférences culturelles, styles, critères importants
3. Être chaleureuse, professionnelle et efficace
4. Ne pas redemander des infos déjà connues
5. Garder les réponses courtes et engageantes

Quand tu as toutes les infos nécessaires, dis clairement "J'ai toutes les informations ! Je lance la recherche de vos prestataires parfaits 🎉"`

    // 5. Récupérer l'historique
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })

    // 6. Appeler OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...(messages || []).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const assistantMessage = completion.choices[0].message.content

    // 7. Sauvegarder la réponse de l'IA
    await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: assistantMessage,
    })

    // 8. Extraire les informations structurées (budget, etc.)
    const extractedData = await extractBudgetAndPreferences(assistantMessage, message)

    if (extractedData.budget_min || extractedData.budget_max) {
      // Sauvegarder dans couple_budgets
      await supabase.from('couple_budgets').upsert({
        couple_id: user.id,
        service_type: serviceType,
        budget_min: extractedData.budget_min,
        budget_max: extractedData.budget_max,
      })
    }

    // 9. Mettre à jour le contexte
    await supabase
      .from('chat_conversations')
      .update({
        context: {
          ...conversation.context,
          ...extractedData,
        },
      })
      .eq('id', conversation.id)

    return NextResponse.json({
      conversationId: conversation.id,
      message: assistantMessage,
      extractedData,
    })
  } catch (error) {
    logger.error('Error in chat API', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du message' },
      { status: 500 }
    )
  }
}

// Fonction pour extraire budget et préférences du message
async function extractBudgetAndPreferences(assistantMsg: string, userMsg: string) {
  // Regex pour détecter budget (ex: "8000 à 10000", "8k-10k", etc.)
  const budgetRegex = /(\d{1,2}[,.]?\d{0,3})\s*(?:€|euros?|k)?\s*(?:à|[-–])\s*(\d{1,2}[,.]?\d{0,3})\s*(?:€|euros?|k)?/i
  const match = userMsg.match(budgetRegex)

  let budget_min, budget_max

  if (match) {
    budget_min = parseInt(match[1].replace(/[,.]/, '')) * (match[1].includes('k') ? 1000 : 1)
    budget_max = parseInt(match[2].replace(/[,.]/, '')) * (match[2].includes('k') ? 1000 : 1)
  }

  return {
    budget_min,
    budget_max,
    // Autres extractions possibles (styles, etc.)
  }
}
```

### 1.2 Frontend - Composant Chat

```typescript
// CRÉER : components/matching/ChatInterface.tsx

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatInterfaceProps {
  serviceType: string
  onComplete: (conversationId: string) => void
}

export function ChatInterface({ serviceType, onComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Message de bienvenue
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Bonjour ! Je suis Nora, votre assistante IA chez Nuply 🎉\n\nJe vais vous aider à trouver le ${serviceType} parfait pour votre mariage !\n\nPour commencer, quel budget avez-vous prévu pour ce service ?`,
      },
    ])
  }, [serviceType])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch('/api/matching/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
          serviceType,
        }),
      })

      const data = await response.json()

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])

      // Détecter si la conversation est terminée
      if (data.message.includes('Je lance la recherche')) {
        setTimeout(() => {
          onComplete(data.conversationId)
        }, 2000)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Désolée, une erreur s'est produite. Pouvez-vous réessayer ?",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 h-[600px] flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">Nora réfléchit...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Tapez votre message..."
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
```

---

## 🧮 PARTIE 2 : ALGORITHME DE SCORING

### 2.1 Backend - Fonction de Calcul

```typescript
// CRÉER : lib/matching/calculate-scores.ts

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Pondérations (total = 100%)
const WEIGHTS = {
  cultural: 0.35,  // 35%
  budget: 0.25,    // 25%
  availability: 0.15, // 15%
  location: 0.10,  // 10%
  style: 0.10,     // 10%
  reputation: 0.05 // 5%
}

interface MatchingParams {
  coupleId: string
  serviceType: string
  cultures: string[]
  weddingDate: string
  weddingCity: string
  budgetMin: number
  budgetMax: number
  guestsCount: number
  style: string
}

export async function calculateMatchScores(params: MatchingParams) {
  const supabase = await createClient()

  // 1. Récupérer tous les prestataires du service
  const { data: providers, error } = await supabase
    .from('profiles')
    .select('*')
    .contains('service_types', [params.serviceType])
    .eq('is_active', true)
    .gte('max_guests', params.guestsCount)

  if (error || !providers) {
    logger.error('Error fetching providers', error)
    return []
  }

  logger.info(`Found ${providers.length} providers for ${params.serviceType}`)

  // 2. Calculer le score pour chaque prestataire
  const scoredProviders = providers.map(provider => {
    const scores = {
      cultural: calculateCulturalScore(params.cultures, provider.cultures || []),
      budget: calculateBudgetScore(params.budgetMin, params.budgetMax, provider.budget_min, provider.budget_max),
      availability: calculateAvailabilityScore(params.weddingDate, provider.disponibilites),
      location: calculateLocationScore(params.weddingCity, provider.service_city, provider.service_region),
      style: calculateStyleScore(params.style, provider.style_tags || []),
      reputation: calculateReputationScore(provider.average_rating, provider.total_reviews),
    }

    const totalScore = (
      scores.cultural * WEIGHTS.cultural +
      scores.budget * WEIGHTS.budget +
      scores.availability * WEIGHTS.availability +
      scores.location * WEIGHTS.location +
      scores.style * WEIGHTS.style +
      scores.reputation * WEIGHTS.reputation
    )

    return {
      provider,
      scores,
      totalScore: Math.round(totalScore * 100) / 100,
      explanation: generateExplanation(scores, params, provider)
    }
  })

  // 3. Filtrer et trier
  const filteredProviders = scoredProviders
    .filter(p => p.totalScore >= 40) // Minimum 40% de match
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10) // Top 10

  // 4. Sauvegarder dans match_scores
  for (const { provider, scores, totalScore, explanation } of filteredProviders) {
    await supabase.from('match_scores').upsert({
      couple_id: params.coupleId,
      provider_id: provider.id,
      service_type: params.serviceType,
      cultural_score: scores.cultural,
      budget_score: scores.budget,
      availability_score: scores.availability,
      location_score: scores.location,
      style_score: scores.style,
      reputation_score: scores.reputation,
      total_score: totalScore,
      match_explanation: explanation,
      calculated_at: new Date().toISOString(),
    })
  }

  return filteredProviders
}

// Score affinité culturelle (0-100)
function calculateCulturalScore(coupleCultures: string[], providerCultures: string[]): number {
  if (coupleCultures.length === 0) return 70 // Neutre

  const matches = coupleCultures.filter(c => providerCultures.includes(c)).length
  return (matches / coupleCultures.length) * 100
}

// Score budget (0-100)
function calculateBudgetScore(coupleMin: number, coupleMax: number, providerMin?: number, providerMax?: number): number {
  if (!providerMin || !providerMax) return 50 // Pas d'info = neutre

  const providerAvg = (providerMin + providerMax) / 2
  const coupleAvg = (coupleMin + coupleMax) / 2

  // Si dans la fourchette exacte = 100
  if (providerAvg >= coupleMin && providerAvg <= coupleMax) {
    return 100
  }

  // Sinon, calculer la distance
  const distance = Math.abs(providerAvg - coupleAvg)
  const maxDistance = coupleAvg * 0.5 // 50% d'écart max

  const score = Math.max(0, 100 - (distance / maxDistance) * 100)
  return score
}

// Score disponibilité (0-100)
function calculateAvailabilityScore(weddingDate: string, disponibilites: any): number {
  if (!disponibilites || !Array.isArray(disponibilites)) return 50

  const isAvailable = disponibilites.some((d: any) => d.date === weddingDate && d.available)
  return isAvailable ? 100 : 0
}

// Score localisation (0-100)
function calculateLocationScore(weddingCity: string, providerCity?: string, providerRegion?: string): number {
  if (!providerCity && !providerRegion) return 50

  if (providerCity?.toLowerCase() === weddingCity?.toLowerCase()) {
    return 100 // Même ville
  }

  // TODO: Calculer distance géographique réelle avec API
  return 60 // Même région approximativement
}

// Score style (0-100)
function calculateStyleScore(coupleStyle: string, providerStyles: string[]): number {
  if (!coupleStyle || providerStyles.length === 0) return 50

  const matches = providerStyles.includes(coupleStyle)
  return matches ? 100 : 40
}

// Score réputation (0-100)
function calculateReputationScore(avgRating: number, totalReviews: number): number {
  if (totalReviews === 0) return 50 // Pas d'avis = neutre

  const ratingScore = (avgRating / 5) * 100 // Note sur 5 → sur 100

  // Facteur de confiance basé sur le nombre d'avis
  const confidenceFactor = Math.min(1, totalReviews / 50) // Max confiance à 50 avis

  return ratingScore * confidenceFactor
}

// Générer explications
function generateExplanation(scores: any, params: MatchingParams, provider: any) {
  const reasons = []

  if (scores.cultural >= 80) {
    reasons.push(`Spécialiste des cultures ${params.cultures.join(' et ')}`)
  }
  if (scores.budget >= 90) {
    reasons.push(`Budget parfaitement aligné (${provider.budget_min}-${provider.budget_max}€)`)
  }
  if (scores.availability === 100) {
    reasons.push(`Disponible le ${params.weddingDate}`)
  }
  if (scores.location >= 80) {
    reasons.push(`Basé à ${provider.service_city || provider.service_region}`)
  }
  if (scores.style >= 80) {
    reasons.push(`Style ${params.style} maîtrisé`)
  }
  if (scores.reputation >= 80) {
    reasons.push(`Excellente réputation (${provider.average_rating}/5, ${provider.total_reviews} avis)`)
  }

  return {
    reasons,
    scores,
  }
}
```

### 2.2 Route API Matching

```typescript
// CRÉER : app/api/matching/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateMatchScores } from '@/lib/matching/calculate-scores'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { serviceType, conversationId } = await request.json()

    // 1. Récupérer le profil couple
    const { data: profile } = await supabase
      .from('couples_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // 2. Récupérer le budget
    const { data: budget } = await supabase
      .from('couple_budgets')
      .select('*')
      .eq('couple_id', user.id)
      .eq('service_type', serviceType)
      .single()

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget non défini pour ce service' },
        { status: 400 }
      )
    }

    // 3. Calculer les scores
    const results = await calculateMatchScores({
      coupleId: user.id,
      serviceType,
      cultures: profile.cultures || [],
      weddingDate: profile.wedding_date,
      weddingCity: profile.wedding_city,
      budgetMin: budget.budget_min,
      budgetMax: budget.budget_max,
      guestsCount: profile.guests_count,
      style: profile.style,
    })

    logger.info(`Calculated ${results.length} matches for ${serviceType}`)

    return NextResponse.json({ results })
  } catch (error) {
    logger.error('Error calculating matches', error)
    return NextResponse.json(
      { error: 'Erreur lors du calcul des matches' },
      { status: 500 }
    )
  }
}
```

---

## 🎨 PARTIE 3 : FRONTEND MATCHING

### 3.1 Page Matching

```typescript
// MODIFIER : app/couple/matching/page.tsx

'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components/matching/ChatInterface'
import { MatchResults } from '@/components/matching/MatchResults'
import { ServiceSelector } from '@/components/matching/ServiceSelector'
import { motion } from 'framer-motion'

export default function MatchingPage() {
  const [step, setStep] = useState<'select' | 'chat' | 'results'>('select')
  const [selectedService, setSelectedService] = useState<string>('')
  const [conversationId, setConversationId] = useState<string>('')
  const [matches, setMatches] = useState([])

  const handleServiceSelect = (service: string) => {
    setSelectedService(service)
    setStep('chat')
  }

  const handleChatComplete = async (convId: string) => {
    setConversationId(convId)

    // Calculer les matches
    const response = await fetch('/api/matching/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceType: selectedService,
        conversationId: convId,
      }),
    })

    const data = await response.json()
    setMatches(data.results)
    setStep('results')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center mb-8"
        >
          Matching IA ✨
        </motion.h1>

        {step === 'select' && (
          <ServiceSelector onSelect={handleServiceSelect} />
        )}

        {step === 'chat' && (
          <ChatInterface
            serviceType={selectedService}
            onComplete={handleChatComplete}
          />
        )}

        {step === 'results' && (
          <MatchResults matches={matches} serviceType={selectedService} />
        )}
      </div>
    </div>
  )
}
```

### 3.2 Composant Résultats

```typescript
// CRÉER : components/matching/MatchResults.tsx

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Star, MapPin, Users, Euro, Heart } from 'lucide-react'

interface Match {
  provider: any
  scores: any
  totalScore: number
  explanation: any
}

interface MatchResultsProps {
  matches: Match[]
  serviceType: string
}

export function MatchResults({ matches, serviceType }: MatchResultsProps) {
  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-600">
          Aucun prestataire ne correspond à vos critères. Essayez d'ajuster votre budget ou vos préférences.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Nous avons trouvé {matches.length} {serviceType}(s) parfait(s) pour vous ! 🎉
        </h2>
        <p className="text-gray-600">
          Triés par compatibilité avec vos critères
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {matches.map((match, index) => (
          <motion.div
            key={match.provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center text-white text-2xl font-bold">
                  {match.provider.nom_entreprise?.[0] || match.provider.prenom?.[0] || 'P'}
                </div>

                {/* Infos */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {match.provider.nom_entreprise || `${match.provider.prenom} ${match.provider.nom}`}
                      </h3>
                      <p className="text-gray-600 mt-1">
                        {match.provider.description_courte}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-[#823F91] to-[#9D5FA8] bg-clip-text text-transparent">
                        {match.totalScore}%
                      </div>
                      <p className="text-sm text-gray-500">Match</p>
                    </div>
                  </div>

                  {/* Raisons */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Pourquoi ce prestataire ?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {match.explanation.reasons.map((reason: string, i: number) => (
                        <Badge
                          key={i}
                          className="bg-purple-100 text-purple-800 border-0"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    {match.provider.service_city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {match.provider.service_city}
                      </div>
                    )}
                    {match.provider.average_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {match.provider.average_rating}/5 ({match.provider.total_reviews} avis)
                      </div>
                    )}
                    {match.provider.budget_min && (
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {match.provider.budget_min}-{match.provider.budget_max}€
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-gradient-to-r from-[#823F91] to-[#9D5FA8]"
                      onClick={() => {/* TODO: Envoyer demande */}}
                    >
                      Envoyer une demande
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Voir le profil
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scores détaillés (collapsible) */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  Voir les scores détaillés
                </summary>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  <ScoreDetail label="Affinité culturelle" score={match.scores.cultural} />
                  <ScoreDetail label="Budget" score={match.scores.budget} />
                  <ScoreDetail label="Disponibilité" score={match.scores.availability} />
                  <ScoreDetail label="Localisation" score={match.scores.location} />
                  <ScoreDetail label="Style" score={match.scores.style} />
                  <ScoreDetail label="Réputation" score={match.scores.reputation} />
                </div>
              </details>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ScoreDetail({ label, score }: { label: string; score: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-[#823F91] to-[#9D5FA8] h-2 rounded-full transition-all"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm font-semibold">{Math.round(score)}%</span>
      </div>
    </div>
  )
}
```

---

## 🗃️ PARTIE 4 : MIGRATIONS SUPABASE

```sql
-- CRÉER : supabase/migrations/YYYYMMDDHHMMSS_matching_system.sql

-- 1. Table couples_profiles
CREATE TABLE IF NOT EXISTS couples_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  couple_id UUID REFERENCES couples(id),
  prenom_1 TEXT,
  prenom_2 TEXT,
  cultures TEXT[] DEFAULT '{}',
  wedding_date DATE,
  wedding_city TEXT,
  wedding_region TEXT,
  guests_count INTEGER,
  budget_global INTEGER,
  style TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table couple_budgets
CREATE TABLE IF NOT EXISTS couple_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id),
  service_type TEXT NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  priority INTEGER DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, service_type)
);

-- 3. Extensions profiles pour prestataires
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_types TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cultures TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 500;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_min INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS budget_max INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disponibilites JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Table match_scores
CREATE TABLE IF NOT EXISTS match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id),
  provider_id UUID REFERENCES profiles(id),
  service_type TEXT NOT NULL,
  cultural_score DECIMAL(5,2) DEFAULT 0,
  budget_score DECIMAL(5,2) DEFAULT 0,
  availability_score DECIMAL(5,2) DEFAULT 0,
  location_score DECIMAL(5,2) DEFAULT 0,
  style_score DECIMAL(5,2) DEFAULT 0,
  reputation_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0,
  match_explanation JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, provider_id, service_type)
);

CREATE INDEX idx_match_scores_couple ON match_scores(couple_id);
CREATE INDEX idx_match_scores_total ON match_scores(total_score DESC);
CREATE INDEX idx_match_scores_service ON match_scores(service_type);

-- 5. Table chat_conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id),
  service_type TEXT,
  status TEXT DEFAULT 'active',
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conv ON chat_messages(conversation_id, created_at);

-- 7. RLS Policies
ALTER TABLE couples_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Couples peuvent voir/modifier leur profil
CREATE POLICY "Couples can view own profile" ON couples_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Couples can update own profile" ON couples_profiles FOR UPDATE USING (auth.uid() = id);

-- Couples peuvent gérer leurs budgets
CREATE POLICY "Couples can manage budgets" ON couple_budgets FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid()));

-- Couples peuvent voir leurs scores
CREATE POLICY "Couples can view match scores" ON match_scores FOR SELECT USING (couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid()));

-- Couples peuvent gérer leurs conversations
CREATE POLICY "Couples can manage conversations" ON chat_conversations FOR ALL USING (couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid()));
CREATE POLICY "Couples can view messages" ON chat_messages FOR SELECT USING (conversation_id IN (SELECT id FROM chat_conversations WHERE couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())));
CREATE POLICY "Couples can insert messages" ON chat_messages FOR INSERT WITH CHECK (conversation_id IN (SELECT id FROM chat_conversations WHERE couple_id IN (SELECT id FROM couples WHERE user_id = auth.uid())));
```

---

## 🎯 CHECKLIST D'IMPLÉMENTATION

### Phase 1 : Base de données
- [ ] Appliquer migration Supabase
- [ ] Vérifier RLS activé sur toutes les tables
- [ ] Créer quelques prestataires de test avec toutes les colonnes remplies

### Phase 2 : Backend Chat IA
- [ ] Installer OpenAI SDK : `npm install openai`
- [ ] Ajouter OPENAI_API_KEY dans .env.local
- [ ] Créer `/app/api/matching/chat/route.ts`
- [ ] Créer fonction extraction budget/préférences
- [ ] Tester avec Postman/Thunder Client

### Phase 3 : Frontend Chat
- [ ] Créer `/components/matching/ChatInterface.tsx`
- [ ] Créer `/components/matching/ServiceSelector.tsx`
- [ ] Intégrer dans `/app/couple/matching/page.tsx`
- [ ] Tester flow complet chat

### Phase 4 : Algorithme Scoring
- [ ] Créer `/lib/matching/calculate-scores.ts`
- [ ] Implémenter les 6 fonctions de score
- [ ] Créer `/app/api/matching/calculate/route.ts`
- [ ] Tester avec données réelles

### Phase 5 : Affichage Résultats
- [ ] Créer `/components/matching/MatchResults.tsx`
- [ ] Intégrer dans page matching
- [ ] Tester avec différents scores

### Phase 6 : Optimisations
- [ ] Cacher les calculs (Redis optionnel)
- [ ] Ajouter loading states élégants
- [ ] Améliorer extraction NLP (budget, styles)
- [ ] Ajouter analytics matching

---

## 📝 NOTES IMPORTANTES

1. **OpenAI API Key** :
   - Créer compte sur platform.openai.com
   - Générer clé API
   - Ajouter dans `.env.local` : `OPENAI_API_KEY=sk-...`

2. **Coûts OpenAI** :
   - GPT-4 : ~$0.03 par conversation
   - Prévoir budget ou passer à GPT-3.5-turbo (moins cher)

3. **Données de test** :
   - Créer 5-10 prestataires par service
   - Remplir TOUTES les colonnes (cultures, budget, styles, etc.)
   - Tester avec différents profils couples

4. **Performance** :
   - Calculer les scores en background (queue Supabase Edge Functions optionnel)
   - Cacher les résultats dans match_scores
   - Invalider cache si prestataire modifie profil

5. **Améliorations futures** :
   - Machine Learning pour ajuster pondérations
   - A/B testing des poids
   - Feedback utilisateur sur pertinence
   - Géolocalisation précise (API Google Maps)

---

**FIN DU PROMPT MATCHING**
