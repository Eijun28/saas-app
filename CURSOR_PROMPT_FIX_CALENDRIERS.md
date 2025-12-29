# PROMPT CURSOR - FIX CALENDRIERS (GRILLE CASSÉE)

## CONTEXTE
**Problème critique :** Les calendriers s'affichent VERTICALEMENT (jours empilés 1, 2, 3, 4...) au lieu d'une grille 7x7 normale.

**Cause :** Confusion entre plusieurs composants Calendar + styles CSS écrasés.

**Solution :** Standardiser sur `calendar-shadcn.tsx` avec `captionLayout="dropdown"` partout.

---

## 🔍 DIAGNOSTIC

### Fichiers problématiques identifiés

1. **`/components/ui/calendar.tsx`** ❌
   - Calendrier custom avec Framer Motion
   - N'a PAS de `captionLayout="dropdown"`
   - Utilise `grid grid-cols-7` mais peut être écrasé par globals.css

2. **`/components/ui/calendar-shadcn.tsx`** ✅
   - Bon composant shadcn/ui avec DayPicker
   - A `captionLayout="dropdown"` supporté
   - Utilise flex correctement pour les rows

3. **`/components/ui/date-picker.tsx`** ⚠️
   - Utilise `calendar-shadcn` (correct)
   - Mais peut manquer des wrappers ou styles

### Problème CSS probable

Dans `/app/globals.css`, il y a des règles qui peuvent casser la grille :

```css
/* Ligne ~227 (border-2 écrasement) */
input.border-2,
textarea.border-2,
select.border-2,
button.border-2[role="combobox"],
[role="combobox"].border-2 {
  border-width: 1px !important;
}
```

Ces règles `!important` peuvent interférer avec les styles du calendrier.

---

## ✅ SOLUTION 1 : NETTOYER LES COMPOSANTS CALENDAR

### 1.1 Renommer calendar-shadcn.tsx → calendar.tsx

**Objectif :** Avoir UN SEUL composant Calendar (le bon).

```bash
# ÉTAPE 1 : Sauvegarder l'ancien calendar.tsx
mv components/ui/calendar.tsx components/ui/calendar-old-custom.tsx

# ÉTAPE 2 : Renommer calendar-shadcn.tsx
mv components/ui/calendar-shadcn.tsx components/ui/calendar.tsx
```

### 1.2 Mettre à jour date-picker.tsx

```typescript
// components/ui/date-picker.tsx

'use client'

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "./calendar" // ⚠️ CHANGÉ : ./calendar au lieu de ./calendar-shadcn
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  className,
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const formatDate = (date: Date | undefined) => {
    if (!date) return ""
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          readOnly
          disabled={disabled}
          value={formatDate(value)}
          placeholder={placeholder}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "cursor-pointer pr-10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
      </div>
      {isOpen && !disabled && (
        <>
          {/* Overlay pour fermer le calendrier */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Calendrier dropdown */}
          <div className="absolute top-full left-0 mt-2 z-20 bg-white rounded-lg border shadow-lg p-0">
            <Calendar
              mode="single"
              selected={value}
              onSelect={(date) => {
                onChange?.(date)
                setIsOpen(false)
              }}
              captionLayout="dropdown" // ⚠️ IMPORTANT : dropdown pour mois/année
              className="rounded-lg"
              fromYear={new Date().getFullYear() - 5} // 5 ans dans le passé
              toYear={new Date().getFullYear() + 20}  // 20 ans dans le futur
            />
          </div>
        </>
      )}
    </div>
  )
}
```

**Changements clés :**
- Import `Calendar` depuis `"./calendar"`
- Ajout prop `disabled`
- Ajout `fromYear` et `toYear` pour les dropdowns
- Meilleure gestion du z-index (overlay z-10, calendar z-20)

---

## ✅ SOLUTION 2 : FIXER LE COMPOSANT CALENDAR.TSX

### 2.1 S'assurer que les classes sont correctes

