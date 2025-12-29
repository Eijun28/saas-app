# 🔐 Configuration des variables d'environnement

## Fichier à créer : `.env.local`

Crée un fichier `.env.local` à la racine du projet avec ce contenu EXACT :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ywevzjygrzoxijgrzngv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_o1iOUeKkipAhwtEpdriX1A_a0jB_rIv
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXd6anlncm96eGlqZ3J6bmd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg0MjY0MCwiZXhwIjoyMDc5NDE4NjQwfQ.f6T7XaOepyzn2szdAtt7S0x6KBTqO1R1wbkd-QEaclk

# Optionnel
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Étapes

1. **Crée le fichier** `.env.local` à la racine du projet (même niveau que `package.json`)

2. **Copie-colle le contenu ci-dessus** dans le fichier

3. **Redémarre le serveur** :
   ```bash
   # Arrête le serveur actuel (Ctrl+C dans le terminal)
   npm run dev
   ```

## Vérification

Le fichier doit être à :
```
nuply/
  ├── .env.local          ← ICI
  ├── package.json
  ├── next.config.js
  └── ...
```

## ⚠️ Important

- ✅ Le fichier `.env.local` est déjà dans `.gitignore` (ne sera pas commité)
- ✅ Ne partage jamais ces clés publiquement
- ✅ Redémarre toujours le serveur après avoir modifié `.env.local`

## Si l'erreur persiste

1. Vérifie que le fichier s'appelle bien `.env.local` (avec le point au début)
2. Vérifie qu'il n'y a pas d'espaces avant/après les `=`
3. Vérifie que les valeurs ne sont pas entre guillemets
4. Redémarre complètement le serveur (arrête et relance)

