# NUPLY — Audit Mobile-First & Plan d'Action

> Date : 2026-03-07 | Version : 2.0 (audit complet avec 4 agents paralleles)

---

## 1. AUDIT MOBILE-FIRST — Synthese

### 1.1 Score Global Mobile : 7.5/10

NUPLY est **globalement bien concu pour le mobile**. L'architecture de base est solide avec des patterns mobile-first correctement appliques dans la majorite du codebase. Cependant, l'audit detaille revele **12 problemes critiques ou hauts** qui impactent l'UX sur petits ecrans.

---

### 1.2 Points Forts (ce qui est bien fait)

#### Architecture & Layout
| Element | Implementation | Statut |
|---------|---------------|--------|
| Viewport meta | `width: device-width, initialScale: 1, maximumScale: 5` | Excellent |
| Conteneur principal | `h-svh overflow-hidden` (evite le bounce iOS) | Excellent |
| Bottom Nav Mobile | `MobileBottomNav` avec `safe-area-inset-bottom`, animation `slideInFromBottom` | Excellent |
| Sidebar responsive | Masquee mobile / icones tablette / complete desktop | OK |
| `TabletAwareSidebarProvider` | Detecte `>= 1024px` au montage, evite flash | OK |
| Main content scroll | `touch-pan-y overscroll-y-contain overflow-x-hidden` | Excellent |
| Padding progressif | `px-4 sm:px-5 md:px-6 lg:px-8` | Excellent |
| Bottom padding mobile | `pb-20 md:pb-6` pour la bottom nav | OK |

#### CSS & Safe Areas
| Element | Implementation | Statut |
|---------|---------------|--------|
| iOS Safari zoom fix | `font-size: 16px !important` sur inputs < 767px | Excellent |
| `safe-area-inset-*` | Bottom nav, chatbot, messagerie, sidebar, MoreSheet | Excellent |
| Unites viewport | `svh`, `dvh` utilises (pas `vh` seul) | Excellent |
| Texture de fond | Desactivee sur mobile (`display: none` < 767px) | OK |
| Particules auth | Reduites a 50 sur mobile (vs 200 desktop) | OK |

#### Responsive Tailwind
| Element | Implementation | Statut |
|---------|---------------|--------|
| Grids dashboard | `grid-cols-2 md:grid-cols-4` (mobile-first) | OK |
| Spacing adaptatif | `gap-3 sm:gap-4`, `p-4 sm:p-5` | OK |
| Texte adaptatif | `text-2xl sm:text-[32px]`, `text-sm sm:text-[15px]` | OK |
| Flex direction | `flex-col sm:flex-row` pattern consistent | OK |
| Hero font scaling | `text-[42px] sm:text-[56px] md:text-[80px] lg:text-[100px]` | Excellent |

#### Navigation Mobile
| Element | Implementation | Statut |
|---------|---------------|--------|
| Bottom Nav Couple | 4 items + "Plus" (sheet avec sections) | Excellent |
| Bottom Nav Prestataire | 4 items + "Plus" (Finances, Compte) | Excellent |
| More Sheet | Grid 3 cols, `92dvh` max, `overscroll-y-contain` | Excellent |
| Badges notifications | Count sur les items | OK |
| Auto-close on nav | `useEffect` ferme le sheet au changement de pathname | OK |

#### Dialogues & Modales
| Element | Implementation | Statut |
|---------|---------------|--------|
| Max width | `max-w-[calc(100vw-2rem)] sm:max-w-[450px]` | OK |
| Overflow | `max-h-[85vh] overflow-y-auto` ou `max-h-[90dvh]` | OK |

#### Page Programme Public
| Element | Implementation | Statut |
|---------|---------------|--------|
| Layout | `max-w-2xl mx-auto px-4 py-10` | Excellent |
| Timeline verticale | Adaptee mobile avec icones 48px | Excellent |
| Print styles | Classes `print:` incluses | Excellent |

---

### 1.3 Problemes Trouves — Classes par Severite

#### CRITIQUE (bloque l'UX mobile)

##### C1. Kanban 3 colonnes sur mobile — Demandes recues prestataire
**Fichier** : `app/prestataire/demandes-recues/page.tsx:347`
**Probleme** : Le Kanban affiche 3 colonnes (Nouvelles / En cours / Terminees) sans adaptation mobile. Sur un ecran de 375px, chaque colonne fait ~105px — illisible et inutilisable.
**Fix** : Single-column layout mobile avec swipe horizontal ou tabs pour chaque status.

