# PROMPT CURSOR - POLISH UI/UX DASHBOARD PRESTATAIRE

## CONTEXTE
L'utilisateur souhaite rendre le design plus professionnel et moderne avec une police SaaS 2025, des alignements corrects, un avatar cohérent et une meilleure utilisation de l'espace.

## OBJECTIFS À IMPLÉMENTER

### 1. 🎨 POLICE MODERNE SAAS 2025

**Problème actuel :**
- `app/layout.tsx` utilise GeistSans comme police principale
- Inter est importé mais en variable secondaire

**Solution :**
- **Option A (Recommandée)** : Utiliser **Geist Sans** comme police principale (déjà importée)
  - Geist est la police officielle de Vercel 2025, ultra moderne et optimisée
  - Utilisée par les SaaS les plus récents (Linear, Vercel, etc.)

- **Option B** : Basculer sur **Inter** comme police principale
  - Déjà importée dans le projet
  - Police SaaS classique et éprouvée

**Actions :**

```typescript
// app/layout.tsx - GARDER Geist comme principale (déjà optimal)
// OU si vous préférez Inter :
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className={cn("antialiased", inter.className)}>
        {/* ... */}
      </body>
    </html>
  )
}
```

```css
/* app/globals.css - Mettre à jour la police système */
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  /* OPTION A : Garder Geist (déjà optimal) */
  font-family: var(--font-geist-sans), system-ui, -apple-system, sans-serif;

  /* OU OPTION B : Basculer sur Inter */
  font-family: var(--font-inter), system-ui, -apple-system, sans-serif;

  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

### 2. 📏 ALIGNEMENT TOP BAR AVEC LOGO

**Problème :**
La ligne de bordure de la TopBar n'est pas alignée avec la section du logo dans la Sidebar.

**Analyse :**
- Sidebar logo section : `div className="p-6 border-b border-[#E5E7EB]"` (padding 24px = 1.5rem)
- TopBar : `className="... px-4 md:px-6 lg:px-8 ..."` (padding horizontal variable)

**Solution :**
Harmoniser le padding horizontal de la TopBar avec celui de la Sidebar.

**Actions :**

```typescript
// components/layout/TopBar.tsx
// AVANT (ligne 343-348)
<motion.header
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="sticky top-0 z-30 bg-white px-4 md:px-6 lg:px-8 py-3 md:py-4 border-b border-[#E5E7EB]"
>

// APRÈS - Aligner avec le padding de la Sidebar (p-6 = 24px)
<motion.header
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-[#E5E7EB]"
>
```

**Vérification :**
- Sidebar logo : `p-6` (padding de 24px sur tous les côtés)
- TopBar : `px-6` (padding horizontal de 24px) ✅
- L'alignement vertical sera maintenant parfait

---

### 3. 👤 AVATAR COHÉRENT (Dashboard + TopBar + Profil)

**Problème :**
- Dashboard affiche un cercle violet avec initiales
- TopBar/Profil affichent l'avatar de Supabase
- Besoin de synchroniser pour utiliser le même avatar partout

**Solution :**
Créer un composant Avatar partagé qui :
1. Récupère l'avatar de Supabase (profiles.avatar_url)
2. Affiche les initiales en fallback avec gradient violet
3. Est réutilisable dans Dashboard, TopBar, Profil

**Actions :**

```typescript
// components/shared/PrestataireAvatar.tsx (NOUVEAU FICHIER)
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from '@/components/ui/user-avatar'

interface PrestataireAvatarProps {
  userId?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  className?: string
}

export function PrestataireAvatar({
  userId,
  size = 'md',
  showStatus = false,
  className
}: PrestataireAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fallback, setFallback] = useState<string>('P')

  useEffect(() => {
    const loadAvatar = async () => {
      if (!userId) return

      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, prenom, nom')
        .eq('id', userId)
        .single()

      if (data) {
        setAvatarUrl(data.avatar_url)
        const initials = `${data.prenom || ''}${data.nom || ''}`.trim()
        setFallback(initials ? initials[0].toUpperCase() : 'P')
      }
    }

    loadAvatar()

    // Écouter les mises à jour d'avatar
    const handleAvatarUpdate = () => loadAvatar()
    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate)
  }, [userId])

  return (
    <UserAvatar
      src={avatarUrl}
      fallback={fallback}
      size={size}
      status={showStatus ? 'online' : undefined}
      className={className}
    />
  )
}
```

**Utilisation dans le Dashboard :**

```typescript
// app/prestataire/dashboard/page.tsx
// REMPLACER (lignes 116-125 environ)
import { PrestataireAvatar } from '@/components/shared/PrestataireAvatar'

// AVANT
<div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#823F91] to-[#9D5FA8] flex items-center justify-center text-white text-xl font-bold">
  {prenom ? prenom[0].toUpperCase() : 'P'}
</div>

