# NUPLY — UI Components & Design System Guide

> Guide de référence pour créer ou modifier des composants UI dans NUPLY.
> Source : `app/globals.css`, `lib/design-system.ts`, `components/ui/`

---

## 1. Design System — Tokens CSS

### Fond et palette beige (CRITIQUE)

Le fond de l'application est **beige**, pas blanc. `--background` = `#FBF8F3`.

```css
/* Fond principal */
background: hsl(var(--background))     /* #FBF8F3 beige chaud */

/* Ne JAMAIS utiliser bg-white comme fond de page */
/* bg-white est réservé aux cartes et surfaces élevées */
```

### Variables CSS disponibles (globals.css)

```css
/* Couleurs principales */
--background          /* #FBF8F3 — fond body */
--foreground          /* #221510 — texte titres */
--primary             /* #823F91 — brand violet */
--primary-foreground  /* #FFFFFF — texte sur primary */

/* Surfaces */
--card                /* white */
--card-foreground     /* --foreground */
--muted               /* #F5F0E8 — fond sections alternées */
--muted-foreground    /* #6F5A48 — texte muted */

/* Bordures & états */
--border              /* #EBE4DA — bordure par défaut */
--input               /* --border */
--ring                /* #823F91 — focus ring */
--radius              /* 0.875rem */

/* Sidebar */
--sidebar-background  /* white */
--sidebar-primary     /* --violet-500 */
--sidebar-accent      /* --beige-200 */
--sidebar-border      /* --beige-300 */
```

### Palette de couleurs hex (lib/design-system.ts)

```typescript
import { colors } from '@/lib/design-system'

// Violet brand
colors.primary500     // '#823F91'  → couleur principale
colors.primary700     // '#6D3478'  → hover
colors.primaryHover   // '#5C2B66'  → active/pressed
colors.primary100     // '#E8D4EF'  → fond violet doux
colors.primary50      // '#F5F0F7'  → fond violet très doux

// Neutrals (gris)
colors.neutral50      // '#FAFAFA'
colors.neutral100     // '#F5F5F5'
colors.neutral200     // '#E5E7EB'
colors.neutral400     // '#9CA3AF'
colors.neutral600     // '#4B5563'
colors.neutral800     // '#1F2937'
colors.neutral900     // '#111827'

// Texte
colors.textPrimary    // '#111827'  15.4:1 WCAG AA
colors.textSecondary  // '#4B5563'  7.4:1
colors.textMuted      // '#6B7280'  4.6:1

// Semantic
colors.success        // '#059669'
colors.successLight   // '#ECFDF5'
colors.warning        // '#D97706'
colors.warningLight   // '#FFFBEB'
colors.danger         // '#DC2626'
colors.dangerLight    // '#FEF2F2'
colors.info           // '#2563EB'
colors.infoLight      // '#EFF6FF'

// Bordures
colors.border         // '#E5E7EB'
colors.borderFocus    // '#823F91'
```

---

## 2. Typographie

### Classes Tailwind recommandées

```tsx
// Titres de page (dashboard)
<h1 className="text-[36px] sm:text-[40px] font-bold leading-tight tracking-tight text-gray-900">

// Titres de section
<h2 className="text-[24px] sm:text-[28px] font-semibold leading-snug tracking-tight text-gray-900">

// KPI / métriques importantes
<span className="text-[42px] sm:text-[48px] font-bold leading-none tracking-tight tabular-nums">

// Corps de texte
<p className="text-[15px] sm:text-base leading-relaxed text-gray-600">

// Texte petit
<span className="text-sm leading-relaxed text-gray-600">

// Caption / meta
<span className="text-[13px] leading-snug text-gray-400">

// Label section
<span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
```

### Import depuis lib/design-system.ts

```typescript
import { typography } from '@/lib/design-system'

<h1 className={typography.h1Dashboard}>Titre</h1>
<h2 className={typography.h2Section}>Sous-titre</h2>
<span className={typography.kpiValue}>42</span>
<p className={typography.body}>Description</p>
<p className={typography.bodySmall}>Texte secondaire</p>
<span className={typography.caption}>il y a 2 heures</span>
<span className={typography.label}>Catégorie</span>
```

---

## 3. Spacing & Radius

```typescript
import { spacing, radius } from '@/lib/design-system'

// Spacing
spacing.xs   // '0.5rem'  (8px)
spacing.sm   // '0.75rem' (12px)
spacing.md   // '1rem'    (16px)
spacing.lg   // '1.5rem'  (24px)
spacing.xl   // '2rem'    (32px)
spacing['2xl'] // '3rem'  (48px)

// Radius
radius.sm    // '0.5rem'  (8px)
radius.md    // '0.75rem' (12px)
radius.lg    // '1rem'    (16px)
radius.xl    // '1.25rem' (20px)
radius.full  // '9999px'
```

---

## 4. Shadows

