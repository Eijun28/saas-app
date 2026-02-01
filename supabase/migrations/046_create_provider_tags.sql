-- Migration: Create provider tags system
-- Allows providers to add custom tags/keywords to improve matching

-- Create tags table with predefined and custom tags
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT, -- Optional: 'style', 'ambiance', 'service', 'specialite', etc.
  is_predefined BOOLEAN DEFAULT false, -- true for system tags, false for user-created
  usage_count INTEGER DEFAULT 0, -- Track popularity
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create provider_tags junction table
CREATE TABLE IF NOT EXISTS provider_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_tags_profile_id ON provider_tags(profile_id);
CREATE INDEX IF NOT EXISTS idx_provider_tags_tag_id ON provider_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_label ON tags(label);

-- RLS Policies for tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read tags
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON tags;
CREATE POLICY "Tags are viewable by everyone" ON tags
  FOR SELECT USING (true);

-- Only authenticated users can create tags (will be moderated via is_predefined)
DROP POLICY IF EXISTS "Authenticated users can create tags" ON tags;
CREATE POLICY "Authenticated users can create tags" ON tags
  FOR INSERT TO authenticated
  WITH CHECK (is_predefined = false);

-- RLS Policies for provider_tags table
ALTER TABLE provider_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can view provider tags
DROP POLICY IF EXISTS "Provider tags are viewable by everyone" ON provider_tags;
CREATE POLICY "Provider tags are viewable by everyone" ON provider_tags
  FOR SELECT USING (true);

-- Providers can manage their own tags
DROP POLICY IF EXISTS "Providers can insert their own tags" ON provider_tags;
CREATE POLICY "Providers can insert their own tags" ON provider_tags
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Providers can delete their own tags" ON provider_tags;
CREATE POLICY "Providers can delete their own tags" ON provider_tags
  FOR DELETE TO authenticated
  USING (profile_id = auth.uid());

-- Insert predefined tags by category
INSERT INTO tags (label, slug, category, is_predefined) VALUES
  -- Style
  ('Bohème', 'boheme', 'style', true),
  ('Classique', 'classique', 'style', true),
  ('Moderne', 'moderne', 'style', true),
  ('Romantique', 'romantique', 'style', true),
  ('Champêtre', 'champetre', 'style', true),
  ('Vintage', 'vintage', 'style', true),
  ('Minimaliste', 'minimaliste', 'style', true),
  ('Luxe', 'luxe', 'style', true),
  ('Industriel', 'industriel', 'style', true),
  ('Tropical', 'tropical', 'style', true),

  -- Ambiance
  ('Intime', 'intime', 'ambiance', true),
  ('Festif', 'festif', 'ambiance', true),
  ('Décontracté', 'decontracte', 'ambiance', true),
  ('Élégant', 'elegant', 'ambiance', true),
  ('Familial', 'familial', 'ambiance', true),
  ('Soirée dansante', 'soiree-dansante', 'ambiance', true),

  -- Services spéciaux
  ('Éco-responsable', 'eco-responsable', 'service', true),
  ('Sur mesure', 'sur-mesure', 'service', true),
  ('Tout inclus', 'tout-inclus', 'service', true),
  ('À domicile', 'a-domicile', 'service', true),
  ('Livraison', 'livraison', 'service', true),
  ('Installation', 'installation', 'service', true),

  -- Spécialités
  ('Mariage religieux', 'mariage-religieux', 'specialite', true),
  ('Mariage laïque', 'mariage-laique', 'specialite', true),
  ('Mariage civil', 'mariage-civil', 'specialite', true),
  ('LGBTQ+ friendly', 'lgbtq-friendly', 'specialite', true),
  ('Petit comité', 'petit-comite', 'specialite', true),
  ('Grand mariage', 'grand-mariage', 'specialite', true),
  ('Destination wedding', 'destination-wedding', 'specialite', true),
  ('Renouvellement de voeux', 'renouvellement-voeux', 'specialite', true),

  -- Qualités
  ('Réactif', 'reactif', 'qualite', true),
  ('Créatif', 'creatif', 'qualite', true),
  ('Expérimenté', 'experimente', 'qualite', true),
  ('Bilingue', 'bilingue', 'qualite', true),
  ('Flexible', 'flexible', 'qualite', true)
ON CONFLICT (slug) DO NOTHING;

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers to track tag usage
DROP TRIGGER IF EXISTS trigger_increment_tag_usage ON provider_tags;
CREATE TRIGGER trigger_increment_tag_usage
  AFTER INSERT ON provider_tags
  FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

DROP TRIGGER IF EXISTS trigger_decrement_tag_usage ON provider_tags;
CREATE TRIGGER trigger_decrement_tag_usage
  AFTER DELETE ON provider_tags
  FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

-- Comments for documentation
COMMENT ON TABLE tags IS 'Tags/keywords for provider matching - both predefined and user-created';
COMMENT ON TABLE provider_tags IS 'Junction table linking providers to their tags';
COMMENT ON COLUMN tags.is_predefined IS 'true for system tags, false for user-created tags';
COMMENT ON COLUMN tags.usage_count IS 'Number of providers using this tag (for popularity sorting)';
COMMENT ON COLUMN tags.category IS 'Tag category: style, ambiance, service, specialite, qualite';
