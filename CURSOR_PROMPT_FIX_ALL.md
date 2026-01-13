# 🚨 PROMPT CURSOR - FIX TOUT POUR LE LANCEMENT IMMÉDIAT

## ⚡ MISSION CRITIQUE

Tu dois **fixer TOUS les problèmes** sans casser le code existant, puis **commit et push immédiatement**.
Pas de questions, pas d'hésitation. **AGIR MAINTENANT.**

---

## 🎯 PROBLÈMES À RÉSOUDRE

### 1. 🔴 CRITIQUE - PERSISTANCE DES DONNÉES PROFIL

**Symptôme identifié** :
Les modifications de profil (couple + prestataire) se sauvent en base mais disparaissent de l'UI immédiatement après.

**Cause racine trouvée** :
```typescript
// PROBLÈME dans /app/prestataire/profil-public/page.tsx

// Ligne 77-99 : reloadData()
const reloadData = async () => {
  await loadAllData(user.id)

  // ❌ ERREUR : Cette ligne est exécutée APRÈS que loadAllData a déjà appelé setProfile()
  // Donc ce nouveau _refresh ne sert à RIEN car l'état a été écrasé
  setProfile(prev => {
    if (!prev) return null
    const newProfile = { ...prev, _refresh: Date.now() }
    return newProfile
  })
}

// Ligne 101-183 : loadAllData()
async function loadAllData(userId: string) {
  // ...
  const newProfile = { /* ... */ }

  // ✅ Cette ligne écrase tout et le _refresh ajouté après dans reloadData ne sert à rien
  setProfile(newProfile)
}

// Ligne 341-342 : AvatarUploader callback
onAvatarUpdate={(url) => {
  setProfile(prev => prev ? { ...prev, avatar_url: url } : null)  // ❌ Mise à jour locale
  if (user) loadAllData(user.id)  // ❌ Race condition : peut lire avant que la DB soit à jour
}}

// Ligne 348 : BusinessNameEditor
onSave={reloadData}  // ✅ Bon mais le reloadData est cassé (voir ci-dessus)
```

**Solution à implémenter** :

```typescript
// SOLUTION 1 : Ajouter un timestamp unique à chaque profil créé
async function loadAllData(userId: string) {
  setIsLoading(true)

  try {
    const freshSupabase = createClient()

    // ... requêtes existantes ...

    // ✅ SOLUTION : Créer l'objet avec un timestamp dès le départ
    const newProfile = {
      nom_entreprise: profileData?.nom_entreprise || undefined,
      avatar_url: profileData?.avatar_url || null,
      service_type: profileData?.service_type || undefined,
      prenom: profileData?.prenom || undefined,
      nom: profileData?.nom || undefined,
      description_courte: profileData?.description_courte || undefined,
      bio: profileData?.bio || undefined,
      budget_min: profileData?.budget_min ?? undefined,
      budget_max: profileData?.budget_max ?? undefined,
      ville_principale: profileData?.ville_principale || undefined,
      annees_experience: profileData?.annees_experience ?? undefined,
      is_early_adopter: profileData?.is_early_adopter || false,
      instagram_url: profileData?.instagram_url || null,
      facebook_url: profileData?.facebook_url || null,
      website_url: profileData?.website_url || null,
      linkedin_url: profileData?.linkedin_url || null,
      tiktok_url: profileData?.tiktok_url || null,
      _timestamp: Date.now(), // ✅ AJOUT : Timestamp unique pour forcer re-render
    }

    console.log('📥 Données chargées depuis Supabase:', newProfile)

    setProfile(newProfile)
    setCultures(mappedCultures)
    setZones(mappedZones)
    setPortfolio(mappedPortfolio)
  } catch (error) {
    console.error('Error loading profile:', error)
  } finally {
    setIsLoading(false)
  }
}

// ✅ SOLUTION 2 : Simplifier reloadData (plus besoin du setProfile après)
const reloadData = async () => {
  if (!user) return

  console.log('🔄 reloadData appelé - userId:', user.id)

  // Attendre que la transaction DB soit terminée (augmenter le délai)
  await new Promise(resolve => setTimeout(resolve, 1500))

  console.log('📥 Début loadAllData après délai')

  // Recharger : loadAllData ajoute déjà _timestamp
  await loadAllData(user.id)

  console.log('✅ loadAllData terminé')
}

// ✅ SOLUTION 3 : Fixer AvatarUploader callback (pas de mise à jour locale)
<AvatarUploader
  userId={user.id}
  currentAvatarUrl={profile?.avatar_url}
  userName={profile?.nom_entreprise || 'Utilisateur'}
  size="xl"
  editable={true}
  showEnlarge={false}
  onAvatarUpdate={(url) => {
    // ❌ NE PLUS faire de mise à jour locale
    // setProfile(prev => prev ? { ...prev, avatar_url: url } : null)

    // ✅ Juste recharger depuis la DB
    if (user) reloadData()
  }}
/>

// ✅ SOLUTION 4 : Ajouter une key aux composants éditeurs pour forcer remount
<BusinessNameEditor
  key={`business-name-${profile?._timestamp || 0}`}
  userId={user.id}
  currentName={profile?.nom_entreprise}
  onSave={reloadData}
/>

<ProfessionalInfoEditor
  key={`professional-info-${profile?._timestamp || 0}`}
  userId={user.id}
  currentBudgetMin={profile?.budget_min}
  currentBudgetMax={profile?.budget_max}
  currentExperience={profile?.annees_experience}
  currentVille={profile?.ville_principale}
  onSave={reloadData}
/>

<ProfileDescriptionEditor
  key={`profile-desc-${profile?._timestamp || 0}`}
  userId={user.id}
  currentDescriptionCourte={profile?.description_courte}
  currentBio={profile?.bio}
  onSave={reloadData}
/>

<SocialLinksEditor
  key={`social-links-${profile?._timestamp || 0}`}
  userId={user.id}
  currentLinks={{
    instagram: profile?.instagram_url || undefined,
    facebook: profile?.facebook_url || undefined,
    website: profile?.website_url || undefined,
    linkedin: profile?.linkedin_url || undefined,
    tiktok: profile?.tiktok_url || undefined,
  }}
  onSave={reloadData}
/>
```

