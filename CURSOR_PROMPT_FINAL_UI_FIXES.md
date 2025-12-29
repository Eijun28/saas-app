# PROMPT CURSOR - CORRECTIONS FINALES UI/UX V1

## CONTEXTE
Corrections finales pour la version 1 du dashboard prestataire :
1. ❌ Problème de chevauchement visuel dans les sélecteurs (cultures/départements)
2. ❌ Les badges sélectionnés doivent être violets dégradés
3. ❌ TopBar doit afficher : photo profil + notifications + recherche + nom (à gauche)

---

## 🔧 PROBLÈME 1 : CHEVAUCHEMENT POPOVER + COMMAND

### Diagnostic
Dans `CultureSelector.tsx` et `ZoneSelector.tsx`, le composant `Command` (qui a `rounded-md`) est placé dans un `PopoverContent`, créant un conflit visuel : section arrondie dans section rectangulaire qui se chevauchent mal.

### Solution
Ajuster les styles pour harmoniser PopoverContent et Command.

### Actions

```typescript
// components/provider/CultureSelector.tsx
// LIGNE 157 - AVANT
<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
  <Command>

// LIGNE 157 - APRÈS
<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border-0 shadow-lg" align="start">
  <Command className="rounded-lg border-0">
```

```typescript
// components/provider/ZoneSelector.tsx
// LIGNE 154 - AVANT
<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
  <Command>

// LIGNE 154 - APRÈS
<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-lg border-0 shadow-lg" align="start">
  <Command className="rounded-lg border-0">
```

**Explication :**
- `rounded-lg` : harmonise le rayon de courbure
- `border-0` : supprime les bordures qui créent le double contour
- `shadow-lg` : ajoute une ombre moderne pour le popover

---

## 🎨 PROBLÈME 2 : BADGES VIOLETS DÉGRADÉS

### Diagnostic
Les badges sélectionnés utilisent actuellement `variant="secondary"` (gris clair). Il faut un gradient violet pour les éléments sélectionnés.

### Solution
Remplacer les badges secondaires par des badges avec gradient violet.

### Actions

```typescript
// components/provider/CultureSelector.tsx
// LIGNE 193-205 - AVANT
<Badge
  key={id}
  variant="secondary"
  className="pl-3 pr-2 py-1"
>
  {culture.label}
  <button
    onClick={() => removeCulture(id)}
    className="ml-2 hover:bg-muted rounded-full p-0.5"
  >
    <X className="h-3 w-3" />
  </button>
</Badge>

// LIGNE 193-205 - APRÈS
<Badge
  key={id}
  className="pl-3 pr-2 py-1.5 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white border-0 hover:from-[#6D3478] hover:to-[#823F91] transition-all"
>
  {culture.label}
  <button
    onClick={() => removeCulture(id)}
    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
  >
    <X className="h-3 w-3 text-white" />
  </button>
</Badge>
```

```typescript
// components/provider/ZoneSelector.tsx
// LIGNE 192-204 - AVANT
<Badge
  key={id}
  variant="secondary"
  className="pl-3 pr-2 py-1"
>
  {dept.label}
  <button
    onClick={() => removeZone(id)}
    className="ml-2 hover:bg-muted rounded-full p-0.5"
  >
    <X className="h-3 w-3" />
  </button>
</Badge>

// LIGNE 192-204 - APRÈS
<Badge
  key={id}
  className="pl-3 pr-2 py-1.5 bg-gradient-to-r from-[#823F91] to-[#9D5FA8] text-white border-0 hover:from-[#6D3478] hover:to-[#823F91] transition-all"
>
  {dept.label}
  <button
    onClick={() => removeZone(id)}
    className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
  >
    <X className="h-3 w-3 text-white" />
  </button>
</Badge>
```

