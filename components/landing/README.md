# NUPLY Landing Page Components

Cette documentation décrit la structure et l'utilisation des composants de la landing page NUPLY.

## Structure des fichiers

```
components/landing/
├── Hero.tsx                    # Section hero avec headline et CTA
├── MatchingQuizSection.tsx     # Section matching avec chat interactif
├── MatchingExplainerCards.tsx  # Cartes explicatives du matching
├── FeaturesGrid.tsx            # Grille de fonctionnalités
├── CTA.tsx                     # Appel à l'action
├── CulturesMarquee.tsx         # Marquee des cultures
├── PrestatairesMarquee.tsx     # Marquee des prestataires
└── SmoothScrollProvider.tsx    # Provider pour Lenis smooth scroll
```

## Configuration

### Fichiers de configuration

- `lib/constants.ts` - Constantes (couleurs, typographie, copy)
- `lib/animations.ts` - Variants Framer Motion réutilisables
- `lib/scroll.ts` - Configuration Lenis pour smooth scroll

## Design System

### Couleurs

- **Primary Violet**: `#9333EA`
- **Soft Violet**: `#E9D5FF`
- **Pure White**: `#FFFFFF`
- **Dark Navy**: `#0B0E12`
- **Neutral Gray**: `#6B7280`

### Typographie

- **H1**: 64px–80px (desktop) / 40px–48px (mobile)
- **H2**: 48px–56px (desktop) / 32px–40px (mobile)
- **Body**: 18px–20px, line-height 1.6

## Animations

Toutes les animations respectent `prefers-reduced-motion` pour l'accessibilité.

### Types d'animations

1. **Fade in + slide up** - Entrée des éléments au scroll
2. **Stagger** - Animation séquentielle des enfants
3. **Floating** - Animation flottante pour les mockups
4. **Slide from side** - Glissement depuis les côtés
5. **Card hover** - Effets au survol des cartes
6. **3D tilt** - Inclinaison 3D subtile
7. **Glow pulse** - Pulsation de lueur pour les boutons

## Utilisation

La page principale (`app/page.tsx`) importe et utilise tous les composants dans l'ordre :

```tsx
import Hero from '@/components/landing/Hero'
import { PrestatairesMarquee } from '@/components/landing/PrestatairesMarquee'
import { CulturesMarquee } from '@/components/landing/CulturesMarquee'
import MatchingQuizSection from '@/components/landing/MatchingQuizSection'
import MatchingExplainerCards from '@/components/landing/MatchingExplainerCards'
import { FeaturesGrid } from '@/components/landing/FeaturesGrid'
import CTA from '@/components/landing/CTA'
import { SmoothScrollProvider } from '@/components/landing/SmoothScrollProvider'

export default function HomePage() {
  return (
    <SmoothScrollProvider>
      <Hero />
      <CulturesMarquee />
      <MatchingQuizSection />
      <PrestatairesMarquee />
      <FeaturesGrid />
      <CTA />
    </SmoothScrollProvider>
  )
}
```

## Personnalisation

### Modifier le contenu

Éditez `lib/constants.ts` pour modifier les textes et le contenu.

### Modifier les animations

Éditez `lib/animations.ts` pour ajuster les timings et les effets.

### Ajouter des sections

1. Créez un nouveau composant dans `components/landing/`
2. Importez-le dans `app/page.tsx`
3. Ajoutez-le dans l'ordre souhaité

## Performance

- Toutes les animations utilisent `transform` et `opacity` pour de meilleures performances
- Lenis est configuré pour un smooth scroll optimisé
- Les images/mockups doivent être optimisées (WebP, lazy loading)

## Accessibilité

- Support de `prefers-reduced-motion`
- Navigation au clavier fonctionnelle
- Contraste des couleurs conforme WCAG
- Structure sémantique HTML

## Notes

- Les mockups sont des placeholders - remplacez-les par de vraies images
- Les logos des partenaires doivent être ajoutés dans `TrustLogos.tsx`
- Les liens CTA pointent vers `/sign-up` - ajustez selon vos besoins

