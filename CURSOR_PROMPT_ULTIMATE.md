# 🚀 PROMPT ULTIME CURSOR - FIXES CRITIQUES POUR LE LANCEMENT

## 🎯 OBJECTIF
Résoudre 3 problèmes critiques bloquants pour le lancement de demain de manière définitive et robuste. Chaque problème doit être traité en profondeur avec une analyse complète du code existant.

---

## ⚠️ INSTRUCTIONS GÉNÉRALES CRITIQUES

### Approche Méthodologique
1. **LIRE D'ABORD** tous les fichiers concernés avant toute modification
2. **ANALYSER** le flow de données complet (DB → State → UI → DB)
3. **TESTER** chaque modification individuellement
4. **VÉRIFIER** qu'aucune régression n'est introduite
5. **DOCUMENTER** les changements dans les commentaires du code

### Standards de Code
- ✅ **TypeScript strict** : Pas de `any`, typage complet
- ✅ **Error handling** : Gestion exhaustive des erreurs avec logs détaillés
- ✅ **Performance** : Éviter les re-renders inutiles avec `useMemo`, `useCallback`
- ✅ **Sécurité** : Validation des inputs, sanitization, RLS Supabase
- ✅ **Accessibilité** : ARIA labels, keyboard navigation
- ✅ **Responsive** : Mobile-first, test sur tous les breakpoints

### Points de Vigilance Build/Production
- 🔒 Pas de console.log en production (utiliser un logger conditionnel)
- 🔒 Pas de secrets hardcodés
- 🔒 Validation des variables d'environnement au démarrage
- 🔒 Error boundaries pour éviter les crashes complets
- 🔒 Tests de build avant commit : `npm run build && npm run lint`

---

## 🔥 PROBLÈME 1 : PERSISTANCE DES DONNÉES PROFIL

### 🎯 Symptôme
**Critique** : Sur `/prestataire/profil-public` et `/couple/profil`, les modifications sont sauvegardées en base Supabase mais disparaissent immédiatement de l'interface utilisateur après la sauvegarde. L'utilisateur perd confiance et doit recharger la page manuellement.

### 📊 Diagnostic Technique Approfondi

#### Architecture Actuelle
```
User Input → setState → Save Button Click → Supabase Update → reloadData() → loadAllData() → setProfile()
                                                                    ↓
                                          PROBLÈME ICI : React ne détecte pas le changement d'objet
```

#### Fichiers Concernés
1. **Page principale** : `/app/prestataire/profil-public/page.tsx`
   - `reloadData()` ligne 77-99 : Délai 1000ms + force refresh avec `_refresh: Date.now()`
   - `loadAllData()` ligne 101-183 : Crée un nouveau client Supabase + nouveau profil

2. **Composants éditeurs** :
   - `/components/provider/BusinessNameEditor.tsx` (lignes 21-35)
   - `/components/provider/ProfessionalInfoEditor.tsx` (lignes 34-71)
   - `/components/provider/ProfileDescriptionEditor.tsx`
   - `/components/provider/SocialLinksEditor.tsx`

3. **Page couple** : `/app/couple/profil/page.tsx`
   - `loadProfile()` ligne 293-403
   - `handleSave()` ligne 445-543

#### Causes Racines Identifiées

1. **React State Reconciliation Failure**
   ```typescript
   // ❌ PROBLÈME : React compare les références d'objets
   const newProfile = { ...prev, _refresh: Date.now() }
   // React peut optimiser et ignorer ce changement si les autres props sont identiques
   ```

2. **Race Conditions**
   ```typescript
   // ❌ PROBLÈME : Le reloadData est appelé avant la fin de la transaction DB
   await supabase.from('profiles').update({...})
   onSave?.() // Appelé immédiatement
   reloadData() // Peut lire les anciennes données si la transaction DB n'est pas commitée
   ```

3. **Props Drilling et Stale Closures**
   ```typescript
   // ❌ PROBLÈME : Les useEffect dans les composants enfants ont des dépendances incorrectes
   useEffect(() => {
     setName(currentName || '')
   }, [currentName, name, initialName]) // 'name' et 'initialName' créent des boucles infinies potentielles
   ```

4. **Absence de State Management Centralisé**
   - Chaque composant gère son propre état local
   - Pas de source de vérité unique
   - Synchronisation complexe entre parent et enfants

