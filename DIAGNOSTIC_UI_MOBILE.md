# DIAGNOSTIC UI MOBILE

## PROBLÈMES IDENTIFIÉS

### PROBLÈME 1: Calendrier - Cellules trop petites sur mobile
- **Fichier**: `components/calendar/CalendarDashboard.tsx`
- **Ligne**: 156
- **Description**: Hauteur fixe `h-32` (128px) est trop petite sur mobile (375px). Les événements débordent et le texte devient illisible.
- **Solution**: 
  - Ajouter détection mobile avec hook `useState` + `useEffect` pour `window.innerWidth < 640`
  - Hauteur responsive : `h-24 sm:h-28 md:h-32` (96px → 112px → 128px)
  - Padding responsive : `p-1.5 sm:p-2`

### PROBLÈME 2: Calendrier - Texte trop petit sur mobile
- **Fichier**: `components/calendar/CalendarDashboard.tsx`
- **Ligne**: 161, 168
- **Description**: Texte en `text-sm` et `text-xs` devient difficile à lire sur petits écrans
- **Solution**:
  - Jour : `text-xs sm:text-sm` (12px → 14px)
  - Événements : `text-[10px] sm:text-xs` (10px → 12px)
  - Padding événements : `px-1 sm:px-2 py-0.5 sm:py-1`

### PROBLÈME 3: Calendrier - Trop d'événements affichés sur mobile
- **Fichier**: `components/calendar/CalendarDashboard.tsx`
- **Ligne**: 165
- **Description**: Affiche jusqu'à 3 événements même sur mobile, causant débordement
- **Solution**: Limiter à 2 événements sur mobile : `dayEvents.slice(0, isMobile ? 2 : 3)`

### PROBLÈME 4: Calendrier - En-tête jours trop large sur mobile
- **Fichier**: `components/calendar/CalendarDashboard.tsx`
- **Ligne**: 215
- **Description**: Texte complet "Lun", "Mar", etc. prend trop de place sur mobile
- **Solution**: Afficher première lettre seulement sur mobile : `<span className="sm:hidden">{day[0]}</span>`

### PROBLÈME 5: Dashboard - StatCard peut être amélioré
- **Fichier**: `components/prestataire/dashboard/StatCard.tsx`
- **Ligne**: 70
- **Description**: Déjà bien fait avec `min-h-[140px]` et responsive, mais peut être optimisé
- **Solution**: Vérifier que tous les textes sont responsive et que les icônes sont bien scalées

### PROBLÈME 6: Dashboard - Grid peut être optimisé
- **Fichier**: `app/prestataire/dashboard/page.tsx`
- **Ligne**: 303
- **Description**: Grid responsive existe mais peut être amélioré pour mobile
- **Solution**: Vérifier gaps et padding sur mobile

## PLAN D'ACTION

1. ✅ Ajouter hook mobile detection dans CalendarDashboard
2. ✅ Modifier hauteurs cellules calendrier (responsive)
3. ✅ Modifier tailles texte calendrier (responsive)
4. ✅ Limiter événements affichés sur mobile
5. ✅ En-tête jours compact sur mobile
6. ✅ Vérifier et améliorer StatCard si nécessaire
7. ✅ Vérifier grid dashboard