**Résultat attendu :**
- Badges avec dégradé violet (#823F91 → #9D5FA8)
- Texte blanc
- Hover : dégradé plus foncé
- Bouton X blanc avec fond semi-transparent au hover

---

## 👤 PROBLÈME 3 : TOPBAR - RÉORGANISATION

### Diagnostic
La TopBar actuelle a les éléments à droite. Il faut déplacer certains éléments à gauche :
- **À GAUCHE** : Photo de profil + Nom du prestataire
- **AU CENTRE** : Titre de la page
- **À DROITE** : Recherche + Notifications

### Solution
Restructurer la TopBar pour un meilleur équilibre visuel.

### Actions

```typescript
// components/layout/TopBar.tsx
// REMPLACER LA SECTION LIGNE 349-538 par :

<motion.header
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
  className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-[#E5E7EB]"
>
  <div className="flex items-center justify-between gap-4">
    {/* LEFT SIDE - User Profile + Name */}
    <div className="flex items-center gap-3 min-w-0">
      {profile && (
        <>
          <UserAvatar
            src={photoUrl}
            fallback={
              userRole === 'couple' && profile.partner_1_name && profile.partner_2_name
                ? `${profile.partner_1_name[0] || ''}${profile.partner_2_name[0] || ''}`.trim() || user?.email?.[0]?.toUpperCase() || 'U'
                : userRole === 'couple' && profile.partner_1_name
                ? profile.partner_1_name[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
                : `${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email?.[0]?.toUpperCase() || 'U'
            }
            size="md"
            status="online"
          />
          <div className="hidden md:block min-w-0">
            <p className="text-sm font-semibold text-[#0B0E12] truncate">
              {userRole === 'couple' && profile.displayName
                ? profile.displayName
                : `${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email?.split('@')[0] || 'Utilisateur'}
            </p>
            <p className="text-xs text-[#6B7280] truncate">
              {userRole === 'prestataire' ? 'Prestataire' : 'Couple'}
            </p>
          </div>
        </>
      )}
    </div>

    {/* CENTER - Page Title */}
    <div className="flex-1 flex items-center justify-center">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-2 text-sm text-[#374151]">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-2">
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-[#823F91] transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-[#0B0E12] font-medium">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </span>
          ))}
        </nav>
      ) : (
        <h1 className="text-xl md:text-2xl font-bold text-[#0B0E12]">{pageTitle}</h1>
      )}
    </div>

    {/* RIGHT SIDE - Search + Notifications + User Menu */}
    <div className="flex items-center gap-3">
      {/* Search Popover */}
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <div
          onMouseEnter={() => setIsSearchOpen(true)}
          onMouseLeave={() => setIsSearchOpen(false)}
          className="relative"
        >
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-purple-50 transition-colors"
              title="Recherche"
            >
              <Search className="h-5 w-5 text-[#374151]" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4"
            align="end"
            onMouseEnter={() => setIsSearchOpen(true)}
            onMouseLeave={() => setIsSearchOpen(false)}
          >
            <form onSubmit={handleSearch} className="space-y-3">
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-[#823F91] text-white px-4 py-2 rounded-lg hover:bg-[#6D3478] transition-colors text-sm font-medium"
              >
                Rechercher
              </button>
            </form>
          </PopoverContent>
        </div>
      </Popover>

      {/* Notifications Popover */}
      <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <div
          onMouseEnter={() => setIsNotificationsOpen(true)}
          onMouseLeave={() => setIsNotificationsOpen(false)}
          className="relative"
        >
          <PopoverTrigger asChild>
            <button
              className="relative p-2 rounded-lg hover:bg-purple-50 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-[#374151]" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-[#823F91] rounded-full" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0"
            align="end"
            onMouseEnter={() => setIsNotificationsOpen(true)}
            onMouseLeave={() => setIsNotificationsOpen(false)}
          >
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#4A4A4A]">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-[#0B0E12]">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[#E8D4EF]/50 transition-colors border-b border-gray-100 last:border-b-0 cursor-default"
                    >
                      <div className={`mt-1 ${
                        notif.type === 'message' ? 'text-blue-500' :
                        notif.type === 'budget' ? 'text-green-500' :
                        'text-purple-500'
                      }`}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0B0E12] truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-[#4A4A4A] truncate mt-1">
                          {notif.description}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-1">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PopoverContent>
        </div>
      </Popover>

      {/* User Menu Dropdown */}
      {profile && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 transition-colors">
              <span className="sr-only">Menu utilisateur</span>
              <div className="w-2 h-2 bg-[#823F91] rounded-full" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 !bg-gradient-to-br !from-purple-100 !via-purple-50 !to-white border-0 backdrop-blur-none">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-[#0B0E12]">
                {userRole === 'couple' && profile.displayName
                  ? profile.displayName
                  : `${profile.prenom || ''} ${profile.nom || ''}`.trim() || user?.email?.split('@')[0] || 'Utilisateur'}
              </p>
              <p className="text-xs text-[#6B7280] truncate">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const profilePath = userRole === 'couple' ? '/couple/profil' : '/prestataire/profil-public'
                router.push(profilePath)
              }}
              className="cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </div>
</motion.header>
```

**Changements clés :**
1. **Gauche** : Avatar + Nom + Rôle (visible sur desktop)
2. **Centre** : Titre de la page (flex-1 justify-center)
3. **Droite** : Recherche + Notifications + Menu (icône simplifiée)
4. **Hover effects** : `hover:bg-purple-50` au lieu de `hover:bg-purple-200`

---

## 🎯 CHECKLIST DE VALIDATION

Après avoir appliqué tous les changements :

- [ ] **Sélecteur cultures** : Le popover s'affiche proprement sans chevauchement
- [ ] **Sélecteur zones** : Le popover s'affiche proprement sans chevauchement
- [ ] **Badges violets** : Les cultures/départements sélectionnés ont un dégradé violet
- [ ] **Badges hover** : Le dégradé devient plus foncé au survol
- [ ] **Bouton X blanc** : L'icône X est blanche et visible sur le fond violet
- [ ] **TopBar gauche** : Avatar + Nom visible à gauche
- [ ] **TopBar centre** : Titre de la page centré
- [ ] **TopBar droite** : Recherche + Notifications + Menu alignés à droite
- [ ] **Responsive** : Sur mobile, le nom disparaît mais l'avatar reste

---

## 📝 NOTES IMPORTANTES

1. **CommandList** : Pour ZoneSelector, ajouter `CommandList` si absent (déjà importé ligne 13)
2. **Transitions** : Les badges doivent avoir `transition-all` pour des animations fluides
3. **Accessibilité** : Garder `sr-only` pour le menu utilisateur
4. **Gradient cohérent** : Utiliser exactement `from-[#823F91] to-[#9D5FA8]` partout

---

## 🚀 ORDRE D'EXÉCUTION

1. Fixer le chevauchement PopoverContent (CultureSelector + ZoneSelector) ✅
2. Appliquer les badges violets dégradés (CultureSelector + ZoneSelector) ✅
3. Restructurer la TopBar (gauche/centre/droite) ✅
4. Tester tous les sélecteurs (cultures, départements) ✅
5. Vérifier responsive sur mobile/tablet ✅
6. Valider les hovers et transitions ✅

---

## ✨ RÉSULTAT ATTENDU

**Sélecteurs :**
- ✅ Popup propre sans chevauchement visuel
- ✅ Badges violets avec gradient élégant
- ✅ Bouton X blanc visible

**TopBar :**
- ✅ Organisation claire : Profil (gauche) | Titre (centre) | Actions (droite)
- ✅ Avatar avec statut "en ligne"
- ✅ Nom et rôle visibles
- ✅ Recherche et notifications accessibles

**UX :**
- ✅ Interface cohérente et professionnelle
- ✅ Prête pour la v1
- ✅ Design moderne SaaS 2025

---

**FIN DU PROMPT - CORRECTIONS FINALES V1**