##### C2. Boutons delete/edit invisibles sur mobile — Budget couple
**Fichier** : `app/couple/budget/page.tsx:569-586`
**Probleme** : Les boutons utilisent `md:opacity-0 md:group-hover:opacity-100`. Sur mobile **sans hover**, les boutons sont invisibles. L'utilisateur ne peut pas modifier ou supprimer une depense.
**Fix** : Toujours afficher les boutons sur mobile (`opacity-100 md:opacity-0 md:group-hover:opacity-100`).

##### C3. Stats grid 3 colonnes forcees sur mobile — Timeline couple
**Fichier** : `app/couple/timeline/page.tsx:361`
**Probleme** : `grid-cols-3 gap-1.5` force 3 colonnes sur mobile. Chaque carte fait ~110px sur 375px. Texte `text-[11px]` illisible.
**Fix** : `grid-cols-1 xs:grid-cols-3` ou `grid-cols-3` avec tailles de texte plus grandes.

##### C4. Stats grid 3 colonnes forcees sur mobile — Agenda prestataire
**Fichier** : `app/prestataire/agenda/page.tsx:531`
**Probleme** : `grid grid-cols-3 gap-3` sans breakpoint mobile. Labels comme "Aujourd'hui" debordent.
**Fix** : `grid-cols-1 sm:grid-cols-3`.

---

#### HAUT (UX degradee sur mobile)

##### H1. Touch targets < 44px — Multiples composants
**Fichiers concernes** :
| Composant | Fichier | Taille actuelle | Minimum |
|-----------|---------|-----------------|---------|
| MobileMenu close button | `components/layout/MobileMenu.tsx:52` | `p-2` + icone `h-5 w-5` = ~28px | 44x44px |
| Hamburger button | `app/prestataire/mobile-menu-client.tsx:22` | `p-2` + icone `h-6 w-6` = ~32px | 44x44px |
| Bottom nav icons | `components/layout/MobileBottomNav.tsx:255` | `h-[22px] w-[22px]` + `py-2.5` = ~42px | 44x44px |
| CRM toggle buttons | `app/prestataire/contacts/page.tsx:339` | `p-1.5` = ~30px | 44x44px |
| CRM search input | `app/prestataire/contacts/page.tsx:336` | `h-9` = 36px | 44px |
| CRM KPI buttons | `app/prestataire/contacts/page.tsx:283` | `px-3 py-2` = ~36px | 44x44px |
| Refresh button demandes | `app/prestataire/demandes-recues/page.tsx:318` | `h-8 w-8` = 32px | 44x44px |
| Footer social icons | `components/layout/Footer.tsx` | `w-4 h-4` = 16px | 44x44px |
| Sign-up step buttons | `app/sign-up/page.tsx` | `px-5 py-2` = ~32px | 44x44px |
| Sign-up back button | `app/sign-up/page.tsx` | `p-1` = ~24px | 44x44px |
| Forgot password link | `app/sign-in/page.tsx` | `text-xs` = ~22px | 44px |

**Fix global** : Ajouter `min-h-[44px] min-w-[44px]` sur tous les elements interactifs, ou utiliser la classe `.click-target-44` deja definie dans globals.css mais peu utilisee.

##### H2. 4 tabs fixes sur mobile — Devis & Factures prestataire
**Fichier** : `app/prestataire/devis-factures/page.tsx:539`
**Probleme** : `grid grid-cols-4` pour les tabs. Sur mobile 375px, chaque tab fait ~90px — texte coupe. Les icones sont cachees (`hidden sm:inline`) mais les labels restent serres.
**Fix** : Tabs scrollables horizontalement ou drawer sur mobile.

##### H3. Dropdowns imbriques inutilisables — Recherche couple
**Fichier** : `app/couple/recherche/page.tsx:120-121`
**Probleme** : Les filtres utilisent des sous-dropdowns (`openSubDropdown`) qui sont inutilisables sur mobile tactile — pas d'alternative mobile (drawer, bottom sheet).
**Fix** : Remplacer par un bottom sheet de filtres sur mobile.

##### H4. Nav horizontale 12+ boutons — Profil public prestataire
**Fichier** : `app/prestataire/profil-public/page.tsx:350-371`
**Probleme** : 12+ boutons pills en scroll horizontal (`-mx-3 sm:-mx-4`) pour naviguer entre les sections du profil. Fonctionnel mais pas ergonomique — l'utilisateur ne sait pas qu'il peut scroller.
**Fix** : Ajouter un indicateur de scroll ou utiliser un accordion/drawer sur mobile.

