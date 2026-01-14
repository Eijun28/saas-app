# 📜 ScrollReveal Component

Composant Next.js réutilisable pour créer des animations fluides au scroll avec IntersectionObserver.

## 🚀 Installation

Le composant est déjà créé dans `components/ui/scroll-reveal.tsx`.

## 📖 Utilisation

### Import

```tsx
import { ScrollReveal } from '@/components/ui/scroll-reveal'
```

### Exemple basique

```tsx
<ScrollReveal>
  <div>Contenu qui apparaît au scroll</div>
</ScrollReveal>
```

### Exemple avec props

```tsx
<ScrollReveal 
  direction="up" 
  delay={200} 
  once={true}
  className="my-custom-class"
>
  <Card>
    <CardContent>Contenu animé</CardContent>
  </Card>
</ScrollReveal>
```

## 🎨 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | **requis** | Contenu à animer |
| `delay` | `number` | `0` | Délai en millisecondes avant l'animation |
| `direction` | `'up' \| 'down' \| 'left' \| 'right'` | `'up'` | Direction de l'animation |
| `className` | `string` | `undefined` | Classes CSS supplémentaires |
| `once` | `boolean` | `true` | Si `true`, l'animation ne se déclenche qu'une fois |
| `duration` | `number` | `0.7` | Durée de l'animation en secondes |
| `distance` | `number` | `30` | Distance de translation en pixels |

## ✨ Caractéristiques

- ✅ **Léger** : Pas de dépendances externes
- ✅ **Performant** : Utilise IntersectionObserver natif
- ✅ **Fluide** : Animations CSS avec cubic-bezier pour un léger overshoot
- ✅ **Flexible** : Personnalisable avec toutes les props
- ✅ **TypeScript** : Entièrement typé
- ✅ **Responsive** : Fonctionne sur tous les écrans

## 🎯 Exemples d'utilisation

### Effet cascade

```tsx
{[1, 2, 3, 4].map((item, index) => (
  <ScrollReveal key={item} direction="up" delay={index * 100}>
    <Card>Élément {item}</Card>
  </ScrollReveal>
))}
```

### Animation répétée

```tsx
<ScrollReveal direction="up" once={false}>
  <div>Apparaît à chaque passage dans la vue</div>
</ScrollReveal>
```

### Différentes directions

```tsx
<ScrollReveal direction="left" delay={100}>
  <Card>Depuis la droite</Card>
</ScrollReveal>

<ScrollReveal direction="right" delay={200}>
  <Card>Depuis la gauche</Card>
</ScrollReveal>

<ScrollReveal direction="up" delay={300}>
  <Card>Depuis le bas</Card>
</ScrollReveal>

<ScrollReveal direction="down" delay={400}>
  <Card>Depuis le haut</Card>
</ScrollReveal>
```

## 🔧 Configuration IntersectionObserver

Le composant utilise ces paramètres par défaut :
- `threshold: 0.1` - L'animation se déclenche quand 10% de l'élément est visible
- `rootMargin: '0px 0px -50px 0px'` - Déclenchement 50px avant l'entrée dans la vue

## 🎨 Animation

L'animation combine :
- **Opacity** : 0 → 1 (fade in)
- **Transform** : translate + scale (slide + zoom léger)
- **Timing** : cubic-bezier(0.34, 1.56, 0.64, 1) pour un léger overshoot

## 📱 Page de démonstration

Visitez `/examples/scroll-reveal-demo` pour voir tous les exemples en action.

## 🚀 Performance

- Utilise `willChange` pour optimiser les performances
- Nettoyage automatique de l'observer au démontage
- Pas de re-renders inutiles