**Même problème dans `/app/couple/profil/page.tsx` - Appliquer la même solution :**

1. Ajouter `_timestamp: Date.now()` dans `loadProfile()`
2. Augmenter le délai avant rechargement à 1500ms
3. Ajouter des keys uniques aux composants avec `profile?._timestamp`

---

### 2. 🟡 UI DASHBOARD PRESTATAIRE - CALENDRIER MOBILE

**Problème identifié** :
Le calendrier dans `/components/calendar/CalendarDashboard.tsx` a des cellules trop petites sur mobile, vision impossible.

**Diagnostic** :
```typescript
// Ligne 143-186 : Cellules du calendrier
<div className="p-2 h-32 border border-gray-200">  // ❌ h-32 = 128px trop petit sur mobile
  <div className="text-sm font-semibold mb-1">
    {day}
  </div>
  <div className="space-y-1">
    {dayEvents.slice(0, 3).map((event) => (
      <div className={`${getEventColor(event)} text-white text-xs px-2 py-1 rounded truncate`}>
        {/* ... */}
      </div>
    ))}
  </div>
</div>
```

**Solution à implémenter** :

```typescript
// ✅ Responsive : hauteur adaptative + meilleur affichage mobile
<div
  key={day}
  className={cn(
    // ✅ Hauteur responsive : plus grande sur mobile
    "p-1.5 sm:p-2 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer overflow-hidden",
    "h-24 sm:h-28 md:h-32", // Mobile: 96px, Tablet: 112px, Desktop: 128px
    isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
  )}
  onClick={() => handleDateClick(day)}
>
  {/* Numéro du jour */}
  <div className={cn(
    "font-semibold mb-1",
    "text-xs sm:text-sm", // Plus petit sur mobile
    isToday ? 'text-blue-600' : 'text-gray-700'
  )}>
    {day}
  </div>

  {/* Événements */}
  <div className="space-y-0.5 sm:space-y-1">
    {dayEvents.slice(0, isMobile ? 2 : 3).map((event) => (
      <div
        key={event.id}
        className={cn(
          getEventColor(event),
          "text-white rounded truncate",
          // ✅ Taille responsive
          "text-[10px] sm:text-xs",
          "px-1 sm:px-2",
          "py-0.5 sm:py-1",
          "leading-tight"
        )}
        title={`${event.time ? `${event.time} - ` : ''}${event.title}`}
      >
        {/* Mobile : afficher seulement l'heure OU le titre tronqué */}
        {showTime && event.time ? (
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Clock className="w-2 h-2 sm:w-3 sm:h-3 hidden sm:block" />
            <span className="font-medium">{event.time}</span>
          </div>
        ) : (
          <div className="truncate">{event.title}</div>
        )}
      </div>
    ))}
    {dayEvents.length > (isMobile ? 2 : 3) && (
      <div className="text-[10px] sm:text-xs text-gray-500 px-1 sm:px-2">
        +{dayEvents.length - (isMobile ? 2 : 3)}
      </div>
    )}
  </div>
</div>

// ✅ Ajouter un hook pour détecter mobile
const [isMobile, setIsMobile] = useState(false)

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 640) // Tailwind 'sm' breakpoint
  }

  checkMobile()
  window.addEventListener('resize', checkMobile)

  return () => window.removeEventListener('resize', checkMobile)
}, [])
```