##### H5. Messagerie — logique chat/liste fragile sur tablette
**Fichier** : `app/couple/messagerie/page.tsx:294-295`
**Probleme** : La logique `!isMobile || !selectedConversation` bascule abruptement a 768px. Sur tablette en portrait, la liste de conversations prend 340px et le chat est ecrase.
**Fix** : Affiner le breakpoint ou utiliser un layout adaptatif tablette.

---

#### MOYEN (ameliorations importantes)

##### M1. `useIsMobile` utilise `resize` au lieu de `matchMedia`
**Fichier** : `hooks/use-mobile.tsx`
**Probleme** : Re-renders inutiles sur iOS lors du scroll (la barre d'URL modifie la hauteur visible).
**Fix** :
```typescript
React.useEffect(() => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const onChange = () => setIsMobile(mql.matches)
  mql.addEventListener('change', onChange)
  setIsMobile(mql.matches)
  return () => mql.removeEventListener('change', onChange)
}, [])
```

##### M2. Comparaison favoris — scroll horizontal force
**Fichier** : `app/couple/favoris/page.tsx:413`
**Probleme** : `min-w-[320px]` en `grid-cols-3` = illisible sur 375px.
**Fix** : Stack vertical sur mobile ou limiter a 2 prestataires.

##### M3. Header couple — titre page masque sur mobile
**Fichier** : `components/layout/CoupleHeader.tsx:133-143`
**Probleme** : `hidden md:flex lg:hidden` — le titre de page n'est visible que sur tablette.
**Fix** : `hidden sm:flex lg:hidden` ou toujours visible en plus petit.

##### M4. Variables sidebar definies mais inutilisees
**Fichier** : `components/ui/sidebar.tsx:17-20`
**Probleme** : `SIDEBAR_WIDTH_MOBILE = "280px"` et `SIDEBAR_WIDTH_TABLET = "220px"` definis mais jamais utilises.
**Fix** : Utiliser les variables ou les supprimer.

##### M5. Bottom padding inconsistant couple vs prestataire
**Fichier** : `app/couple/sidebar-inset-wrapper.tsx:15` vs `app/prestataire/sidebar-inset-wrapper.tsx:14`
**Probleme** : Couple = `pb-20 md:pb-6`, Prestataire = `pb-20 md:pb-6 lg:pb-8`.
**Fix** : Harmoniser.

##### M6. `100vw` sur backgrounds fixes — scroll horizontal
**Fichiers** : `app/contact/page.tsx`, `app/tarifs/page.tsx`, `app/sign-in/page.tsx`
**Probleme** : `width: 100vw` inclut la scrollbar, causant un leger scroll horizontal.
**Fix** : Utiliser `w-full` ou `w-screen` avec `overflow-x-hidden`.

##### M7. Particules non optimisees sur toutes les pages
**Fichier** : `app/contact/page.tsx` (200 particules vs 50 sur auth)
**Fix** : Reduire systematiquement sur mobile.

##### M8. Page Matching — hauteur `100dvh`
**Fichier** : `app/couple/matching/page.tsx:1083`
**Probleme** : `h-[100dvh]` dans un layout avec header + bottom nav = double decompte.
**Fix** : Utiliser `h-[calc(100dvh-var(--header-height)-var(--bottom-nav-height))]` ou `flex-1`.

##### M9. Z-index excessif
**Fichier** : `app/globals.css:735`
**Probleme** : `z-index: 2147483647` (max int). Consolider la strategie z-index.
**Fix** : Utiliser une echelle raisonnable (10, 20, 30, 40, 50, 100).

---

#### BAS (polish)

##### L1. CSS `globals.css` utilise `max-width` dans certaines regles
**Fichier** : `app/globals.css:111, 827, 900` — 3 blocs desktop-first justifies.

##### L2. `MobileMenuClient` potentiellement legacy
**Fichier** : `app/prestataire/mobile-menu-client.tsx` — hamburger basique, remplace par `MobileBottomNav`.

##### L3. Agenda padding asymetrique
**Fichier** : `app/prestataire/agenda/page.tsx:506` — `px-0 sm:px-2 md:px-4` edge-to-edge sur mobile.

##### L4. Chat media grid par defaut 2 colonnes
**Fichier** : `components/messaging/ChatMessages.tsx:184` — `grid-cols-2 md:grid-cols-3`, pourrait etre `grid-cols-1 sm:grid-cols-2`.

---

### 1.4 Scorecard par Zone

| Zone | Score | Points forts | Points faibles |
|------|-------|-------------|----------------|
| **Architecture globale** | 9/10 | svh, safe-area, overflow | - |
| **Navigation mobile** | 9/10 | Bottom nav excellente | Touch targets borderline |
| **Dashboard couple** | 8/10 | Grids responsives | - |
| **Dashboard prestataire** | 8/10 | Grids responsives | - |
| **Landing / Hero** | 9/10 | Font scaling parfait | Particules non optimisees |
| **Auth (sign-in/up)** | 7/10 | Particules reduites | Touch targets, forgot pwd link |
| **Budget couple** | 5/10 | Layout OK | Boutons hover-only invisibles |
| **Timeline couple** | 5/10 | dvh correct | Grid 3 cols forcee |
| **Agenda prestataire** | 5/10 | Calendrier adaptatif | Grid 3 cols, padding px-0 |
| **Demandes prestataire** | 5/10 | Liste OK | Kanban inutilisable |
| **Devis & Factures** | 6/10 | Forms responsive | 4 tabs fixes |
| **Profil public** | 7/10 | Bon editeur | 12+ pills nav |
| **Messagerie** | 7/10 | Show/hide OK | Logique tablette fragile |
| **Recherche** | 6/10 | Cards responsives | Dropdowns imbriques |
| **Contacts CRM** | 6/10 | Drawer mobile present | Touch targets < 44px |
| **Programme public** | 10/10 | Parfait mobile-first | - |
| **Blog** | 9/10 | Progressive padding | - |
| **Footer** | 7/10 | Grid 2 cols mobile | Icons touch targets |

---

### 1.5 Composants Mobile Existants

| Composant | Fichier | Fonction |
|-----------|---------|----------|
| `MobileBottomNav` | `components/layout/MobileBottomNav.tsx` | Navigation bottom bar (couple + prestataire) |
| `MoreSheet` | `components/layout/MobileBottomNav.tsx` | Sheet "Plus" avec toutes les pages |
| `CoupleMobileNav` | `components/layout/MobileBottomNav.tsx` | Config nav couple (4 items + more) |
| `PrestataireMobileNav` | `components/layout/MobileBottomNav.tsx` | Config nav prestataire (4 items + more) |
| `MobileMenuClient` | `app/prestataire/mobile-menu-client.tsx` | Menu hamburger prestataire (legacy) |
| `MobileMenu` | `components/layout/MobileMenu.tsx` | Menu slide-in lateral |
| `useIsMobile` | `hooks/use-mobile.tsx` | Hook detection mobile (768px) |
| `TabletAwareSidebarProvider` | `components/layout/TabletAwareSidebarProvider.tsx` | Provider sidebar tablet/desktop |
| `.click-target-44` | `app/globals.css` | Classe utilitaire 44px (peu utilisee) |
| `.safe-area-top/bottom` | `app/globals.css:912-918` | Padding safe-area iOS |

---

## 2. PLAN D'ACTION NUPLY

### Phase 1 : Fixes Mobile Critiques (1-2 semaines)

| # | Tache | Severite | Effort | Fichiers |
|---|-------|----------|--------|----------|
| 1.1 | Migrer `useIsMobile` vers `matchMedia` | MOYEN | 15 min | `hooks/use-mobile.tsx` |
| 1.2 | Rendre boutons budget toujours visibles sur mobile | CRITIQUE | 15 min | `app/couple/budget/page.tsx:569-586` |
| 1.3 | Fixer grid 3 cols timeline couple | CRITIQUE | 15 min | `app/couple/timeline/page.tsx:361` |
| 1.4 | Fixer grid 3 cols agenda prestataire | CRITIQUE | 15 min | `app/prestataire/agenda/page.tsx:531` |
| 1.5 | Kanban → single column mobile + tabs | CRITIQUE | 2h | `app/prestataire/demandes-recues/page.tsx` |
| 1.6 | Audit touch targets — ajouter `min-h-[44px]` partout | HAUT | 2h | 11+ fichiers (voir H1) |
| 1.7 | Tabs devis-factures scrollables sur mobile | HAUT | 1h | `app/prestataire/devis-factures/page.tsx:539` |
| 1.8 | Filtres recherche → bottom sheet mobile | HAUT | 2h | `app/couple/recherche/page.tsx` |
| 1.9 | Verifier page Matching `h-[100dvh]` dans layout | MOYEN | 30 min | `app/couple/matching/page.tsx:1083` |
| 1.10 | Comparaison favoris → stack vertical mobile | MOYEN | 30 min | `app/couple/favoris/page.tsx:413` |

### Phase 2 : Features Couple a Completer (2-4 semaines)

| # | Tache | Priorite | Effort | Impact Business |
|---|-------|----------|--------|-----------------|
| 2.1 | **Avis prestataires visibles dans recherche/matching** | P0 | 2-3j | Confiance + conversion |
| 2.2 | **Plan de table** — page `/couple/plan-de-table` (ref sidebar) | P1 | 3-5j | Feature attendue |
| 2.3 | **Notifications email transactionnelles** (demande acceptee, message, rappel) | P1 | 2j | Retention |
| 2.4 | **Jour-J programme enrichi** — timeline drag & drop, QR code | P2 | 2-3j | Engagement |
| 2.5 | **Dashboard couple — widget meteo** mariage (date/ville) | P3 | 1j | Wow factor |

### Phase 3 : Features Prestataire a Completer (2-4 semaines)

| # | Tache | Priorite | Effort | Impact Business |
|---|-------|----------|--------|-----------------|
| 3.1 | **Sync disponibilites <-> agenda** | P1 | 2-3j | UX prestataire |
| 3.2 | **Google Calendar sync** — finaliser | P2 | 2j | Productivite |
| 3.3 | **Analytics — export PDF/CSV** | P2 | 1j | Valeur pro |
| 3.4 | **Devis — suivi negociation** avec historique | P2 | 2j | Conversion |
| 3.5 | **Messagerie — read receipts + typing** | P3 | 2j | UX temps reel |

### Phase 4 : Infrastructure & Qualite (4-6 semaines)

| # | Tache | Priorite | Effort | Impact |
|---|-------|----------|--------|--------|
| 4.1 | **Tests E2E** — Playwright flows critiques | P1 | 5j | Stabilite |
| 4.2 | **PWA** — manifest, service worker, offline | P2 | 3j | Engagement mobile |
| 4.3 | **i18n FR/EN** — next-intl | P2 | 5-8j | Marche international |
| 4.4 | **Lighthouse > 90** — images, bundle split | P2 | 3j | SEO + perf |
| 4.5 | **WCAG AA** — contraste, aria, focus, skip nav | P2 | 3-5j | Accessibilite |
| 4.6 | **Storybook** — documentation composants | P3 | 5j | DX |

### Phase 5 : Growth & Monetisation (6-8 semaines)

| # | Tache | Priorite | Effort | Impact Business |
|---|-------|----------|--------|-----------------|
| 5.1 | **Mini-site de mariage** — sous-domaine couple | P1 | 8-10j | Viralite + premium |
| 5.2 | **Programme ambassadeur** — dashboard referral | P2 | 3-5j | Acquisition organique |
| 5.3 | **Stripe Connect** — paiements couple->prestataire | P1 | 5j | Revenue |
| 5.4 | **Chatbot IA enrichi** — contexte profil couple | P2 | 3j | Engagement |
| 5.5 | **SEO dynamique** — /prestataires/[slug], sitemap | P1 | 3j | Acquisition SEO |

---

## 3. SPRINTS RECOMMANDES

### Sprint 1 (Semaine 1-2) — Fixes Mobile + Quick Wins
- [x] Phase 1 complete (1.1 → 1.10)
- [ ] Debut 2.1 (Avis dans recherche)
- [ ] 2.3 (Emails transactionnels)

### Sprint 2 (Semaine 3-4) — Couple UX
- [ ] Fin 2.1 (Avis dans matching)
- [ ] 2.2 (Plan de table)
- [ ] 3.1 (Sync dispo/agenda)
- [ ] Polish mobile restant

### Sprint 3 (Semaine 5-6) — Revenue
- [ ] 5.3 (Stripe Connect)
- [ ] 5.5 (SEO pages prestataires)
- [ ] 4.1 debut (Tests E2E)

### Sprint 4 (Semaine 7-8) — Scale
- [ ] 5.1 (Mini-site mariage)
- [ ] 4.2 (PWA)
- [ ] 4.4 (Lighthouse > 90)
- [ ] 4.1 fin (Tests E2E)

---

## 4. METRIQUES DE SUIVI

| Metrique | Objectif | Outil |
|----------|----------|-------|
| Lighthouse Mobile Score | > 90 | Lighthouse CI |
| Core Web Vitals (LCP) | < 2.5s | Vercel Analytics |
| Core Web Vitals (CLS) | < 0.1 | Vercel Analytics |
| Touch targets conformes | 100% | Audit manuel |
| Taux de conversion matching | > 15% | Analytics custom |
| Temps de reponse prestataire | < 24h median | DB analytics |
| NPS mobile | > 50 | Enquete in-app |
| Taux de rebond mobile | < 40% | Vercel Analytics |

---

*Genere le 2026-03-07 — Audit complet par 4 agents paralleles (layouts, couple, prestataire, public)*
