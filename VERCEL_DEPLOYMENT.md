# Guide de Déploiement Vercel - Nuply

## Prérequis
- Compte Vercel (https://vercel.com)
- Compte GitHub avec le repo Nuply
- Clés API Supabase et OpenAI

## Étapes de Déploiement

### 1. Importer le Projet
1. Connectez-vous à Vercel
2. Cliquez sur "Add New Project"
3. Importez votre repo GitHub `saas-app`

### 2. Configuration du Projet
**Framework Preset:** Next.js (détecté automatiquement)
**Build Command:** `npm run build`
**Output Directory:** `.next` (par défaut)

### 3. Variables d'Environnement
Ajoutez les variables suivantes dans les Settings > Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 4. Déployer
1. Cliquez sur "Deploy"
2. Attendez la fin du build (2-3 minutes)
3. Votre app est live sur `your-project.vercel.app` !

## Configuration Post-Déploiement

### Domaine Personnalisé
1. Settings > Domains
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions DNS

### Supabase Callback URL
Ajoutez l'URL Vercel dans Supabase:
1. Supabase Dashboard > Authentication > URL Configuration
2. Ajoutez: `https://your-domain.vercel.app/auth/callback`

### Déploiements Automatiques
- **Production:** Push sur `main` déploie automatiquement
- **Preview:** Chaque PR crée un déploiement de preview

## Commandes Utiles
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer en local
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs
```

## Troubleshooting

### Build Failed
- Vérifiez que toutes les variables d'env sont définies
- `npm run build` doit fonctionner en local

### Runtime Errors
- Vérifiez les logs: Settings > Functions > Logs
- Vérifiez les variables d'environnement

### Database Connection
- Vérifiez les URLs Supabase
- Vérifiez les RLS policies dans Supabase

## Support
- Docs Vercel: https://vercel.com/docs
- Docs Next.js: https://nextjs.org/docs
- Docs Supabase: https://supabase.com/docs
