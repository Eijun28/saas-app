# NUPLY — Audit Mobile-First & Plan d'Action

> Date : 2026-03-07 | Version : 1.0

---

## 1. AUDIT MOBILE-FIRST — Synthese

### 1.1 Score Global Mobile : 8/10

NUPLY est **globalement bien concu pour le mobile**. L'architecture de base est solide avec des patterns mobile-first correctement appliques dans la majorite du codebase.

---

### 1.2 Points Forts (ce qui est bien fait)

#### Architecture & Layout
| Element | Implementation | Statut |
|---------|---------------|--------|
| Viewport meta | `width: device-width, initialScale: 1, maximumScale: 5` | OK |
| Conteneur principal | `h-svh overflow-hidden` (evite le bounce iOS) | OK |
| Bottom Nav Mobile | `MobileBottomNav` avec `safe-area-inset-bottom`, animation `slideInFromBottom` | Excellent |
| Sidebar responsive | Masquee mobile / icones tablette / complete desktop | OK |
| `TabletAwareSidebarProvider` | Detecte `>= 1024px` au montage, evite flash | OK |

#### CSS & Safe Areas
| Element | Implementation | Statut |
|---------|---------------|--------|
| iOS Safari zoom fix | `font-size: 16px !important` sur inputs en mobile | OK |
| `safe-area-inset-*` | Applique sur bottom nav, chatbot, messagerie, sidebar | OK |
| Unites viewport | `svh`, `dvh` utilises correctement (pas `vh` seul) | OK |
| Touch targets | `min-w-[44px]` dans globals.css, boutons dismiss `min-w-[44px] min-h-[44px]` | OK |
| Texture de fond | Desactivee sur mobile (`display: none` < 767px) — perf | OK |

#### Responsive Tailwind
| Element | Implementation | Statut |
|---------|---------------|--------|
| Grids dashboard | `grid-cols-2 md:grid-cols-4` (mobile-first) | OK |
| Spacing adaptatif | `gap-3 sm:gap-4`, `p-4 sm:p-5`, `space-y-5 sm:space-y-6` | OK |
| Texte adaptatif | `text-2xl sm:text-[32px]`, `text-sm sm:text-[15px]` | OK |
| Flex direction | `flex-col sm:flex-row` pattern consistent | OK |
| Padding conteneur | `px-4 sm:px-5 md:px-6 lg:px-8` progressif | OK |
| Bottom padding mobile | `pb-20 md:pb-6` pour la bottom nav | OK |
| Touch scroll | `touch-pan-y overscroll-y-contain` sur le main | OK |

#### Navigation Mobile
| Element | Implementation | Statut |
|---------|---------------|--------|
| Bottom Nav Couple | 4 items + "Plus" (sheet avec sections) | Excellent |
| Bottom Nav Prestataire | 4 items + "Plus" (Finances, Compte) | Excellent |
| More Sheet | Grid 3 cols, `92dvh` max, `overscroll-y-contain` | Excellent |
| Active state | Dot indicator + couleur + font-weight | OK |
| Badges | Notifications count sur les items | OK |
| Auto-close on nav | `useEffect` ferme le sheet au changement de pathname | OK |

#### Dialogues & Modales
| Element | Implementation | Statut |
|---------|---------------|--------|
| Max width | `max-w-[calc(100vw-2rem)] sm:max-w-[450px]` | OK |
| Overflow | `max-h-[85vh] overflow-y-auto` | OK |
| Favoris compare | `max-h-[90dvh] overflow-auto` | OK |

---

### 1.3 Points d'Attention (ameliorations necessaires)

#### P1 — Critiques (impact UX direct)