```typescript
// components/ui/calendar.tsx
// VÉRIFIER QUE CES CLASSES SONT PRÉSENTES

"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      weekStartsOn={1} // Lundi
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      components={{
        Navbar: () => null, // Masquer les flèches (on utilise dropdown)
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // ⚠️ Masquer le label car on utilise dropdown
        caption_dropdowns: "flex justify-center gap-3 items-center",

        // ⚠️ IMPORTANT : Styles des dropdowns
        dropdown: "px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary",
        dropdown_month: "px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 min-w-[120px]",
        dropdown_year: "px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50 min-w-[90px]",

        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",

        // ⚠️ CRITIQUE : Grille du calendrier
        table: "w-full border-collapse mt-4",
        head_row: "flex w-full", // ⚠️ FLEX pour les jours de la semaine
        head_cell: "text-muted-foreground w-9 font-normal text-sm text-center",

        // ⚠️ CRITIQUE : Lignes des jours (DOIVENT être en FLEX)
        row: "flex w-full mt-1",

        // ⚠️ CRITIQUE : Cellules individuelles
        cell: cn(
          "relative p-0 text-center text-sm",
          "focus-within:relative focus-within:z-20",
          "w-9 h-9" // Taille fixe pour éviter les problèmes
        ),

        day: cn(
          "h-9 w-9 p-0 font-normal rounded-md",
          "hover:bg-accent hover:text-accent-foreground",
          "flex items-center justify-center", // ⚠️ FLEX pour centrer
          "transition-colors"
        ),

        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        day_hidden: "invisible",

        ...classNames,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
```

**Points critiques :**
- `head_row: "flex w-full"` → Jours de la semaine en ligne
- `row: "flex w-full mt-1"` → Chaque semaine en ligne
- `cell: "w-9 h-9"` → Taille fixe pour éviter les problèmes
- `day: "flex items-center justify-center"` → Centrer le contenu

---

## ✅ SOLUTION 3 : VÉRIFIER GLOBALS.CSS

### 3.1 Ajouter des styles spécifiques pour react-day-picker

```css
/* app/globals.css - AJOUTER À LA FIN DU FICHIER */

/* === FIX CALENDRIER SHADCN (react-day-picker) === */

/* S'assurer que les lignes du calendrier sont bien en flex */
.rdp-table {
  width: 100%;
  border-collapse: collapse;
}

.rdp-head_row,
.rdp-row {
  display: flex !important;
  width: 100%;
  justify-content: space-around;
}

.rdp-head_cell,
.rdp-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rdp-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem; /* 36px */
  height: 2.25rem; /* 36px */
}

/* Dropdowns du calendrier */
.rdp-dropdown {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
  padding-right: 2rem;
}

.rdp-dropdown:focus {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 1px;
}
```

---

## ✅ SOLUTION 4 : REMPLACER LES INPUT TYPE="DATE" NATIFS

### 4.1 Chercher tous les input type="date"

```bash
# Rechercher dans le projet
grep -rn 'type="date"' app/ components/ --include="*.tsx" --include="*.ts"
```

### 4.2 Remplacer par DatePicker

**AVANT ❌ :**
```typescript
<Input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
```

**APRÈS ✅ :**
```typescript
import { DatePicker } from '@/components/ui/date-picker'

<DatePicker
  value={date ? new Date(date) : undefined}
  onChange={(newDate) => setDate(newDate?.toISOString().split('T')[0])}
  placeholder="Sélectionner une date"
/>
```

### 4.3 Pages à vérifier et corriger

1. **`/app/prestataire/agenda/page.tsx`**
   - Remplacer input date par DatePicker
   - Modal "Créer événement"

2. **`/app/couple/timeline/page.tsx`**
   - Remplacer input date par DatePicker
   - Calendrier principal

3. **`/app/couple/profil/page.tsx`**
   - Date de mariage : utiliser DatePicker

4. **Composant BusinessNameEditor, ProfileDescriptionEditor, etc.**
   - Vérifier qu'ils n'utilisent pas de date natifs

---

## 🎯 CHECKLIST DE VALIDATION

Après avoir appliqué toutes les corrections :

### Composants
- [ ] `calendar-shadcn.tsx` renommé en `calendar.tsx`
- [ ] `calendar-old-custom.tsx` sauvegardé (à supprimer après validation)
- [ ] `date-picker.tsx` mis à jour avec import correct

### Calendar.tsx
- [ ] `captionLayout="dropdown"` supporté
- [ ] Classes `head_row: "flex w-full"` présentes
- [ ] Classes `row: "flex w-full mt-1"` présentes
- [ ] Classes `day: "flex items-center justify-center"` présentes
- [ ] `fromYear` et `toYear` configurables

### Globals.css
- [ ] Styles `.rdp-table`, `.rdp-row`, `.rdp-head_row` ajoutés
- [ ] `display: flex !important` sur les rows
- [ ] Dropdowns stylisés avec flèche