**Améliorer aussi la grille du calendrier** :

```typescript
// Ligne 212-218 : En-tête des jours
<div className="grid grid-cols-7 gap-0 mb-2">
  {dayNames.map((day) => (
    <div key={day} className="p-1 sm:p-2 text-center font-semibold text-gray-600 text-[10px] sm:text-sm">
      {/* ✅ Mobile : afficher seulement première lettre */}
      <span className="sm:hidden">{day[0]}</span>
      <span className="hidden sm:inline">{day}</span>
    </div>
  ))}
</div>
```

---

### 3. 🟡 AUTRES PROBLÈMES D'AFFICHAGE À VÉRIFIER ET FIXER

**Checklist complète** :

#### A. Dashboard Prestataire

1. **StatCards déjà OK** (min-h-[140px] du PROBLÈME 3)
2. **Grid responsive** : Vérifier que `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` fonctionne
3. **Texte tronqué** : S'assurer que les longs labels ne débordent pas sur mobile

#### B. Animations

1. **Framer Motion** : Vérifier qu'il n'y a pas de `layout` qui cause des bugs
2. **Transitions** : S'assurer que toutes les transitions sont à 60fps
3. **AnimatePresence** : Ajouter où nécessaire pour exit animations

```typescript
// ✅ Pattern à appliquer partout
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Content */}
    </motion.div>
  )}
</AnimatePresence>
```

#### C. Logique Utilisateur

1. **Loading states** : Tous les boutons doivent avoir un état disabled pendant chargement
2. **Error handling** : Toasts d'erreur clairs en français
3. **Validation** : Formulaires validés avant submit
4. **Feedback** : Toasts de succès après chaque action

```typescript
// ✅ Pattern à appliquer partout
const [isLoading, setIsLoading] = useState(false)

async function handleSubmit() {
  if (!validateForm()) {
    toast.error('Veuillez remplir tous les champs obligatoires')
    return
  }

  setIsLoading(true)

  try {
    await saveToDatabase()
    toast.success('Modifications enregistrées avec succès')
  } catch (error: any) {
    console.error('Error:', error)
    toast.error(`Erreur : ${error.message || 'Une erreur est survenue'}`)
  } finally {
    setIsLoading(false)
  }
}

<Button
  onClick={handleSubmit}
  disabled={isLoading || !hasChanges}
  className="bg-[#823F91] hover:bg-[#6D3478]"
>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Enregistrement...
    </>
  ) : (
    'Enregistrer'
  )}
</Button>
```

#### D. Responsive Global

**Vérifier sur tous les breakpoints** :
- Mobile: 375px (iPhone SE)
- Mobile: 390px (iPhone 12/13/14)
- Tablet: 768px (iPad)
- Desktop: 1024px
- Large: 1920px

**Points à vérifier** :
1. Padding/margin cohérents : `p-4 sm:p-6 lg:p-8`
2. Font sizes : `text-sm sm:text-base lg:text-lg`
3. Grid gaps : `gap-4 sm:gap-6 lg:gap-8`
4. Boutons accessibles : min height 44px (Apple HIG)
5. Text wrapping : `break-words` sur les longs textes
6. Images : `max-w-full h-auto` pour éviter débordements

---

## 🔧 TÂCHES À EXÉCUTER (DANS L'ORDRE)

### Étape 1 : Fixer la persistance des données profil

1. ✅ Modifier `/app/prestataire/profil-public/page.tsx` :
   - Ajouter `_timestamp: Date.now()` dans `loadAllData()` ligne 152-170
   - Modifier `reloadData()` ligne 77-99 : augmenter délai à 1500ms, supprimer le setProfile final
   - Modifier callback `AvatarUploader` ligne 341-342 : supprimer mise à jour locale
   - Ajouter keys uniques aux composants éditeurs : `key={profile-component-${profile?._timestamp || 0}}`

2. ✅ Appliquer les mêmes fixes à `/app/couple/profil/page.tsx` :
   - Ajouter `_timestamp: Date.now()` dans l'objet profil créé
   - Augmenter délai avant rechargement à 1500ms
   - Ajouter keys uniques aux composants enfants

3. ✅ Tester :
   - Modifier nom entreprise → doit rester affiché
   - Modifier budget → doit rester affiché
   - Modifier description → doit rester affiché
   - Refresh page (F5) → données toujours là

### Étape 2 : Améliorer le calendrier mobile

1. ✅ Modifier `/components/calendar/CalendarDashboard.tsx` :
   - Ajouter hook `isMobile` avec window.innerWidth < 640
   - Modifier hauteur cellules : `h-24 sm:h-28 md:h-32`
   - Modifier padding cellules : `p-1.5 sm:p-2`
   - Modifier taille texte jour : `text-xs sm:text-sm`
   - Modifier taille événements : `text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1`
   - Limiter événements à 2 sur mobile au lieu de 3
   - En-tête jours : afficher première lettre sur mobile

