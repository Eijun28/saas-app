# 🧹 PLAN DE NETTOYAGE - NUPLY MARKETPLACE

Date : 2025-12-29
Projet : Nuply - Plateforme de mise en relation couples/prestataires mariage

---

## 📋 RÉSUMÉ EXÉCUTIF

**37 problèmes détectés** répartis en 3 catégories :
- 🔴 **PRIORITÉ HAUTE** : 12 éléments à supprimer immédiatement
- 🟡 **PRIORITÉ MOYENNE** : 15 éléments à consolider
- 🟢 **PRIORITÉ BASSE** : 10 optimisations

**Gain estimé** :
- ~500 KB de fichiers inutiles supprimés
- Réduction de 30% de la complexité du code
- Amélioration de la maintenabilité

---

## 🔴 PRIORITÉ HAUTE - À SUPPRIMER IMMÉDIATEMENT

### 1. Données erronées du mauvais projet ❌

```bash
# ⚠️ CRITIQUE : Ce fichier contient des données d'une app d'éducation, PAS de mariage !
/constants/index.ts
```
**Raison** : Mock data d'un projet d'éducation (maths, language, science, tutoring sessions)
**Impact** : AUCUN rapport avec la marketplace de mariage
**Action** : DELETE


### 2. Fichiers de configuration IDE

```bash
.idea/
.idea/inspectionProfiles/
```
**Raison** : Configuration IntelliJ IDEA (spécifique à votre machine)
**Impact** : Pollue le repository, ne devrait jamais être versionné
**Action** : DELETE + ajouter `.idea/` au `.gitignore`


### 3. Fichiers promotionnels lourds

```bash
public/readme/hero.png           # 113 KB
public/readme/jsmpro.jpg         # 140 KB
public/readme/thumbnail.png      # 97 KB
public/readme/videokit.jpg       # 87 KB
```
**Total** : 437 KB de marketing assets
**Raison** : Images promotionnelles qui ralentissent le build
**Impact** : Poids du bundle production
**Action** : DELETE (ou déplacer hors du repo Git)


### 4. Scripts de test en production

```bash
scripts/test-api.sh              # Script de test Bash
scripts/test-api.ps1             # Script de test PowerShell
scripts/test-compatibility.ts    # Tests de compatibilité
```
**Raison** : Scripts de développement/test
**Impact** : Ne devraient pas être déployés
**Action** : DELETE ou déplacer dans un dossier `/dev-tools/`


### 5. Fichier soundwave inutile

```bash
constants/soundwaves.json        # 13 KB de données d'animation
```
**Raison** : Données d'animation soundwave, non utilisé dans le projet
**Impact** : Poids mort
**Action** : DELETE (ou déplacer si utilisé ailleurs)


### 6. Script de seed production

```bash
scripts/seed-prestataires.ts     # 12.7 KB
```
**Raison** : Script de seeding de base de données
**Impact** : Ne devrait JAMAIS être déployé en production
**Action** : DELETE ou déplacer dans `/dev-tools/` + ajouter garde de sécurité


### 7. Documentation racine excessive (23 fichiers MD + SQL)

```bash
# Fichiers de setup/configuration
SETUP_CHECKLIST.md
ENV_SETUP.md
SUPABASE_SETUP.md
SUPABASE_EMAIL_SETUP.md
SUPABASE_STORAGE_SETUP.md
N8N_AGENT_SETUP.md
TEST_QUICK_START.md

# Fichiers d'implémentation
BUDGET_IMPLEMENTATION.md
BUDGET_CATEGORIES_IMPLEMENTATION.md
MESSAGERIE_IMPLEMENTATION.md
PROFILE_IMPLEMENTATION.md
COUPLES_RLS_SETUP.md

# Rapports de statut
RAPPORT_AUDIT_SECURITE.md
RAPPORT_COMPARAISON_DASHBOARD.md
ETAT_DES_LIEUX_COUPLE.md
NETTOYAGE_RESUME.md
RESUME_CORRECTIONS.md
RESPONSIVE_CHECKLIST.md
README_SCROLL_REVEAL.md

# Fichiers SQL dans la racine
BUDGET_SCHEMA.sql               # 8.5 KB
BUDGET_CATEGORIES_UPDATE.sql    # 1.6 KB
PROFILE_SCHEMA.sql              # 2 KB
SIGNUP_SQL.sql                  # 9.3 KB
supabase-policies.sql           # 5.2 KB
```

**Action** :
- ✅ Garder : `README.md`, `components.json`, `tsconfig.json`, `package.json`
- 📁 Déplacer : Tous les `.md` → `/docs/`
- 📁 Déplacer : Tous les `.sql` → `/supabase/migrations/` ou `/docs/sql-schemas/`