```typescript
import { shadows } from '@/lib/design-system'

shadows.card    // ombre subtile pour cartes (défaut)
shadows.raised  // ombre moyenne pour cartes survolées
shadows.float   // ombre forte pour éléments flottants (modals, tooltips)
shadows.focus   // 0 0 0 3px rgba(130,63,145,0.2) — ring focus violet
shadows.sm      // 0 1px 2px
shadows.md      // shadow Tailwind md
shadows.lg      // shadow Tailwind lg
```

Classes CSS globales :
```css
.shadow-soft      /* équivalent shadows.card */
.shadow-elevated  /* équivalent shadows.raised */
.shadow-float     /* équivalent shadows.float */
```

---

## 5. Tokens Tailwind prêts à l'emploi

```typescript
import { designTokens } from '@/lib/design-system'

// Boutons
designTokens.buttonPrimary
// → 'bg-[#823F91] hover:bg-[#5C2B66] text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#823F91]/40 focus-visible:ring-offset-2'

designTokens.buttonOutline
// → 'border border-[#823F91] text-[#823F91] hover:bg-[#823F91]/5 rounded-xl ...'

designTokens.buttonGhost
// → 'text-gray-600 hover:bg-gray-100 rounded-xl px-4 py-2 font-medium text-sm ...'

// Cartes
designTokens.card
// → 'bg-white rounded-2xl shadow-[...] border border-gray-100 transition-shadow hover:shadow-[...]'

designTokens.cardFlat
// → 'bg-white rounded-2xl border border-gray-100'

// Input
designTokens.input
// → 'rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm border border-gray-200 focus:ring-2 focus:ring-[#823F91]/30 focus:border-[#823F91] ...'

// Dashboard sections
designTokens.dashboardSection
// → 'bg-white rounded-2xl border border-gray-100 shadow-[...] overflow-hidden'

designTokens.dashboardSectionHeader
// → 'px-5 py-4 border-b border-gray-100 bg-gray-50/60'
```

---

## 6. Button Component

```tsx
import { Button } from '@/components/ui/button'

// Variantes
<Button variant="default">Action principale</Button>
<Button variant="outline">Action secondaire</Button>
<Button variant="ghost">Action tertiaire</Button>
<Button variant="destructive">Supprimer</Button>
<Button variant="secondary">Neutre</Button>
<Button variant="link">Lien</Button>

// Tailles
<Button size="xs">Petit</Button>      // h-8  text-xs
<Button size="sm">Compact</Button>    // h-10 text-xs
<Button size="default">Normal</Button> // h-11
<Button size="lg">Grand</Button>      // h-12
<Button size="icon"><Icon /></Button>  // size-11 carré

// Composition (asChild pour Link)
<Button asChild variant="default">
  <Link href="/couple/dashboard">Dashboard</Link>
</Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Chargement...
</Button>
```

---

## 7. Card Component

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

// Carte standard
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Dashboard section (classe custom)
<div className={designTokens.dashboardSection}>
  <div className={designTokens.dashboardSectionHeader}>
    <h3 className="font-semibold text-gray-900">Titre section</h3>
  </div>
  <div className="p-5">
    Contenu
  </div>
</div>
```

---

## 8. Form Components

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Champ texte
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder="vous@example.com" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

// Select
<FormField
  control={form.control}
  name="type"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Type</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Choisir..." />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="photographe">Photographe</SelectItem>
          <SelectItem value="traiteur">Traiteur</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 9. Dialog (Modal)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Titre de la modal</DialogTitle>
      <DialogDescription>Description optionnelle</DialogDescription>
    </DialogHeader>

    {/* Contenu */}
    <div className="py-4">...</div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
      <Button onClick={handleSubmit}>Confirmer</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Note : le fond des modals est automatiquement forcé en gradient violet clair via globals.css (`[data-slot="dialog-content"]`).

---

## 10. Badge & Status

```tsx
import { Badge } from '@/components/ui/badge'

// Status demande
<Badge variant="default">Nouveau</Badge>
<Badge variant="secondary">En cours</Badge>
<Badge className="bg-green-100 text-green-800">Accepté</Badge>
<Badge className="bg-red-100 text-red-800">Refusé</Badge>
<Badge className="bg-gray-100 text-gray-800">Terminé</Badge>

// KPI deltas (classes globales)
<span className="delta-positive">+12%</span>
<span className="delta-negative">-3%</span>
<span className="delta-neutral">0%</span>
```

---

## 11. Toast (Sonner)

```typescript
import { toast } from 'sonner'

toast.success('Demande envoyée avec succès')
toast.error('Une erreur est survenue')
toast.warning('Attention, données incomplètes')
toast.info('Mise à jour disponible')
toast.loading('Chargement en cours...')

// Toast avec action
toast('Message envoyé', {
  action: {
    label: 'Annuler',
    onClick: () => handleUndo(),
  },
})
```

---

## 12. Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar className="h-10 w-10">
  <AvatarImage src={user.avatar_url} alt={user.prenom} />
  <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold">
    {user.prenom?.[0]}{user.nom?.[0]}
  </AvatarFallback>
</Avatar>
```

---