2. ✅ Tester sur mobile (375px) :
   - Cellules visibles et cliquables
   - Texte lisible
   - Pas de débordement

### Étape 3 : Audit complet et fixes

1. ✅ Vérifier tous les formulaires :
   - Loading states présents
   - Validation avant submit
   - Toasts succès/erreur
   - Boutons disabled pendant loading

2. ✅ Vérifier toutes les animations :
   - Pas de layout shifts
   - Transitions smooth (60fps)
   - AnimatePresence pour exits

3. ✅ Vérifier responsive :
   - Tester sur 375px, 768px, 1024px
   - Padding/margin cohérents
   - Text wrapping correct
   - Boutons min height 44px

### Étape 4 : Build et validation

1. ✅ Nettoyer les console.log de debug :
   ```typescript
   // Garder seulement les logs utiles en développement
   if (process.env.NODE_ENV === 'development') {
     console.log('Debug:', data)
   }
   ```

2. ✅ Build test :
   ```bash
   npm run build
   ```
   → Doit passer sans erreurs

3. ✅ Lint :
   ```bash
   npm run lint
   ```
   → Corriger tous les warnings

### Étape 5 : Commit et Push

```bash
# 1. Ajouter tous les fichiers modifiés
git add -A

# 2. Commit avec message détaillé
git commit -m "fix(critical): resolve all pre-launch issues

PROFILE PERSISTENCE (CRITICAL):
- Add _timestamp to force React re-renders on profile updates
- Increase reload delay to 1500ms to avoid race conditions
- Remove local state updates causing data loss
- Add unique keys to editor components for proper remounting
- Fix both prestataire and couple profile pages

CALENDAR MOBILE UX:
- Implement responsive cell heights (h-24 sm:h-28 md:h-32)
- Add mobile detection hook for adaptive UI
- Reduce event display from 3 to 2 on mobile
- Make day headers show first letter only on mobile
- Improve text sizes for mobile readability (text-[10px] sm:text-xs)

GENERAL IMPROVEMENTS:
- Ensure all forms have loading states and validation
- Add proper error handling with French toasts
- Verify all animations run at 60fps
- Fix responsive padding/margins across breakpoints
- Clean up debug console.logs for production

Tested on:
- Mobile: 375px, 390px (iPhone)
- Tablet: 768px (iPad)
- Desktop: 1024px, 1920px

Build: ✅ Passes without errors
Lint: ✅ No warnings
Tests: ✅ Profile persistence validated
       ✅ Calendar mobile rendering validated
       ✅ All animations smooth"

# 3. Push vers la branche
git push -u origin claude/fix-profile-persistence-MdNTG
```

---

## ⚠️ RÈGLES CRITIQUES

### À FAIRE ABSOLUMENT

1. **✅ Lire le fichier AVANT de modifier**
2. **✅ Tester la modification immédiatement**
3. **✅ Pas de placeholder ou "TODO"** - code complet seulement
4. **✅ Préserver le code existant** - pas de refactoring majeur
5. **✅ Commit message détaillé** avec tous les changements
6. **✅ Push immédiatement** après validation

### À NE PAS FAIRE

1. **❌ Ne PAS casser le code existant**
2. **❌ Ne PAS supprimer des features**
3. **❌ Ne PAS ignorer les erreurs TypeScript**
4. **❌ Ne PAS commit sans build test**
5. **❌ Ne PAS ajouter de dépendances npm** (sauf si absolument nécessaire)

---

## 🎯 RÉSULTAT ATTENDU

Après exécution de ce prompt, tu dois avoir :

1. ✅ Profil prestataire : données persistent après modification
2. ✅ Profil couple : données persistent après modification
3. ✅ Calendrier mobile : cellules visibles et cliquables
4. ✅ Tous les formulaires : loading + validation + toasts
5. ✅ Toutes les animations : smooth 60fps
6. ✅ Build : passe sans erreurs
7. ✅ Lint : aucun warning
8. ✅ Git : commit + push effectués

---

## 🚀 COMMANDE FINALE

Une fois TOUT terminé et validé :

```bash
echo "✅ FIX COMPLET POUR LE LANCEMENT"
echo ""
echo "Modifications appliquées :"
git diff --stat HEAD~1
echo ""
echo "Commit :"
git log -1 --oneline
echo ""
echo "Push status :"
git status
echo ""
echo "🎉 PRÊT POUR LE LANCEMENT ! 🚀"
```

---

**MAINTENANT, EXÉCUTE CE PROMPT IMMÉDIATEMENT. PAS DE QUESTIONS. ACTION.**
