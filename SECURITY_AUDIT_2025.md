# 🔒 AUDIT DE SÉCURITÉ - NUPLY MARKETPLACE

**Date** : 29 Décembre 2025
**Projet** : Nuply - Plateforme marketplace mariage
**Auditeur** : Senior NextJS Developer
**Scope** : Full-stack (Frontend React, Backend API Routes, Database Supabase)

---

## 📊 SCORE GLOBAL : 7.2/10

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Authentication & Authorization | 8.5/10 | ✅ BON |
| Input Validation | 8.0/10 | ✅ BON |
| XSS Prevention | 7.5/10 | ✅ BON |
| Rate Limiting | 5.0/10 | ⚠️ MOYEN |
| Error Handling | 6.0/10 | ⚠️ MOYEN |
| Secrets Management | 9.0/10 | ✅ EXCELLENT |
| CORS Configuration | 3.0/10 | 🔴 FAIBLE |
| Logging & Monitoring | 5.0/10 | ⚠️ MOYEN |

---

## ✅ POINTS FORTS

### 1. Authentication & Authorization (8.5/10)

**✅ Middleware robuste** (`middleware.ts:5-108`)
```typescript
// Protection des routes couple/prestataire
- Vérification de l'utilisateur connecté
- Séparation stricte couple vs prestataire
- Requêtes DB pour valider le rôle
- Redirections appropriées
```

**Bonnes pratiques** :
- Utilisation de Supabase Auth (OAuth + Email)
- Session management via cookies sécurisés
- Vérification du rôle à chaque requête protégée
- Pas de JWT custom (délègue à Supabase)

**Points d'amélioration** :
- ❌ Pas de refresh token automatique visible
- ❌ Manque de 2FA (authentification à deux facteurs)


### 2. Secrets Management (9.0/10)

**✅ Excellente gestion des variables d'environnement**

Fichier `.gitignore` (ligne 34) :
```bash
.env*  # Tous les fichiers .env ignorés
```

**✅ Validation des variables** (`lib/security.ts:48-54`)
```typescript
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }
  return value;
}
```

**✅ Séparation client/serveur**
- `NEXT_PUBLIC_*` pour le client
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur
- Admin client isolé (`lib/supabase/admin.ts`)

**Aucune fuite détectée** :
- ✅ Pas de credentials hardcodés
- ✅ Pas de tokens en clair
- ✅ Pas de fichiers .env commités


### 3. Input Validation (8.0/10)

**✅ Validation Zod** (`app/api/collaborateurs/invite/route.ts:21-27`)
```typescript
const validationResult = inviteCollaborateurSchema.safeParse(body)
if (!validationResult.success) {
  return NextResponse.json(
    { error: validationResult.error.errors[0]?.message },
    { status: 400 }
  )
}
```

**✅ Sanitisation XSS** (`lib/security.ts:9-17`)
```typescript
export function sanitizeMessage(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

**✅ Validation de format** (`lib/security.ts:23-29`)
```typescript
// Validation sessionId (empêche injection)
export function isValidSessionId(sessionId: string): boolean {
  return /^session_\d+_[a-z0-9]+$/.test(sessionId);
}
```

**Usage** (`app/api/chatbot/route.ts:27-41`) :
- Validation message (longueur max 1000 caractères)
- Validation session ID (format strict)
- Sanitisation avant envoi à N8N


### 4. Rate Limiting (Partiel - 5.0/10)

**✅ Implémenté pour le chatbot** (`lib/rate-limit.ts`)
```typescript
const MAX_REQUESTS = 10;
const WINDOW_MS = 60000; // 1 minute