## 13. Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="apercu">
  <TabsList className="bg-muted/50 p-1 rounded-xl">
    <TabsTrigger value="apercu" className="rounded-lg">Aperçu</TabsTrigger>
    <TabsTrigger value="details" className="rounded-lg">Détails</TabsTrigger>
    <TabsTrigger value="historique" className="rounded-lg">Historique</TabsTrigger>
  </TabsList>
  <TabsContent value="apercu">...</TabsContent>
  <TabsContent value="details">...</TabsContent>
  <TabsContent value="historique">...</TabsContent>
</Tabs>
```

---

## 14. Empty State

```tsx
import { EmptyState } from '@/components/ui/empty-state'

<EmptyState
  icon={<InboxIcon className="w-8 h-8 text-violet-400" />}
  title="Aucune demande"
  description="Vous n'avez pas encore reçu de demandes."
  action={
    <Button variant="outline" onClick={handleAction}>
      Voir les prestataires
    </Button>
  }
/>
```

---

## 15. Loading / Skeleton

```tsx
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Spinner centré
<div className="flex items-center justify-center py-12">
  <LoadingSpinner />
</div>

// Squelettes de contenu
<div className="space-y-4">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-32 w-full rounded-2xl" />
</div>
```

---

## 16. Classes utilitaires CSS globales

```tsx
// Effets visuels
<div className="glass glass-border">Glassmorphism</div>
<div className="shadow-soft">Ombre douce</div>
<div className="shadow-elevated">Ombre élevée</div>
<div className="shadow-float">Ombre flottante</div>
<div className="hover-lift">Lève au hover</div>
<div className="pattern-dots">Fond pointillé</div>

// Transitions
<div className="transition-smooth">Transition standard</div>
<div className="transition-bounce">Transition avec rebond</div>

// Sections
<section className="tab-pill" data-active={isActive}>Onglet</section>
<div className="card-section">Section avec glassmorphism</div>
<div className="period-pill" data-active={selected}>7j</div>
```

---

## 17. Animations Framer Motion

```tsx
import { motion } from 'framer-motion'
import { fadeInUp, cardHover, buttonHover, iconHover, counterAnimation, typingIndicator, slideInRight, pulseBadge } from '@/lib/animations'

// Apparition depuis le bas avec stagger
<motion.div
  variants={fadeInUp}
  initial="hidden"
  animate="visible"
  custom={index}  // délai par index
>
  Contenu
</motion.div>

// Carte avec hover
<motion.div
  variants={cardHover}
  initial="rest"
  whileHover="hover"
  animate="rest"
>
  <Card>...</Card>
</motion.div>

// Bouton pressable
<motion.button
  whileHover={buttonHover}
  whileTap={{ scale: 0.97 }}
>
  Action
</motion.button>

// Icône interactive
<motion.div
  whileHover={iconHover}
>
  <Icon />
</motion.div>

// Notification slide depuis la droite
<motion.div
  variants={slideInRight}
  initial="initial"
  animate="animate"
>
  Notification
</motion.div>

// Badge pulsant
<motion.span
  variants={pulseBadge}
  animate="animate"
>
  3
</motion.span>
```

---

## 18. Layout — Sidebar & Navigation

### Structure des layouts
```
app/couple/layout.tsx     → sidebar couple + sidebar-wrapper.tsx
app/prestataire/layout.tsx → sidebar prestataire + sidebar-inset-wrapper.tsx
```

### NavItem (components/layout/NavItem.tsx)
```tsx
// Utilisé dans les sidebars
<NavItem
  href="/couple/dashboard"
  icon={<LayoutDashboard size={18} />}
  label="Tableau de bord"
  isActive={pathname === '/couple/dashboard'}
/>
```

### Mobile
- `MobileBottomNav` — barre de nav fixe en bas sur mobile (< 768px)
- `MobileMenu` — menu hamburger pour la navbar publique
- `mobile-menu-client.tsx` — menu spécifique à l'espace couple

---

## 19. Responsive Design

```tsx
// Grilles responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Visibilité
<div className="hidden lg:block">Visible seulement desktop</div>
<div className="block lg:hidden">Visible seulement mobile/tablet</div>

// Padding responsive
<div className="px-4 md:px-6 lg:px-8">

// Stack → row sur desktop
<div className="flex flex-col md:flex-row items-start gap-4">

// Texte responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
```

---

## 20. Patterns de composants Dashboard

```tsx
// KPI Card
<div className={designTokens.dashboardSection}>
  <div className={designTokens.dashboardSectionHeader}>
    <span className={typography.label}>Budget total</span>
  </div>
  <div className="p-5">
    <div className={typography.kpiValue}>12 500 €</div>
    <span className="delta-positive mt-1 block">+8% ce mois</span>
  </div>
</div>

// Section avec titre + action
<div className={designTokens.dashboardSection}>
  <div className={`${designTokens.dashboardSectionHeader} flex items-center justify-between`}>
    <h3 className="font-semibold text-gray-900">Dernières demandes</h3>
    <Button variant="ghost" size="sm" asChild>
      <Link href="/couple/demandes">Voir tout</Link>
    </Button>
  </div>
  <div className="divide-y divide-gray-50">
    {/* items */}
  </div>
</div>
```

---

*Dernière mise à jour: 2026-02-27*