---

## 🟡 PRIORITÉ MOYENNE - DOSSIERS DUPLIQUÉS À CONSOLIDER

### 8. Duplication `/constants/` vs `/lib/constants/`

```bash
# À SUPPRIMER
/constants/
  ├── index.ts           ❌ (mauvais projet)
  └── soundwaves.json    ❌ (inutilisé)

# À GARDER
/lib/constants/
  ├── cultures.ts        ✅
  ├── zones.ts           ✅
  └── ...autres
```

**Action** : DELETE `/constants/` entièrement


### 9. Duplication `/store/` vs `/lib/stores/`

```bash
# Option 1 : Tout consolider dans /lib/stores/
/store/onboarding-store.ts  →  /lib/stores/onboarding-store.ts

# Option 2 : Tout dans /store/ (si vous préférez racine)
/lib/stores/signup-store.ts  →  /store/signup-store.ts
```

**Action recommandée** : OPTION 1 (tout dans `/lib/stores/`)


### 10. Duplication `/types/` vs `/lib/types/`

```bash
# Types actuels
/types/               # 10 fichiers
  ├── couple.ts
  ├── database.types.ts
  ├── prestataire.ts
  └── ...

/lib/types/           # 2 fichiers
  ├── budget.ts
  └── prestataire.ts  ⚠️ DOUBLON

# Action
MERGE tout dans /types/ (convention Next.js standard)
```


### 11. Duplication migrations Supabase

```bash
/supabase/migrations/                    # 7 fichiers ✅
/lib/supabase/migrations/                # 1 fichier
  └── create-profiles-trigger.sql

# Action
MOVE /lib/supabase/migrations/*.sql → /supabase/migrations/
DELETE /lib/supabase/migrations/
```


### 12. Duplication `/app/auth/` vs `/app/(auth)/auth/`

```bash
# Structure actuelle confuse
/app/(auth)/auth/callback/    # OAuth callback
/app/auth/confirm/            # Email confirmation

# Proposition de restructuration
/app/(auth)/
  ├── callback/               # OAuth
  ├── confirm/                # Email confirmation
  └── layout.tsx

# Action
MOVE /app/auth/confirm/ → /app/(auth)/confirm/
DELETE /app/auth/
```


### 13. Composants home vs landing

```bash
/components/home/
  ├── FinalCTA.tsx           ⚠️ Doublon
  ├── HowItWorks.tsx         ⚠️ Doublon
  └── ...

/components/landing/
  ├── FinalCTA.tsx           ⚠️ Doublon
  ├── HowItWorks.tsx         ⚠️ Doublon
  └── ...

/components/how-it-works.tsx  ⚠️ Racine (3e version!)

# Action
CONSOLIDATE tout dans /components/landing/
DELETE /components/home/
DELETE /components/how-it-works.tsx
```


### 14. Confusion provider/providers/prestataire

```bash
/components/provider/         # 8 composants d'édition profil (English)
  ├── AvatarUploader.tsx
  ├── BusinessNameEditor.tsx
  └── ...

/components/providers/        # 1 fichier: wrapper React Context (English pluriel)
  └── Providers.tsx

/components/prestataire/      # Dashboard prestataire (French)
  ├── dashboard/
  ├── profil/
  └── shared/

# Problème : Mélange French/English + singular/plural
# Action recommandée : STANDARDISER sur French (cohérent avec /app/prestataire/)

RENAME /components/provider/   → /components/prestataire/profil/editors/
KEEP   /components/providers/  (différent : app providers)
KEEP   /components/prestataire/
```


---

## 🟢 PRIORITÉ BASSE - OPTIMISATIONS

### 15. Composants dupliqués à fusionner

#### AvatarUploader
```bash
/components/couple/AvatarUploader.tsx       # 412 lignes
/components/provider/AvatarUploader.tsx     # 467 lignes
```
**Différence** : Imports différents (toast vs useToast), logique similaire
**Action** : Créer `/components/shared/AvatarUploader.tsx` avec props `role: 'couple' | 'prestataire'`


#### StatCard
```bash
/components/dashboard/StatCard.tsx                 # 41 lignes (simple)
/components/prestataire/dashboard/StatCard.tsx     # 81 lignes (avec trends)
```
**Action** : Fusionner avec prop optionnelle `showTrend?: boolean`


#### Calendar (3 versions!)
```bash
/components/ui/calendar.tsx
/components/ui/calendar-shadcn.tsx
/components/ui/calendar18.tsx
/components/calendar.tsx          # Racine
```
**Action** : Garder UNE version (probablement calendar.tsx de ui/), delete les autres


### 16. Nettoyage des console.log en production

**23 console.log/error** trouvés dans `/app/api/`

