# 📊 Schéma de Base de Données Supabase pour NUPLY

## Vue d'ensemble

Ce document décrit toutes les tables nécessaires pour faire fonctionner la plateforme NUPLY, basé sur l'analyse complète du code existant.

---

## 🔐 Tables d'authentification (déjà existantes)

### 1. `profiles`
**Description** : Profil de base pour tous les utilisateurs (couples et prestataires)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('couple', 'prestataire')) DEFAULT NULL,
  prenom TEXT,
  nom TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_onboarding ON profiles(onboarding_completed);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
*
vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv2c^ 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. `couple_profiles`
**Description** : Informations spécifiques aux couples

```sql
CREATE TABLE couple_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  ville_marriage TEXT,
  date_marriage DATE,
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  culture TEXT,
  prestataires_recherches TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_couple_profiles_updated_at
  BEFORE UPDATE ON couple_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. `prestataire_profiles`
**Description** : Informations spécifiques aux prestataires

```sql
CREATE TABLE prestataire_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  nom_entreprise TEXT,
  type_prestation TEXT, -- 'photographe', 'traiteur', 'fleuriste', etc.
 -.ééééééééééééé ville_exercice TEXT,
  tarif_min NUMERIC(10, 2),
  tarif_max NUMERIC(10, 2),
  cultures_gerees TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prestataire_type ON prestataire_profiles(type_prestation);
CREATE INDEX idx_prestataire_ville ON prestataire_profiles(ville_exercice);

CREATE TRIGGER update_prestataire_profiles_updated_at
  BEFORE UPDATE ON prestataire_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 💼 Tables principales

### 4. `demandes`
**Description** : Demandes de prestations envoyées par les couples aux prestataires

```sql
CREATE TABLE demandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('new', 'in-progress', 'accepted', 'rejected', 'completed')) DEFAULT 'new',
  date_mariage DATE NOT NULL,
  budget_min NUMERIC(10, 2),
  budget_max NUMERIC(10, 2),
  location TEXT NOT NULL,
  message TEXT, -- Message optionnel du couple
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demandes_couple ON demandes(couple_id);
CREATE INDEX idx_demandes_prestataire ON demandes(prestataire_id);
CREATE INDEX idx_demandes_status ON demandes(status);
CREATE INDEX idx_demandes_date ON demandes(date_mariage);

CREATE TRIGGER update_demandes_updated_at
  BEFORE UPDATE ON demandes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5. `events` (Agenda)
**Description** : Événements dans l'agenda des prestataires

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL, -- Lien optionnel avec une demande
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'pending', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_prestataire ON events(prestataire_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6. `prestataire_public_profiles`
**Description** : Profil public détaillé des prestataires (visible par les couples)

```sql
CREATE TABLE prestataire_public_profiles (
  prestataire_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT,
  rating NUMERIC(3, 2) DEFAULT 0, -- Note moyenne (0-5)
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prestataire_public_rating ON prestataire_public_profiles(rating);
CREATE INDEX idx_prestataire_public_verified ON prestataire_public_profiles(is_verified);

CREATE TRIGGER update_prestataire_public_updated_at
  BEFORE UPDATE ON prestataire_public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 7. `services`
**Description** : Services proposés par les prestataires avec leurs tarifs

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_hours INTEGER, -- Durée en heures
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_prestataire ON services(prestataire_id);
CREATE INDEX idx_services_active ON services(is_active);

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 8. `portfolio_images`
**Description** : Images du portfolio des prestataires

```sql
CREATE TABLE portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- URL de l'image stockée dans Supabase Storage
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portfolio_prestataire ON portfolio_images(prestataire_id);
CREATE INDEX idx_portfolio_order ON portfolio_images(prestataire_id, display_order);
```

### 9. `favoris`
**Description** : Prestataires favoris des couples

```sql
CREATE TABLE favoris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, prestataire_id) -- Un couple ne peut pas ajouter le même prestataire deux fois
);

CREATE INDEX idx_favoris_couple ON favoris(couple_id);
CREATE INDEX idx_favoris_prestataire ON favoris(prestataire_id);
```

### 10. `budget_categories`
**Description** : Catégories de budget pour les couples

```sql
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Photographie', 'Traiteur', 'Décoration', etc.
  budget_allocated NUMERIC(10, 2) NOT NULL,
  spent NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_categories_couple ON budget_categories(couple_id);

CREATE TRIGGER update_budget_categories_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 11. `budget_expenses`
**Description** : Dépenses individuelles des couples

```sql
CREATE TABLE budget_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  prestataire_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Lien optionnel avec un prestataire
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_couple ON budget_expenses(couple_id);
CREATE INDEX idx_expenses_category ON budget_expenses(category_id);
CREATE INDEX idx_expenses_date ON budget_expenses(date);

CREATE TRIGGER update_budget_expenses_updated_at
  BEFORE UPDATE ON budget_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 12. `timeline_milestones`
**Description** : Jalons/étapes de la timeline des couples

```sql
CREATE TABLE timeline_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'done')) DEFAULT 'todo',
  prestataire_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Lien optionnel avec un prestataire
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_couple ON timeline_milestones(couple_id);
CREATE INDEX idx_milestones_status ON timeline_milestones(status);
CREATE INDEX idx_milestones_due_date ON timeline_milestones(due_date);

CREATE TRIGGER update_timeline_milestones_updated_at
  BEFORE UPDATE ON timeline_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 13. `collaborateurs`
**Description** : Collaborateurs invités par les couples

```sql
CREATE TABLE collaborateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- 'Témoin', 'Famille', 'Ami', etc.
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ, -- NULL si pas encore accepté
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL si pas encore inscrit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collaborateurs_couple ON collaborateurs(couple_id);
CREATE INDEX idx_collaborateurs_email ON collaborateurs(email);

CREATE TRIGGER update_collaborateurs_updated_at
  BEFORE UPDATE ON collaborateurs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 14. `conversations`
**Description** : Conversations entre couples et prestataires

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL, -- Lien optionnel avec une demande
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, prestataire_id) -- Une seule conversation par paire couple-prestataire
);

