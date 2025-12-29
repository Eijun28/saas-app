# PROMPT CURSOR - CORRECTIONS SÉCURITÉ + CODE MORT

## CONTEXTE
Audit complet du code révèle des problèmes de sécurité (console.log) et du code mort à nettoyer avant déploiement.

**Priorité : 🔴 CRITIQUE - À faire AVANT le déploiement**

---

## 🔴 PARTIE 1 : SUPPRIMER CONSOLE.LOG EN PRODUCTION

### Problème
30+ fichiers exposent des données sensibles via console.log/error/warn en production.

**Risques :**
- IDs utilisateurs exposés
- Tokens/URLs de fichiers visibles
- Stack traces détaillées
- Informations de débogage

### Solution : Utiliser logger.ts

Le fichier `/lib/logger.ts` existe déjà et gère correctement les logs (dev vs prod).

### Actions

#### 1.1 Routes API Marriage Admin

```typescript
// app/api/marriage-admin/create/route.ts
// REMPLACER toutes les instances :

// AVANT ❌
console.log('Marriage admin created:', data)
console.error('Error creating marriage admin:', error)

// APRÈS ✅
import { logger } from '@/lib/logger'

logger.info('Marriage admin created', { marriageAdminId: data.id })
logger.error('Error creating marriage admin', error)
```

**Fichiers à corriger :**
- `/app/api/marriage-admin/create/route.ts` (lignes 37, 74, 94, 102)
- `/app/api/marriage-admin/upload-document/route.ts` (lignes 28, 64, 68, 75, 95, 108)
- `/app/api/marriage-admin/generate-document/route.ts` (lignes 37, 56, 174, 182)
- `/app/api/marriage-admin/generate-pdf/route.ts` (lignes 27, 54, 62, 72)

#### 1.2 Routes API Collaborateurs

```typescript
// app/api/collaborateurs/invitation/[token]/accept/route.ts
// LIGNES 86, 98

// AVANT ❌
console.error('Invitation not found:', token)
console.error('Error accepting invitation:', error)

// APRÈS ✅
import { logger } from '@/lib/logger'

logger.error('Invitation not found', { token: token.substring(0, 8) + '...' }) // Masquer token complet
logger.error('Error accepting invitation', error, { token: token.substring(0, 8) + '...' })
```

**Fichiers à corriger :**
- `/app/api/collaborateurs/invitation/[token]/accept/route.ts` (lignes 86, 98)
- `/app/api/collaborateurs/invitation/[token]/route.ts` (ligne 53)
- `/app/api/collaborateurs/invite/route.ts` (lignes 70, 93)

#### 1.3 Hooks

```typescript
// hooks/use-user.ts
// LIGNE 18

// AVANT ❌
console.error('Error loading user:', error)

// APRÈS ✅
import { logger } from '@/lib/logger'

logger.error('Error loading user', error)
```

#### 1.4 Composants Client

```typescript
// app/prestataire/profil-public/page.tsx
// LIGNE 137

// AVANT ❌
console.error('Error loading profile:', error)

// APRÈS ✅
import { logger } from '@/lib/logger'

logger.error('Error loading profile', error)
```

#### 1.5 Script de recherche globale

Pour trouver TOUS les console.log/error/warn restants :

```bash
# Dans le terminal Cursor
grep -rn "console\\.log\\|console\\.error\\|console\\.warn" app/ components/ hooks/ lib/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | grep -v ".next"
```

Remplacer chaque occurrence par `logger.info()`, `logger.error()`, ou `logger.warn()`.

---

## 🗑️ PARTIE 2 : SUPPRIMER CODE MORT

### 2.1 Fichiers Dashboard Obsolètes

**Diagnostic :**
- `components/dashboard/sidebar.tsx` (3.5 KB) - NON UTILISÉ
- `components/dashboard/header.tsx` (2.3 KB) - NON UTILISÉ

Ces fichiers sont remplacés par :
- `components/DashboardSidebar.tsx` ✅ (utilisé)
- `components/DashboardHeader.tsx` ✅ (utilisé)

**Actions :**

```bash
# Supprimer les fichiers obsolètes
rm components/dashboard/sidebar.tsx
rm components/dashboard/header.tsx
```

### 2.2 Calendriers Dupliqués (DÉJÀ TRAITÉ)

Le prompt `CURSOR_PROMPT_FIX_CALENDRIERS.md` couvre ce point.