##### 1. `useIsMobile` utilise `resize` au lieu de `matchMedia`
**Fichier** : `hooks/use-mobile.tsx`
**Probleme** : Utilise `window.addEventListener("resize")` qui se declenche a chaque pixel de resize. `matchMedia` est plus performant et ne notifie qu'aux points de rupture.
**Impact** : Re-renders inutiles sur iOS lors du scroll (la barre d'URL modifie la hauteur visible).
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

##### 2. `useIsMobile` utilise seulement dans 5 fichiers
**Fichier** : `hooks/use-mobile.tsx`
**Probleme** : Le hook n'est utilise que dans `sidebar.tsx`, `sonner.tsx`, `Chatbot.tsx`, `ChatbotAdvisor.tsx`, `messagerie/page.tsx`, `recherche/page.tsx` et `dropdown-profile.tsx`. Beaucoup de composants utilisent des classes Tailwind responsive a la place, ce qui est **correct et preferable**. Le hook n'est necessaire que quand le rendu conditionnel JS est requis.
**Verdict** : OK — usage minimal est une bonne pratique.

##### 3. CSS `globals.css` utilise `max-width` (desktop-first) dans certaines regles
**Fichier** : `app/globals.css:111, 827, 900`
**Probleme** : 3 blocs `@media (max-width: 767px)` = desktop-first. Pas critique car ce sont des overrides specifiques (texture de fond, chatbot fullscreen, input zoom fix), mais a noter pour coherence.
**Impact** : Faible — ces cas sont justifies.

##### 4. Messagerie — layout conversation sur mobile
**Fichier** : `app/couple/messagerie/page.tsx:355`
**Probleme** : La largeur de la sidebar conversations utilise des valeurs fixes (`w-[260px] lg:w-[300px] xl:w-[340px]`) en mode desktop. Sur mobile, le `isMobile` switch vers `w-full` correctement.
**Verdict** : OK — le pattern show/hide est correct.

##### 5. Page Matching — hauteur `100dvh`
**Fichier** : `app/couple/matching/page.tsx:1083`
**Probleme** : `h-[100dvh] sm:h-screen` peut poser probleme si la page est dans le layout avec header + bottom nav (double decompte de hauteur).
**Impact** : Moyen — a verifier visuellement sur differents appareils iOS.

#### P2 — Ameliorations (nice-to-have)

##### 6. Favoris — comparaison responsive
**Fichier** : `app/couple/favoris/page.tsx:413`
**Probleme** : `min-w-[320px]` sur la grille de comparaison peut forcer un scroll horizontal. La comparaison de 3 prestataires en `grid-cols-3` sur un ecran de 375px sera illisible.
**Fix** : Sur mobile, empiler verticalement ou limiter a 2 prestataires.

##### 7. Agenda calendrier — hauteur fixe
**Fichier** : `app/prestataire/agenda/page.tsx:585`
**Probleme** : `h-[calc(100svh-280px)] sm:h-[700px] lg:h-[780px]` — la hauteur mobile depend de la hauteur de l'ecran moins 280px. Sur un iPhone SE (667px), cela donne 387px, ce qui est limite pour un calendrier.
**Impact** : Faible — fonctionnel mais pas ideal.

##### 8. Contacts CRM — panneau detail
**Fichier** : `app/prestataire/contacts/page.tsx:387`
**Probleme** : `hidden lg:block w-[380px]` — le panneau detail est completement cache en dessous de `lg`. Il faudrait un drawer mobile pour afficher les details.
**Verdict** : Probablement gere par un drawer mobile (a verifier).

##### 9. AnimatedHeader — Menu mobile Sheet
**Fichier** : `components/layout/AnimatedHeader.tsx`
**Probleme** : Utilise le composant `Sheet` de shadcn pour le menu hamburger. OK mais verifier que le `SheetContent` ne deborde pas sur petits ecrans.
**Verdict** : OK — Sheet gere bien le mobile.

##### 10. Landing page — images hero
**Probleme** : Verifier que les images hero utilisent `sizes` et `srcSet` pour eviter le chargement d'images desktop sur mobile.
**Impact** : Performance — LCP.

---

### 1.4 Composants Mobile Existants

| Composant | Fichier | Fonction |
|-----------|---------|----------|
| `MobileBottomNav` | `components/layout/MobileBottomNav.tsx` | Navigation bottom bar (couple + prestataire) |
| `MoreSheet` | `components/layout/MobileBottomNav.tsx` | Sheet "Plus" avec toutes les pages |
| `CoupleMobileNav` | `components/layout/MobileBottomNav.tsx` | Config nav couple (4 items + more) |
| `PrestataireMobileNav` | `components/layout/MobileBottomNav.tsx` | Config nav prestataire (4 items + more) |
| `MobileMenuClient` | `app/prestataire/mobile-menu-client.tsx` | Menu hamburger prestataire (legacy?) |
| `MobileMenu` | `components/layout/MobileMenu.tsx` | Menu slide-in lateral |
| `useIsMobile` | `hooks/use-mobile.tsx` | Hook detection mobile (768px) |
| `TabletAwareSidebarProvider` | `components/layout/TabletAwareSidebarProvider.tsx` | Provider sidebar tablet/desktop |

---

## 2. PLAN D'ACTION NUPLY

### Phase 1 : Quick Wins Mobile (1-2 semaines)

| # | Tache | Priorite | Effort | Impact |
|---|-------|----------|--------|--------|
| 1.1 | Migrer `useIsMobile` vers `matchMedia` | P1 | 15 min | Perf iOS |
| 1.2 | Verifier/fixer la page Matching sur iPhone (h-[100dvh] dans layout avec header) | P1 | 1h | UX mobile |
| 1.3 | Rendre la comparaison Favoris responsive (stack vertical sur mobile) | P2 | 30 min | UX mobile |
| 1.4 | Ajouter un drawer mobile pour le detail contact CRM prestataire | P2 | 1h | UX mobile |
| 1.5 | Verifier les `sizes` sur les images hero (landing page) | P2 | 30 min | Perf LCP |
| 1.6 | Nettoyer le `MobileMenuClient` legacy si non utilise | P3 | 15 min | Code propre |

### Phase 2 : Features Couple a Completer (2-4 semaines)

| # | Tache | Priorite | Effort | Impact Business |
|---|-------|----------|--------|-----------------|
| 2.1 | **Avis prestataires visibles dans la recherche/matching** — afficher les reviews (rating + commentaires) dans les resultats de recherche et les cards matching | P0 | 2-3j | Confiance + conversion |
| 2.2 | **Plan de table** — page `/couple/plan-de-table` (reference dans sidebar mais page manquante) | P1 | 3-5j | Feature attendue |
| 2.3 | **Jour-J programme enrichi** — timeline drag & drop, partage avec QR code | P2 | 2-3j | Engagement |
| 2.4 | **Notifications email transactionnelles** — emails pour : demande acceptee, nouveau message, rappel paiement | P1 | 2j | Retention |
| 2.5 | **Dashboard couple — widget meteo** mariage (date/ville) | P3 | 1j | Wow factor |

### Phase 3 : Features Prestataire a Completer (2-4 semaines)

| # | Tache | Priorite | Effort | Impact Business |
|---|-------|----------|--------|-----------------|
| 3.1 | **Sync disponibilites <-> agenda** — unifier les deux systemes | P1 | 2-3j | UX prestataire |
| 3.2 | **Google Calendar sync** — finaliser l'integration (composant present, fonctionnel?) | P2 | 2j | Productivite |
| 3.3 | **Analytics — export PDF/CSV** | P2 | 1j | Valeur pro |
| 3.4 | **Devis — suivi negociation** — statut "negociation" avec historique des modifications | P2 | 2j | Conversion |
| 3.5 | **Messagerie — read receipts + typing indicator** | P3 | 2j | UX temps reel |

### Phase 4 : Infrastructure & Qualite (4-6 semaines)

| # | Tache | Priorite | Effort | Impact |
|---|-------|----------|--------|--------|
| 4.1 | **Tests E2E** — Playwright sur les flows critiques (inscription, matching, demande, paiement) | P1 | 5j | Stabilite |
| 4.2 | **PWA** — manifest.json, service worker, icones, offline mode basique | P2 | 3j | Engagement mobile |
| 4.3 | **i18n FR/EN** — next-intl ou next-i18next | P2 | 5-8j | Marche international |
| 4.4 | **Lighthouse > 90** — audit images (WebP/AVIF, lazy loading, sizes), bundle split | P2 | 3j | SEO + perf |
| 4.5 | **WCAG AA** — contraste, aria-labels, focus management, skip nav | P2 | 3-5j | Accessibilite |
| 4.6 | **Storybook** — documenter les composants UI | P3 | 5j | DX |

### Phase 5 : Growth & Monetisation (6-8 semaines)

| # | Tache | Priorite | Effort | Impact Business |
|---|-------|----------|--------|-----------------|
| 5.1 | **Mini-site de mariage personnalise** — sous-domaine par couple (prenom-prenom.nuply.fr) | P1 | 8-10j | Viralite + premium |
| 5.2 | **Programme ambassadeur** — dashboard referral avance avec stats + paiements | P2 | 3-5j | Acquisition organique |
| 5.3 | **Stripe Connect — paiements prestataires** — finaliser les paiements couple->prestataire via la plateforme | P1 | 5j | Revenue |
| 5.4 | **Chatbot IA enrichi** — assistant mariage avec contexte du profil couple (budget, date, preferences) | P2 | 3j | Engagement |
| 5.5 | **SEO dynamique** — pages prestataires indexables (/prestataires/[slug]), sitemap, structured data | P1 | 3j | Acquisition SEO |

---

## 3. MATRICE DE PRIORITE

```
IMPACT
  ^
  |  5.3 ★  2.1 ★★★   5.5 ★★
  |  5.1 ★★  4.1 ★★   2.4 ★★
  |  3.1 ★   2.2 ★    4.4 ★
  |  1.2      1.1      3.3
  |  1.3      4.5      4.6
  +---------------------------------> EFFORT
     Rapide              Long
```

**Legende** : ★ = impact business eleve

---

## 4. ORDRE DE PRIORITE RECOMMANDE

### Sprint 1 (Semaine 1-2) — Quick Wins
1. Fix `useIsMobile` -> `matchMedia` (1.1)
2. Verifier page Matching mobile (1.2)
3. Notifications email transactionnelles (2.4)
4. Avis visibles dans recherche/matching (2.1 — debut)

### Sprint 2 (Semaine 3-4) — Couple UX
5. Avis visibles dans recherche/matching (2.1 — fin)
6. Plan de table (2.2)
7. Sync dispo/agenda prestataire (3.1)
8. Comparaison favoris responsive (1.3)

### Sprint 3 (Semaine 5-6) — Revenue
9. Stripe Connect finalization (5.3)
10. SEO pages prestataires (5.5)
11. Tests E2E flows critiques (4.1 — debut)

### Sprint 4 (Semaine 7-8) — Scale
12. Mini-site de mariage (5.1)
13. PWA (4.2)
14. Tests E2E (4.1 — fin)
15. Lighthouse optimization (4.4)

---

## 5. METRIQUES DE SUIVI

| Metrique | Objectif | Outil |
|----------|----------|-------|
| Lighthouse Mobile Score | > 90 | Lighthouse CI |
| Core Web Vitals (LCP) | < 2.5s | Vercel Analytics |
| Core Web Vitals (CLS) | < 0.1 | Vercel Analytics |
| Taux de conversion matching | > 15% | Analytics custom |
| Temps de reponse prestataire | < 24h median | DB analytics |
| NPS mobile | > 50 | Enquete in-app |
| Taux de rebond mobile | < 40% | Vercel Analytics |

---

*Genere le 2026-03-07 — Audit realise par analyse statique du codebase*