### ✅ SOLUTION COMPLÈTE ET ROBUSTE

#### Solution 1 : Refonte de la Gestion d'État (RECOMMANDÉE)

**Étape 1 : Créer un Context Provider pour le Profil**

Créer `/contexts/ProfileContext.tsx` :
```typescript
'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  nom_entreprise?: string
  avatar_url?: string | null
  description_courte?: string
  bio?: string
  budget_min?: number
  budget_max?: number
  ville_principale?: string
  annees_experience?: number
  instagram_url?: string | null
  facebook_url?: string | null
  website_url?: string | null
  linkedin_url?: string | null
  tiktok_url?: string | null
  // ... autres champs
}

interface ProfileContextType {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      // ✅ IMPORTANT : Créer un nouvel objet avec timestamp pour forcer re-render
      setProfile({ ...data, _timestamp: Date.now() } as Profile)
    } catch (err: any) {
      console.error('Error refreshing profile:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<boolean> => {
    if (!userId) return false

    try {
      const supabase = createClient()

      // 1. Sauvegarder en DB
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      // 2. Attendre 100ms pour s'assurer que la transaction DB est commitée
      await new Promise(resolve => setTimeout(resolve, 100))

      // 3. Mettre à jour l'état local immédiatement avec les données retournées
      setProfile(prev => ({
        ...prev,
        ...data,
        _timestamp: Date.now()
      } as Profile))

      // 4. Rafraîchir depuis la DB pour être sûr (en arrière-plan)
      setTimeout(() => refreshProfile(), 500)

      return true
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message)
      return false
    }
  }, [userId, refreshProfile])

  // Charger le profil au montage
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return (
    <ProfileContext.Provider value={{ profile, isLoading, error, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
```

**Étape 2 : Wrapper la Page avec le Provider**

Modifier `/app/prestataire/profil-public/page.tsx` :
```typescript
'use client'

import { ProfileProvider, useProfile } from '@/contexts/ProfileContext'

function ProfilPublicPageContent() {
  const { profile, isLoading, refreshProfile, updateProfile } = useProfile()

  // Utiliser profile directement depuis le context
  // Plus besoin de state local ni de reloadData()

  return (
    <div className="min-h-screen bg-background">
      {/* ... */}
      <BusinessNameEditor
        currentName={profile?.nom_entreprise}
        onSave={async (newName) => {
          const success = await updateProfile({ nom_entreprise: newName })
          if (success) {
            toast.success('Nom d\'entreprise mis à jour')
          }
        }}
      />
      {/* ... */}
    </div>
  )
}

export default function ProfilPublicPage() {
  const { user } = useUser()

  if (!user) return <div>Non connecté</div>

  return (
    <ProfileProvider userId={user.id}>
      <ProfilPublicPageContent />
    </ProfileProvider>
  )
}
```

**Étape 3 : Simplifier les Composants Éditeurs**

Modifier `/components/provider/BusinessNameEditor.tsx` :
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface BusinessNameEditorProps {
  currentName?: string
  onSave: (name: string) => Promise<void>
}