**Résumé rapide :**
- Garder : `components/ui/calendar.tsx` (shadcn/ui avec dropdown)
- Supprimer après validation :
  - `components/calendar.tsx` (custom Framer Motion)
  - `components/ui/calendar18.tsx` (obsolète)

---

## 🔧 PARTIE 3 : VÉRIFIER LES IMPORTS

Après suppression, s'assurer qu'aucun fichier n'importe les composants supprimés.

```bash
# Vérifier si sidebar.tsx ou header.tsx sont importés quelque part
grep -rn "dashboard/sidebar" app/ components/ --include="*.ts" --include="*.tsx"
grep -rn "dashboard/header" app/ components/ --include="*.ts" --include="*.tsx"
```

Si des imports sont trouvés, les corriger vers :
```typescript
// AVANT
import { Sidebar } from '@/components/dashboard/sidebar'

// APRÈS
import { DashboardSidebar } from '@/components/DashboardSidebar'
```

---

## ✅ CHECKLIST DE VALIDATION

### Console.log
- [ ] `/app/api/marriage-admin/create/route.ts` : tous les console.log remplacés
- [ ] `/app/api/marriage-admin/upload-document/route.ts` : tous les console.log remplacés
- [ ] `/app/api/marriage-admin/generate-document/route.ts` : tous les console.log remplacés
- [ ] `/app/api/marriage-admin/generate-pdf/route.ts` : tous les console.log remplacés
- [ ] `/app/api/collaborateurs/**/*.ts` : tous les console.log remplacés
- [ ] `/hooks/use-user.ts` : console.error remplacé
- [ ] `/app/prestataire/profil-public/page.tsx` : console.error remplacé
- [ ] Recherche globale : `grep -rn "console\\.log"` retourne 0 résultat en dehors de node_modules

### Code Mort
- [ ] `components/dashboard/sidebar.tsx` supprimé
- [ ] `components/dashboard/header.tsx` supprimé
- [ ] Aucun import cassé (vérification grep)
- [ ] Build réussi : `npm run build`

### Production Ready
- [ ] `npm run build` sans warnings console.log
- [ ] DevTools > Console en production : aucun log utilisateur
- [ ] Lighthouse audit : Best Practices > 95

---

## 🚀 ORDRE D'EXÉCUTION

1. **Créer une branche Git** :
   ```bash
   git checkout -b fix/security-cleanup
   ```

2. **Supprimer code mort d'abord** (moins risqué) :
   ```bash
   rm components/dashboard/sidebar.tsx
   rm components/dashboard/header.tsx
   git add -A
   git commit -m "chore: remove dead code (dashboard sidebar/header)"
   ```

3. **Remplacer console.log par logger** :
   - Commencer par les routes API (plus critique)
   - Puis hooks
   - Puis composants
   - Vérifier avec grep

4. **Test complet** :
   ```bash
   npm run build
   npm run start
   # Naviguer dans toute l'app
   # Vérifier DevTools > Console : aucun log
   ```

5. **Commit & Push** :
   ```bash
   git add -A
   git commit -m "fix(security): replace all console.log with logger.ts"
   git push origin fix/security-cleanup
   ```

6. **Merger dans main** après validation

---

## 🔍 VÉRIFICATION FINALE

### Test en local (mode production)

```bash
# Build production
npm run build

# Run en production
npm run start

# Ouvrir http://localhost:3000
# DevTools > Console
# Naviguer dans l'app :
# - Landing page
# - Page tarifs
# - Dashboard prestataire (connecté)
# - Profil public prestataire
# - Créer un événement (agenda)
# - Envoyer une invitation collaborateur

# ✅ Vérifier : AUCUN console.log affiché
# ✅ Vérifier : Build sans warnings
```

---

## 📝 NOTES IMPORTANTES

1. **Logger.ts est déjà configuré** :
   - Dev : affiche tout dans console avec emojis
   - Prod : ne log que les erreurs (JSON structuré)

2. **Ne PAS supprimer logger.ts lui-même** :
   - C'est le système de logging officiel
   - Il gère automatiquement dev vs prod

3. **Tokens sensibles** :
   - Toujours masquer partiellement : `token.substring(0, 8) + '...'`
   - Ne jamais logger de tokens complets, mots de passe, secrets

4. **Erreurs Supabase** :
   - OK de logger l'objet error complet (logger.error gère)
   - Pas OK de logger les données utilisateur avec

---

**FIN DU PROMPT CORRECTIONS SÉCURITÉ**