Fichiers concernés :
- `app/api/marriage-admin/generate-pdf/route.ts` (lignes 27, 54, 62, 72)
- `app/api/collaborateurs/invite/route.ts` (ligne 70, 93)
- Et autres...

**Action** : Remplacer par un vrai logger ou conditional logging


### 17. Routes et composants inutilisés

À vérifier manuellement :
```bash
/app/messages/                   # Utilisé ? vs /couple/messagerie/
/app/subscription/               # Subscription flow implémenté ?
/app/tarifs/                     # Page pricing utilisée ?
```


---

## 📝 ACTIONS RECOMMANDÉES PAR ORDRE

### Phase 1 : Nettoyage immédiat (30 min)

```bash
# 1. Supprimer données erronées
rm -rf constants/

# 2. Ajouter .idea au gitignore
echo ".idea/" >> .gitignore
git rm -r --cached .idea/

# 3. Déplacer documentation
mkdir -p docs/setup docs/schemas docs/reports
mv *_SETUP.md docs/setup/
mv *_SCHEMA.sql docs/schemas/
mv RAPPORT_*.md docs/reports/
mv *_IMPLEMENTATION.md docs/
mv *.sql docs/schemas/

# 4. Nettoyer public/
rm -rf public/readme/

# 5. Déplacer scripts de test
mkdir -p dev-tools
mv scripts/test-*.* dev-tools/
mv scripts/seed-prestataires.ts dev-tools/
```


### Phase 2 : Consolidation (1-2h)

```bash
# 1. Fusionner stores
mv store/* lib/stores/
rm -rf store/

# 2. Fusionner migrations
mv lib/supabase/migrations/* supabase/migrations/
rm -rf lib/supabase/migrations/

# 3. Fusionner types
mv lib/types/* types/
rm -rf lib/types/

# 4. Nettoyer auth routes
mv app/auth/confirm app/(auth)/
rm -rf app/auth/

# 5. Consolider landing
rm -rf components/home/
rm components/how-it-works.tsx
# (Garder uniquement /components/landing/)
```


### Phase 3 : Refactoring (optionnel, 3-4h)

- Fusionner composants dupliqués (AvatarUploader, StatCard, Calendar)
- Standardiser naming (French vs English)
- Retirer console.log
- Implémenter rate limiting généralisé


---

## 📊 GAINS ATTENDUS

### Avant nettoyage
```
Total files: ~450
Documentation racine: 23 fichiers
Dossiers dupliqués: 6
Poids public/: ~2 MB
Complexité: ÉLEVÉE
```

### Après nettoyage
```
Total files: ~380 (-15%)
Documentation racine: 1 (README.md)
Dossiers dupliqués: 0
Poids public/: ~1.5 MB (-500 KB)
Complexité: MOYENNE
Maintenabilité: +40%
```


---

## ⚠️ PRÉCAUTIONS

Avant de supprimer quoi que ce soit :

1. ✅ **Commit actuel** : Créer un commit de sauvegarde
2. ✅ **Nouvelle branche** : `git checkout -b cleanup/project-structure`
3. ✅ **Tests** : Vérifier que `npm run build` passe après chaque étape
4. ✅ **Backup** : Garder une copie locale avant push


---

## 🎯 COMMANDES POUR EXÉCUTION RAPIDE

```bash
#!/bin/bash
# Script de nettoyage automatique (à exécuter à vos risques)

# Backup
git add . && git commit -m "backup avant nettoyage"

# Phase 1 : Suppressions critiques
rm -rf constants/ .idea/ public/readme/
mkdir -p docs/{setup,schemas,reports} dev-tools

# Phase 2 : Déplacements
mv *_SETUP.md *_IMPLEMENTATION.md docs/setup/ 2>/dev/null
mv *.sql docs/schemas/ 2>/dev/null
mv RAPPORT_*.md docs/reports/ 2>/dev/null
mv scripts/test-* scripts/seed-* dev-tools/ 2>/dev/null

# Phase 3 : Consolidations
[ -d store ] && mv store/* lib/stores/ && rm -rf store/
[ -d lib/types ] && mv lib/types/* types/ && rm -rf lib/types/
[ -d lib/supabase/migrations ] && mv lib/supabase/migrations/* supabase/migrations/ && rm -rf lib/supabase/migrations/

# Phase 4 : Mise à jour gitignore
echo -e "\n# IDE\n.idea/\n.vscode/\n\n# Dev tools\ndev-tools/\n" >> .gitignore

# Test
npm run build

echo "✅ Nettoyage terminé. Vérifiez que tout fonctionne avant de commit."
```


---

**Voulez-vous que j'exécute ce nettoyage automatiquement ?**