class ChatbotRateLimiter {
  // LRU Cache pour tracker les IPs
  // Max 500 IPs trackées
  // Fenêtre glissante de 1 minute
}
```

**❌ Manquant pour** :
- Routes API `/api/marriage-admin/*`
- Routes API `/api/collaborateurs/*`
- Upload de fichiers
- Endpoints publics


---

## ⚠️ VULNÉRABILITÉS DÉTECTÉES

### 🔴 CRITIQUE

**Aucune vulnérabilité critique détectée** ✅


### 🟡 MOYENNE

#### 1. Absence de CORS (MEDIUM)

**Localisation** : Toutes les API routes
**Impact** : Accès cross-origin non contrôlé

**Risque** :
```typescript
// Actuellement, AUCUNE restriction CORS
// N'importe quel site peut appeler vos API si :
// - L'utilisateur est connecté
// - Le cookie de session est envoyé
```

**Exemple d'attaque** :
```javascript
// Site malveillant malicious.com
fetch('https://nuply.com/api/marriage-admin/create', {
  method: 'POST',
  credentials: 'include', // Envoie les cookies Nuply
  body: JSON.stringify({...})
})
// ⚠️ Fonctionnerait si l'utilisateur est connecté à Nuply
```

**Recommandation** :
```typescript
// middleware.ts ou next.config.ts
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://nuply.com',
    'https://www.nuply.com',
    process.env.NEXT_PUBLIC_SITE_URL
  ];

  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}
```


#### 2. Rate Limiting Insuffisant (MEDIUM)

**Problème** : Seulement le chatbot est protégé

**Routes vulnérables** :
```
POST /api/marriage-admin/create
POST /api/marriage-admin/generate-pdf
POST /api/marriage-admin/upload-document
POST /api/collaborateurs/invite
POST /api/collaborateurs/invitation/[token]/accept
```

**Risque** :
- Attaque par force brute sur les invitations
- DDoS sur les endpoints de génération PDF
- Spam d'invitations de collaborateurs

**Recommandation** :
```typescript
// lib/rate-limit.ts
export const apiLimiter = new RateLimiter({
  max: 50,        // 50 requêtes
  windowMs: 60000 // par minute
});

export const uploadLimiter = new RateLimiter({
  max: 5,         // 5 uploads
  windowMs: 60000 // par minute
});

export const inviteLimiter = new RateLimiter({
  max: 10,        // 10 invitations
  windowMs: 3600000 // par heure
});
```


#### 3. Exposition d'erreurs techniques (LOW-MEDIUM)

**Localisations multiples** :
- `app/api/collaborateurs/invite/route.ts:70` - `console.error`
- `app/api/marriage-admin/generate-pdf/route.ts:72-75` - `error.message` retourné

**Exemples** :
```typescript
// ❌ MAUVAIS
return NextResponse.json(
  { error: error.message },  // Peut exposer stack traces
  { status: 500 }
)

// ✅ BON
return NextResponse.json(
  { error: 'Une erreur est survenue' },
  { status: 500 }
)
// + Logger l'erreur complète côté serveur
```

**Risque** :
- Fuite d'informations sur la structure DB
- Exposition de chemins système
- Aide pour reconnaissance du système

**Fichiers à corriger** :
```
app/api/collaborateurs/invite/route.ts:70-75
app/api/marriage-admin/generate-pdf/route.ts:71-76
```


### 🟢 FAIBLE

#### 4. Console.log en production (LOW)

**23 occurrences trouvées** dans `/app/api/`

**Exemples** :
```typescript
// app/api/marriage-admin/generate-pdf/route.ts
console.log('📄 Génération PDF pour dossier:', marriageFileId) // Ligne 27
console.log('✅ Données récupérées:', {...}) // Ligne 54
console.error('❌ Erreur génération PDF:', error) // Ligne 72
```

**Risque** :
- Fuite d'IDs utilisateurs dans les logs
- Performance dégradée en production
- Logs non structurés (difficile à monitorer)

**Recommandation** :
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, meta);
    }
    // En prod: envoyer à Sentry, LogRocket, etc.
  },
  error: (message: string, error?: Error) => {
    console.error(message, error);
    // Toujours logger les erreurs (monitoring)
  }
};

// Usage
logger.info('PDF généré', { marriageFileId });
```


#### 5. dangerouslySetInnerHTML (LOW - Acceptable)

**Localisation** : `components/ui/chart.tsx:81-98`

**Analyse** :
```typescript
<style
  dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES).map(...)
    // Génération de variables CSS dynamiques
    // Données contrôlées (pas d'input utilisateur)
  }}
/>
```

**Verdict** : ✅ **SÉCURISÉ**
- Données générées en interne
- Pas d'input utilisateur
- Utilisation légitime pour CSS-in-JS
- Aucune action requise


#### 6. Validation de fichiers uploadés (À VÉRIFIER)

**Note** : Aucun code d'upload de fichier trouvé dans l'analyse actuelle

**À implémenter si upload de fichiers** :
```typescript
// Validation à ajouter
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Type de fichier non autorisé');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Fichier trop volumineux');
  }
  // Vérifier le magic number (pas juste l'extension)
}
```


---

## 🛡️ RECOMMANDATIONS PAR PRIORITÉ

### 🔴 PRIORITÉ HAUTE (1-2 jours)

1. **Implémenter CORS strict**
   - Fichier : `middleware.ts` ou `next.config.ts`
   - Temps estimé : 2h
   - Impact : Bloque les attaques CSRF cross-origin

2. **Généraliser le rate limiting**
   - Fichier : `lib/rate-limit.ts` + routes API
   - Temps estimé : 4h
   - Impact : Protection contre DDoS et brute force

3. **Retirer les console.log en production**
   - Fichiers : Tous les `/app/api/*.ts`
   - Temps estimé : 1h
   - Impact : Évite fuites d'informations


### 🟡 PRIORITÉ MOYENNE (1 semaine)

4. **Standardiser la gestion d'erreurs**
   - Créer un error handler centralisé
   - Ne jamais exposer `error.message` au client
   - Logger proprement côté serveur

5. **Implémenter un logger structuré**
   - Intégrer Sentry ou LogRocket
   - Remplacer tous les console.log
   - Ajouter context (userId, requestId, etc.)

6. **Ajouter validation stricte des uploads**
   - Vérifier magic numbers
   - Scanner antivirus (ClamAV ou équivalent)
   - Limiter taille et types de fichiers


### 🟢 PRIORITÉ BASSE (Améliorations futures)

7. **Implémenter 2FA**
   - Authentification à deux facteurs optionnelle
   - Via Supabase Auth + TOTP

8. **Content Security Policy (CSP)**
   - Headers CSP stricts
   - Bloquer inline scripts (sauf whitelist)

9. **Monitoring & Alerting**
   - Alertes sur tentatives de brute force
   - Monitoring des taux d'erreur 500
   - Alertes sur usage anormal d'API


---

## 📋 CHECKLIST DE DÉPLOIEMENT

Avant chaque déploiement en production :

```bash
# Sécurité
☑ Pas de secrets hardcodés (grep -r "sk_" "pk_")
☑ .env.local non commité (git status)
☑ Variables d'environnement en prod configurées
☑ CORS configuré et testé
☑ Rate limiting activé sur toutes les routes critiques

# Code quality
☑ Pas de console.log en production
☑ Error handling standardisé
☑ Validation des inputs côté serveur
☑ Tests de sécurité passés

# Infrastructure
☑ HTTPS activé (Let's Encrypt ou équivalent)
☑ Headers de sécurité configurés
☑ Supabase RLS (Row Level Security) activé
☑ Backups DB automatiques configurés

# Monitoring
☑ Sentry ou équivalent configuré
☑ Alertes sur erreurs 500 activées
☑ Logs centralisés (CloudWatch, Datadog, etc.)
```


---

## 🔗 RESSOURCES UTILES

### Documentation Supabase
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

### OWASP Top 10 2023
- [A01:2021 – Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [A03:2021 – Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [A07:2021 – Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)

### Next.js Security
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)
- [Rate Limiting in Next.js](https://vercel.com/guides/rate-limiting)


---

## 📞 CONTACT

Pour toute question sur cet audit :
- Créer une issue sur le repository
- Consulter la documentation `/docs/`

**Prochaine révision recommandée** : Mars 2026 (tous les 3 mois)


---

**Statut** : ✅ **APPROUVÉ POUR PRODUCTION** avec corrections priorité HAUTE implémentées

**Signature** : Senior NextJS Developer
**Date** : 2025-12-29