CREATE INDEX idx_conversations_couple ON conversations(couple_id);
CREATE INDEX idx_conversations_prestataire ON conversations(prestataire_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 15. `messages`
**Description** : Messages dans les conversations

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;
```

### 16. `message_attachments`
**Description** : Fichiers joints aux messages

```sql
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- URL du fichier dans Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER, -- Taille en bytes
  file_type TEXT, -- MIME type
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attachments_message ON message_attachments(message_id);
```

### 17. `reviews`
**Description** : Avis des couples sur les prestataires

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prestataire_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL, -- Lien avec la demande
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(couple_id, prestataire_id, demande_id) -- Un couple ne peut laisser qu'un avis par demande
);

CREATE INDEX idx_reviews_prestataire ON reviews(prestataire_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_couple ON reviews(couple_id);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔒 Politiques de sécurité (Row Level Security)

### Activer RLS sur toutes les tables

```sql
-- Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataire_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestataire_public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

### Exemples de politiques (à adapter selon vos besoins)

```sql
-- Profiles : Les utilisateurs peuvent voir leur propre profil et les profils publics
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles"
  ON profiles FOR SELECT
  USING (true); -- À adapter selon vos besoins de confidentialité

-- Demandes : Les couples voient leurs demandes, les prestataires voient les demandes qui leur sont adressées
CREATE POLICY "Couples can view their demands"
  ON demandes FOR SELECT
  USING (
    auth.uid() = couple_id OR
    auth.uid() = prestataire_id
  );

CREATE POLICY "Couples can create demands"
  ON demandes FOR INSERT
  WITH CHECK (auth.uid() = couple_id);

-- Messages : Les utilisateurs voient les messages de leurs conversations
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.couple_id = auth.uid() OR conversations.prestataire_id = auth.uid())
    )
  );
```

---

## 📦 Supabase Storage

### Buckets nécessaires

1. **`portfolio-images`** : Images du portfolio des prestataires
   - Politique : Public en lecture, écriture uniquement pour le propriétaire

2. **`message-attachments`** : Fichiers joints aux messages
   - Politique : Accès uniquement pour les participants à la conversation

---

## 📊 Vues utiles (Views)

### Vue pour le matching des prestataires

```sql
CREATE VIEW prestataire_matching_view AS
SELECT 
  p.id,
  p.prenom,
  p.nom,
  pp.nom_entreprise,
  pp.type_prestation,
  pp.ville_exercice,
  pp.tarif_min,
  pp.tarif_max,
  ppp.rating,
  ppp.total_reviews,
  ppp.is_verified,
  COUNT(DISTINCT f.id) as favoris_count
FROM profiles p
JOIN prestataire_profiles pp ON p.id = pp.user_id
LEFT JOIN prestataire_public_profiles ppp ON p.id = ppp.prestataire_id
LEFT JOIN favoris f ON p.id = f.prestataire_id
WHERE p.role = 'prestataire'
GROUP BY p.id, pp.user_id, ppp.prestataire_id;
```

---

## 🚀 Commandes SQL à exécuter

1. **Créer toutes les tables** : Exécuter les CREATE TABLE dans l'ordre
2. **Créer les index** : Pour améliorer les performances
3. **Créer les triggers** : Pour la mise à jour automatique de `updated_at`
4. **Activer RLS** : Pour la sécurité
5. **Créer les politiques** : Selon vos besoins de sécurité
6. **Créer les buckets Storage** : Via l'interface Supabase ou SQL
7. **Créer les vues** : Pour faciliter les requêtes complexes

---

## 📝 Notes importantes

- **UUID** : Toutes les clés primaires utilisent UUID pour la sécurité
- **Timestamps** : Toutes les tables ont `created_at` et `updated_at`
- **Soft deletes** : Non implémenté ici, mais vous pouvez ajouter un champ `deleted_at` si nécessaire
- **Relations** : Utilisation de `ON DELETE CASCADE` pour la cohérence des données
- **Index** : Créés sur les colonnes fréquemment utilisées dans les requêtes
- **RLS** : Essentiel pour la sécurité, à configurer selon vos besoins

---

## 🔄 Migrations futures possibles

- Table `notifications` pour les notifications en temps réel
- Table `subscriptions` pour les abonnements premium
- Table `analytics` pour le suivi des performances
- Table `tags` pour le système de tags des prestataires
- Table `matching_scores` pour stocker les scores de Nuply Matching