// APRÈS
<PrestataireAvatar userId={user?.id} size="lg" />
```

**Note :** TopBar utilise déjà UserAvatar et est déjà synchronisé avec avatar_url ✅

---

### 4. 📐 PROFIL PUBLIC - PLEINE LARGEUR SUR DESKTOP

**Problème :**
La page profil public est contrainte à `max-w-4xl` (896px) ce qui crée trop d'espace blanc sur desktop.

**Solution :**
Utiliser `max-w-7xl` (1280px) pour une meilleure utilisation de l'espace en desktop tout en restant lisible.

**Actions :**

```typescript
// app/prestataire/profil-public/page.tsx

// REMPLACER toutes les instances de "max-w-4xl" par "max-w-6xl"

// Ligne 184 - Header
<div className="container max-w-6xl">

// Ligne 215 - Content
<div className="container max-w-6xl py-8">

// Ligne 172 - Section non connecté (si présent)
<div className="container max-w-6xl py-8">
```

**Alternative si max-w-6xl est encore trop étroit :**
```typescript
// Utiliser max-w-7xl (1280px)
<div className="container max-w-7xl py-8">
```

---

### 5. 📦 RÉDUIRE LA TAILLE DES BLOCS (Profil + Agenda)

**Problème :**
Les Cards ont un padding trop important (`p-6` = 24px), les sections semblent trop grosses.

**Solution :**
Réduire le padding des Cards pour un look plus compact et moderne.

**Actions :**

```typescript
// app/prestataire/profil-public/page.tsx

// AVANT (ligne 216)
<Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50...">

// APRÈS - Réduire à p-4 ou p-5
<Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50...">

// AVANT (ligne 235)
<Card className="p-4 mb-6 border-orange-200...">
// GARDER p-4 (déjà bon)

// AVANT (ligne 260) - Collapsible trigger
<CollapsibleTrigger className="w-full p-6 flex items-center...">

// APRÈS - Réduire à p-4
<CollapsibleTrigger className="w-full p-4 flex items-center...">

// AVANT (ligne 283) - Collapsible content
<div className="px-6 pb-6 space-y-6 border-t pt-6">

// APRÈS - Réduire les paddings
<div className="px-4 pb-4 space-y-4 border-t pt-4">
```

**Appliquer les mêmes changements dans TOUTES les sections Collapsible :**
- Cultures (ligne 350)
- Zones (ligne 387)
- Portfolio (ligne 424)

**Pour la page Agenda :**

```typescript
// app/prestataire/agenda/page.tsx
// Rechercher tous les "p-6" et "p-8" dans les Cards et réduire à "p-4"
// Exemple :
<Card className="p-8"> → <Card className="p-4">
<CardHeader className="p-6"> → <CardHeader className="p-4">
```

---

### 6. 🔧 ICÔNE PROFIL PUBLIC (Sidebar)

**Problème :**
L'icône "Profil public" dans la sidebar utilise Settings (roue de réglages) au lieu d'un icône de profil.

**Solution :**
Remplacer `Settings` par `User` de lucide-react.

**Actions :**

```typescript
// app/prestataire/sidebar-wrapper.tsx

// AVANT (ligne 4)
import { LayoutDashboard, Store, CalendarCheck, MessageSquare, Settings } from "lucide-react"

// APRÈS - Remplacer Settings par User
import { LayoutDashboard, Store, CalendarCheck, MessageSquare, User } from "lucide-react"

// AVANT (ligne 11)
{ href: "/prestataire/profil-public", icon: Settings, label: "Profil public" },

// APRÈS
{ href: "/prestataire/profil-public", icon: User, label: "Profil public" },
```

---

## 🎯 CHECKLIST DE VALIDATION

Après avoir appliqué tous les changements, vérifiez :

- [ ] **Police** : La police est Geist Sans ou Inter (moderne et lisible)
- [ ] **Alignement TopBar** : La bordure de la TopBar s'aligne parfaitement avec le logo de la Sidebar
- [ ] **Avatar cohérent** : L'avatar affiché dans le dashboard est le même que dans TopBar et Profil
- [ ] **Profil pleine largeur** : La page profil public utilise max-w-6xl ou max-w-7xl
- [ ] **Blocs compacts** : Les Cards utilisent p-4 au lieu de p-6
- [ ] **Icône profil** : La Sidebar affiche l'icône User (pas Settings) pour "Profil public"
- [ ] **Agenda compact** : Les sections de l'agenda ont un padding réduit

---

## 📝 NOTES IMPORTANTES

1. **Ne pas casser l'existant** : Les fonctionnalités doivent rester identiques
2. **Responsive** : Vérifier que les changements fonctionnent sur mobile/tablet/desktop
3. **Avatar fallback** : Si pas d'avatar dans Supabase, afficher les initiales avec gradient violet
4. **Test avatar** : Après changement, vérifier que l'upload d'avatar met à jour tous les composants

---

## 🚀 ORDRE D'EXÉCUTION

1. Changer l'icône Sidebar (plus simple) ✅
2. Ajuster alignement TopBar ✅
3. Créer composant PrestataireAvatar ✅
4. Intégrer PrestataireAvatar dans Dashboard ✅
5. Ajuster largeur Profil Public (max-w-6xl) ✅
6. Réduire padding des Cards (p-4) ✅
7. Vérifier police (Geist déjà optimal ou basculer Inter) ✅
8. Test complet sur toutes les pages ✅

---

**FIN DU PROMPT**