### Pages corrigées
- [ ] `/app/prestataire/agenda/page.tsx` utilise DatePicker
- [ ] `/app/couple/timeline/page.tsx` utilise DatePicker
- [ ] `/app/couple/profil/page.tsx` utilise DatePicker
- [ ] Tous les `type="date"` remplacés

### Tests visuels
- [ ] Calendrier s'affiche en GRILLE 7x7 (pas verticalement)
- [ ] Sélecteurs mois/année (dropdown) fonctionnent
- [ ] Pas de chevauchement visuel
- [ ] Hover sur les jours fonctionne
- [ ] Sélection d'une date fonctionne
- [ ] Calendrier se ferme après sélection

---

## 🧪 TEST RAPIDE

### Test 1 : DatePicker standalone

```tsx
// Créer une page de test : app/test-calendar/page.tsx

'use client'

import { useState } from 'react'
import { DatePicker } from '@/components/ui/date-picker'

export default function TestCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-md mx-auto space-y-8">
        <h1 className="text-2xl font-bold">Test DatePicker</h1>

        <div>
          <label className="block text-sm font-medium mb-2">
            Sélectionner une date
          </label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="JJ/MM/AAAA"
          />
        </div>

        {date && (
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">Date sélectionnée :</p>
            <p className="font-semibold">{date.toLocaleDateString('fr-FR')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Tester :**
1. Aller sur `/test-calendar`
2. Cliquer sur le DatePicker
3. **VÉRIFIER** : Le calendrier s'affiche en GRILLE (pas verticalement)
4. **VÉRIFIER** : Les dropdowns mois/année fonctionnent
5. Sélectionner une date
6. **VÉRIFIER** : Le calendrier se ferme et la date s'affiche

---

## 🐛 SI LE PROBLÈME PERSISTE

### Debug étape par étape

1. **Inspecter l'élément dans DevTools**
   ```
   - Ouvrir le calendrier
   - DevTools > Inspector
   - Sélectionner `.rdp-row`
   - Vérifier que `display: flex` est appliqué
   - Vérifier qu'aucun style n'écrase avec `display: block`
   ```

2. **Vérifier les imports**
   ```typescript
   // S'assurer d'importer depuis le bon fichier
   import { Calendar } from "@/components/ui/calendar"
   // PAS depuis calendar-shadcn ou calendar-old-custom
   ```

3. **Vérifier la version de react-day-picker**
   ```bash
   npm list react-day-picker
   # Devrait être ^8.10.0 ou supérieur

   # Si version < 8, mettre à jour :
   npm install react-day-picker@latest
   ```

4. **Vérifier que date-fns est installé**
   ```bash
   npm list date-fns
   # Devrait être ^3.0.0 ou supérieur

   # Si absent :
   npm install date-fns
   ```

---

## 📝 NOTES IMPORTANTES

1. **Ne PAS utiliser calendar.tsx custom**
   - Le calendrier avec Framer Motion (calendar-old-custom.tsx) n'a pas `captionLayout="dropdown"`
   - Supprimer après validation que tout fonctionne

2. **Toujours utiliser captionLayout="dropdown"**
   ```tsx
   <Calendar
     mode="single"
     captionLayout="dropdown" // ⚠️ OBLIGATOIRE
     fromYear={2020}
     toYear={2050}
   />
   ```

3. **Tailles recommandées**
   - Cell : `w-9 h-9` (36x36px)
   - Day button : `w-9 h-9`
   - Font size : `text-sm` (14px)

4. **Locale français**
   ```typescript
   import { fr } from "date-fns/locale"

   <DayPicker
     locale={fr}
     weekStartsOn={1} // Lundi
   />
   ```

---

## ✅ RÉSULTAT ATTENDU

**Calendrier AVANT (cassé) :**
```
1
2
3
4
5
6
7
...
```

**Calendrier APRÈS (corrigé) :**
```
Lu  Ma  Me  Je  Ve  Sa  Di
                 1   2   3
 4   5   6   7   8   9  10
11  12  13  14  15  16  17
18  19  20  21  22  23  24
25  26  27  28  29  30  31
```

**Interface complète :**
- Sélecteurs mois/année en dropdown (pas de flèches)
- Grille 7 colonnes x 6 lignes
- Hover smooth sur les jours
- Date du jour mise en évidence
- Fermeture automatique après sélection

---

**FIN DU PROMPT FIX CALENDRIERS**