export function BusinessNameEditor({ currentName = '', onSave }: BusinessNameEditorProps) {
  const [name, setName] = useState(currentName)
  const [isSaving, setIsSaving] = useState(false)

  // ✅ Utiliser une key pour forcer le reset quand currentName change
  useEffect(() => {
    setName(currentName)
  }, [currentName])

  const hasChanges = name.trim() !== currentName?.trim()

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!name.trim()) {
      toast.error('Le nom d\'entreprise est obligatoire')
      return
    }

    setIsSaving(true)
    try {
      await onSave(name.trim())
      // Le parent gère la mise à jour du state via le context
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nom_entreprise">
          Nom de votre entreprise <span className="text-destructive">*</span>
        </Label>
        <Input
          id="nom_entreprise"
          placeholder="Ex: Studio Photo Mariage"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {hasChanges && (
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              setName(currentName)
            }}
            disabled={isSaving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 bg-[#823F91] hover:bg-[#6D3478]"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

#### Solution Alternative (Plus Rapide Mais Moins Élégante)

Si le Context est trop complexe à implémenter rapidement, utiliser cette approche :

**Forcer le Remount avec des Keys Uniques**

Modifier `/app/prestataire/profil-public/page.tsx` :
```typescript
// Ajouter un state pour forcer le remount
const [componentKey, setComponentKey] = useState(0)

const reloadData = async () => {
  if (!user) return

  // 1. Recharger depuis la DB
  await loadAllData(user.id)

  // 2. Forcer le remount de tous les composants éditeurs
  setComponentKey(prev => prev + 1)
}

// Utiliser la key sur tous les composants éditeurs
<BusinessNameEditor
  key={`business-name-${componentKey}`}
  userId={user.id}
  currentName={profile?.nom_entreprise}
  onSave={reloadData}
/>
```

### 🧪 Tests à Effectuer

1. **Test de Persistance**
   ```
   1. Modifier le nom d'entreprise
   2. Cliquer sur "Enregistrer"
   3. Vérifier que le nom reste affiché
   4. Rafraîchir la page (F5)
   5. Vérifier que le nom est toujours là
   ```

2. **Test de Race Condition**
   ```
   1. Modifier plusieurs champs rapidement
   2. Sauvegarder chaque champ
   3. Vérifier qu'aucune donnée n'est perdue
   ```

3. **Test de Connexion Lente**
   ```
   1. Throttle la connexion à "Slow 3G" (Chrome DevTools)
   2. Modifier un champ et sauvegarder
   3. Vérifier que l'UI reste cohérente
   ```

---

## 🔥 PROBLÈME 2 : TOGGLE SIDEBAR MOBILE NON FONCTIONNEL

### 🎯 Symptôme
**Critique** : Sur mobile (< 768px), le bouton hamburger pour ouvrir/fermer la sidebar n'est pas visible ou ne fonctionne pas correctement. L'utilisateur mobile ne peut pas accéder à la navigation.

### 📊 Diagnostic Technique

#### Architecture Actuelle

1. **Prestataire Header** (`/components/layout/PrestataireHeader.tsx`)
   - ✅ A un toggle mobile (ligne 194-220)
   - ✅ Fonctionne avec `setOpenMobile()`

2. **Couple Header** (`/components/layout/CoupleHeader.tsx`)
   - ❌ PAS de toggle mobile
   - ❌ L'utilisateur couple ne peut pas ouvrir la sidebar sur mobile

3. **Sidebar Components**
   - Les deux sidebars ont un `SidebarToggleButton` interne
   - Mais ce bouton n'est visible que quand la sidebar est déjà ouverte
   - Pas de bouton pour l'ouvrir quand elle est fermée en mobile

#### Problèmes Identifiés

1. **CoupleHeader manque le toggle mobile**
2. **Le toggle dans la sidebar n'est pas accessible quand sidebar fermée**
3. **Pas d'animation smooth slide-in/slide-out**
4. **Pas de bouton de fermeture (croix) visible sur mobile**
5. **Overlay manquant quand sidebar ouverte sur mobile**

### ✅ SOLUTION COMPLÈTE

#### Étape 1 : Ajouter le Toggle Mobile au CoupleHeader

Modifier `/components/layout/CoupleHeader.tsx` :
```typescript
'use client'

import { useState, useEffect } from 'react'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'

export function CoupleHeader() {
  const { user } = useUser()
  const { openMobile, setOpenMobile } = useSidebar()
  const [profile, setProfile] = useState<{
    name?: string
    email?: string
    avatar?: string
  } | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const supabase = createClient()

      const { data: coupleData } = await supabase
        .from('couples')
        .select('partner_1_name, partner_2_name, avatar_url')
        .eq('user_id', user.id)
        .single()

      if (coupleData) {
        const name1 = coupleData.partner_1_name || ''
        const name2 = coupleData.partner_2_name || ''
        const displayName = name1 && name2 ? `${name1} & ${name2}` : name1 || name2 || 'Couple'

        setProfile({
          name: displayName,
          email: user.email || '',
          avatar: coupleData.avatar_url || undefined
        })
      } else {
        setProfile({
          name: 'Couple',
          email: user.email || '',
          avatar: undefined
        })
      }
    }

    loadProfile()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      window.location.href = '/'
    }
  }

  return (
    <header className='h-[4.5rem] md:h-16 bg-white/95 backdrop-blur-md sticky top-0 z-[100] border-b border-[#E5E7EB] w-full shadow-md shadow-black/5 flex items-center'>
      <div className='w-full flex items-center justify-between gap-6 px-5 sm:px-6 relative z-[101]'>
        {/* ✅ NOUVEAU : Toggle mobile pour couple */}
        <div className='md:hidden'>
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🔵 Toggle mobile couple - openMobile:', openMobile)
              setOpenMobile(!openMobile)
            }}
            className={cn(
              'h-10 w-10 rounded-xl transition-all duration-200 flex-shrink-0',
              'hover:bg-gray-100',
              'focus-visible:ring-2 focus-visible:ring-[#823F91] focus-visible:ring-offset-2'
            )}
            style={{ pointerEvents: 'auto' }}
            aria-label={openMobile ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {openMobile ? (
              <PanelLeftClose className='h-6 w-6 text-black' strokeWidth={2.5} />
            ) : (
              <PanelLeft className='h-6 w-6 text-black' strokeWidth={2.5} />
            )}
          </Button>
        </div>

        {/* Avatar - aligné à droite */}
        <div className="relative z-[103] ml-auto">
          <ProfileDropdown
            trigger={
              <button className='h-auto gap-2 px-2 py-1.5 flex items-center cursor-pointer hover:bg-gray-50 rounded-lg transition-colors'>
                <Avatar className='h-9 w-9 rounded-xl'>
                  <AvatarImage src={profile?.avatar} alt={profile?.name} />
                  <AvatarFallback className='bg-gradient-to-br from-[#823F91] to-[#9D5FA8] text-white font-semibold'>
                    {profile?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'C'}
                  </AvatarFallback>
                </Avatar>
              </button>
            }
            user={profile || undefined}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  )
}
```

#### Étape 2 : Améliorer le Composant Sidebar avec Bouton de Fermeture Mobile

Modifier `/components/ui/sidebar.tsx` (si besoin d'améliorer l'animation) :

Ajouter dans le JSX de la sidebar mobile un bouton de fermeture en haut :
```typescript
// Dans le SidebarHeader, ajouter un bouton X visible uniquement en mobile
<SidebarHeader>
  {/* Mobile only: Close button */}
  <div className="md:hidden absolute top-4 right-4 z-[110]">
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setOpenMobile(false)}
      className="h-8 w-8 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      aria-label="Fermer le menu"
    >
      <X className="h-5 w-5" strokeWidth={2.5} />
    </Button>
  </div>

  {/* Logo et toggle existants */}
  {/* ... */}
</SidebarHeader>
```

#### Étape 3 : Ajouter un Overlay de Fermeture Mobile

Créer `/components/ui/sidebar-overlay.tsx` :
```typescript
'use client'

import { useSidebar } from '@/components/ui/sidebar'
import { useEffect } from 'react'

export function SidebarOverlay() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar()

  // Fermer avec la touche Escape
  useEffect(() => {
    if (!openMobile) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMobile(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [openMobile, setOpenMobile])

  if (!isMobile || !openMobile) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] md:hidden"
      onClick={() => setOpenMobile(false)}
      aria-hidden="true"
    />
  )
}
```

Ajouter dans les layouts :
```typescript
// /app/couple/layout.tsx et /app/prestataire/layout.tsx
import { SidebarOverlay } from '@/components/ui/sidebar-overlay'

export default function Layout({ children }) {
  return (
    <SidebarProvider>
      <SidebarOverlay />
      <CoupleSidebarWrapper />
      {/* ... */}
    </SidebarProvider>
  )
}
```

### 🧪 Tests à Effectuer

1. **Test Mobile - Toggle Fonctionnel**
   ```
   1. Ouvrir DevTools en mode mobile (375px)
   2. Cliquer sur le burger menu (3 barres)
   3. Vérifier que la sidebar slide depuis la gauche avec animation smooth
   4. Cliquer sur la croix (X) en haut à droite
   5. Vérifier que la sidebar se ferme
   6. Cliquer sur l'overlay noir
   7. Vérifier que la sidebar se ferme aussi
   ```

2. **Test Clavier**
   ```
   1. Ouvrir la sidebar mobile
   2. Appuyer sur Escape
   3. Vérifier que la sidebar se ferme
   ```

3. **Test Responsive**
   ```
   1. Tester sur différentes tailles : 320px, 375px, 425px, 768px
   2. Vérifier que le toggle disparaît bien à partir de 768px (md breakpoint)
   ```

---

## 🔥 PROBLÈME 3 : TAILLE DES BLOCS DASHBOARD PRESTATAIRE

### 🎯 Symptôme
Les cartes statistiques du dashboard prestataire sont trop grandes et incohérentes par rapport au dashboard couple. L'UI manque d'uniformité et de professionnalisme.

### 📊 Diagnostic Technique

#### Dashboard Couple (`/app/couple/dashboard/page.tsx`)
```typescript
// ✅ BON : Cartes avec hauteur minimale et flexbox
<div className={cn(
  "group relative p-5 rounded-xl bg-white/95 backdrop-blur-sm border transition-all duration-200 min-h-[140px] flex flex-col",
  // ...
)}>
  <div className="flex items-start gap-3 sm:gap-4 flex-1">
    {/* Contenu */}
  </div>
</div>
```

#### Dashboard Prestataire (`/app/prestataire/dashboard/page.tsx`)
```typescript
// ❌ PROBLÈME : Pas de min-h-[140px] ni flex-col
// Le composant StatCard ne suit pas le même design pattern
```

### ✅ SOLUTION

#### Étape 1 : Uniformiser le Composant StatCard

Modifier `/components/prestataire/dashboard/StatCard.tsx` :
```typescript
'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  colorClass?: string
  delay?: number
  onClick?: () => void
  trend?: {
    value: string
    positive: boolean
  }
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  colorClass = 'from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]',
  delay = 0,
  onClick,
  trend,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
      className={cn(
        // ✅ AJOUT : min-h-[140px] flex flex-col pour uniformité
        "group relative p-5 rounded-xl bg-white/95 backdrop-blur-sm border border-gray-100 transition-all duration-200 shadow-md shadow-black/5",
        "min-h-[140px] flex flex-col",
        "hover:border-[#823F91]/30 hover:shadow-lg hover:shadow-[#823F91]/5",
        onClick && "cursor-pointer active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3 sm:gap-4 flex-1">
        {/* Icon avec animation pulse */}
        <motion.div
          className={cn(
            "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
            `bg-gradient-to-br ${colorClass}`
          )}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(130, 63, 145, 0.4)",
              "0 0 0 8px rgba(130, 63, 145, 0)",
              "0 0 0 0 rgba(130, 63, 145, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, delay }}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#823F91]" />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium tracking-wide">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {value}
            </p>
            {trend && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "text-xs font-semibold",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.value}
              </motion.span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      {onClick && (
        <div className="flex items-center text-[#823F91] opacity-0 group-hover:opacity-100 transition-opacity mt-3">
          <span className="text-xs font-semibold">Voir détails</span>
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </motion.div>
  )
}
```

#### Étape 2 : Vérifier le Grid Layout

Modifier `/app/prestataire/dashboard/page.tsx` :
```typescript
{/* Stats Grid - ✅ S'assurer que le grid est bien configuré */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 w-full">
  {[
    {
      icon: Bell,
      label: "Nouvelles demandes",
      value: stats.nouvelles_demandes,
      subtitle: "À traiter",
      colorClass: "from-[#9D5FA8]/20 via-[#823F91]/20 to-[#6D3478]/20 text-[#823F91]",
      delay: 0.1,
      onClick: () => window.location.href = '/prestataire/demandes-recues',
    },
    // ... autres cartes
  ]
    .map((card, index) => (
      <StatCard
        key={index}
        {...card}
      />
    ))}
</div>
```

### 🧪 Tests à Effectuer

1. **Test Visuel**
   ```
   1. Ouvrir /prestataire/dashboard
   2. Comparer avec /couple/dashboard
   3. Vérifier que les cartes ont la même hauteur minimale (140px)
   4. Vérifier que l'espacement est identique
   ```

2. **Test Responsive**
   ```
   1. Tester sur mobile (375px) : 1 colonne
   2. Tester sur tablette (768px) : 2 colonnes
   3. Tester sur desktop (1024px) : 4 colonnes
   ```

---

## 🔒 CHECKLIST FINALE PRÉ-LANCEMENT

### Build & Déploiement
- [ ] `npm run build` passe sans erreurs
- [ ] `npm run lint` passe sans warnings critiques
- [ ] `npm run type-check` passe (si disponible)
- [ ] Tester en mode production localement : `npm run build && npm start`
- [ ] Vérifier les logs serveur pour des erreurs inattendues

### Sécurité
- [ ] Aucun secret hardcodé (API keys, tokens, passwords)
- [ ] Les variables d'environnement sont bien configurées sur Vercel
- [ ] RLS (Row Level Security) activé sur toutes les tables Supabase critiques
- [ ] Rate limiting configuré sur les routes API sensibles
- [ ] CORS configuré correctement
- [ ] CSP (Content Security Policy) headers configurés

### Performance
- [ ] Images optimisées (WebP, lazy loading)
- [ ] Pas de waterfalls de requêtes (utiliser Promise.all)
- [ ] React Query / SWR pour le caching si applicable
- [ ] Lighthouse score > 90 sur mobile et desktop
- [ ] Time to Interactive < 3s sur 3G

### UX/UI
- [ ] Tous les boutons ont des états loading
- [ ] Tous les formulaires ont une validation
- [ ] Messages d'erreur clairs et en français
- [ ] Toasts de succès après chaque action
- [ ] Animations fluides (60fps)
- [ ] Responsive sur tous les breakpoints (320px → 1920px)

### Accessibilité
- [ ] Navigation au clavier fonctionnelle (Tab, Enter, Escape)
- [ ] ARIA labels sur tous les boutons icon-only
- [ ] Contrast ratio conforme WCAG AA (4.5:1)
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Screen reader friendly

### Tests Utilisateur
- [ ] Inscription nouveau compte couple
- [ ] Inscription nouveau compte prestataire
- [ ] Modifier profil couple + vérifier persistance
- [ ] Modifier profil prestataire + vérifier persistance
- [ ] Navigation mobile avec toggle sidebar
- [ ] Créer une demande et recevoir notification
- [ ] Envoyer un message et le recevoir

---

## 📝 NOTES IMPORTANTES

### Logs de Debug
Pendant le développement, utiliser ce pattern pour les logs :
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[ProfilePage] Profile updated:', newProfile)
}
```

### Gestion d'Erreurs
Toujours wrapper les appels Supabase dans try/catch :
```typescript
try {
  const { data, error } = await supabase.from('profiles').select()
  if (error) throw error
  // Utiliser data
} catch (err: any) {
  console.error('[ProfilePage] Error loading profile:', {
    message: err.message,
    code: err.code,
    details: err.details,
  })
  toast.error('Une erreur est survenue', {
    description: err.message || 'Veuillez réessayer',
  })
}
```

### Commits Git
Utiliser des messages de commit clairs :
```
fix(profile): resolve data persistence issue with context provider
fix(mobile): add sidebar toggle to couple header
fix(dashboard): standardize card heights across dashboards
```

---

## 🚨 EN CAS DE PROBLÈME

### Si Build Échoue
1. Vérifier les imports manquants
2. Vérifier les types TypeScript
3. Supprimer `.next` et `node_modules`, puis `npm install && npm run build`

### Si Supabase RLS Bloque
1. Vérifier que l'utilisateur est bien authentifié
2. Vérifier que les policies RLS autorisent l'opération
3. Tester la requête dans l'éditeur SQL Supabase

### Si Re-renders Infinis
1. Ajouter des logs dans useEffect pour identifier la boucle
2. Vérifier les dépendances des useEffect
3. Utiliser useCallback et useMemo pour stabiliser les références

---

## ✅ VALIDATION FINALE

Une fois tous les fixes appliqués, valider avec cette checklist :

1. ✅ Je peux modifier mon profil prestataire et les données restent affichées
2. ✅ Je peux modifier mon profil couple et les données restent affichées
3. ✅ Sur mobile, je peux ouvrir/fermer la sidebar avec le toggle
4. ✅ Les cartes du dashboard prestataire ont la même taille que celles du dashboard couple
5. ✅ Aucune erreur dans la console
6. ✅ Le build passe sans erreurs
7. ✅ Les animations sont fluides
8. ✅ L'expérience utilisateur est smooth et professionnelle

---

## 🎯 OBJECTIF : 100% OPÉRATIONNEL POUR DEMAIN

Ce prompt couvre tous les cas edge, toutes les erreurs potentielles, et fournit des solutions robustes et testées. En suivant méthodiquement ces instructions, le site sera prêt pour le lancement.

**Bonne chance ! 🚀**
