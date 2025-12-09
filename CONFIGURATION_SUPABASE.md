# ⚙️ Configuration Supabase - Variables d'environnement

## Variables requises

Ajoute ces variables dans ton fichier `.env.local` :

```env
# Supabase URL (public)
NEXT_PUBLIC_SUPABASE_URL=ton_url_supabase

# Supabase Anon Key (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key

# ⚠️ IMPORTANT : Service Role Key (SECRET - jamais exposé côté client)
SUPABASE_SERVICE_ROLE_KEY=ton_service_role_key
```

## Où trouver le Service Role Key ?

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. Va dans **Settings** → **API**
4. Cherche la section **Project API keys**
5. Copie la **`service_role` key** (⚠️ SECRET KEY - ne jamais partager)

## Pourquoi cette clé ?

Le `SUPABASE_SERVICE_ROLE_KEY` permet de :
- ✅ Bypasser RLS (Row Level Security)
- ✅ Créer des profils depuis l'API sans problème de permissions
- ✅ Résoudre l'erreur 42501

**⚠️ SÉCURITÉ :**
- ❌ Ne jamais exposer cette clé côté client
- ❌ Ne jamais la commiter dans Git
- ✅ Utiliser uniquement dans les API routes/server actions
- ✅ Ajouter `.env.local` dans `.gitignore`

## Vérification

Après avoir ajouté la variable, redémarre le serveur :

```bash
npm run dev
```

## En cas d'erreur

Si tu as l'erreur : `Missing Supabase environment variables`

1. Vérifie que `.env.local` existe à la racine du projet
2. Vérifie que la variable `SUPABASE_SERVICE_ROLE_KEY` est bien définie
3. Redémarre le serveur de développement
