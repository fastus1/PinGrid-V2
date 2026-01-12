-- ============================================
-- MIGRATION 005: Create Bookmarks Table
-- Description: Table pour stocker les Bookmarks (niveau 4 de la hiérarchie)
-- Author: Claude AI
-- Date: 2026-01-07
-- ============================================

-- Table: bookmarks
-- Niveau 4 de la hiérarchie: Page → Section → Group → Bookmark
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    visit_count INTEGER NOT NULL DEFAULT 0,
    favicon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- CHECK Constraints
    CONSTRAINT check_url_not_empty CHECK (LENGTH(TRIM(url)) > 0),
    CONSTRAINT check_visit_count_positive CHECK (visit_count >= 0)
);

-- Index pour performance: Récupérer bookmarks d'un group triés par position
CREATE INDEX idx_bookmarks_group_position ON bookmarks(group_id, position);

-- Index pour performance: Récupérer bookmarks par utilisateur
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- Index pour performance: Top bookmarks par visit_count
CREATE INDEX idx_bookmarks_visit_count ON bookmarks(visit_count DESC);

-- Index pour performance: Recherche par URL
CREATE INDEX idx_bookmarks_url ON bookmarks(url);

-- Trigger: Auto-update updated_at
-- Note: La fonction update_updated_at_column() existe déjà (créée dans migration 002)
CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE bookmarks IS 'Bookmarks (niveau 4): Liens individuels organisés dans des groups';
COMMENT ON COLUMN bookmarks.title IS 'Titre du bookmark (ex: "Google", "GitHub")';
COMMENT ON COLUMN bookmarks.url IS 'URL complète du bookmark';
COMMENT ON COLUMN bookmarks.description IS 'Description optionnelle du bookmark';
COMMENT ON COLUMN bookmarks.position IS 'Ordre d affichage dans le group (0, 1, 2...)';
COMMENT ON COLUMN bookmarks.visit_count IS 'Nombre de clics sur ce bookmark (pour statistiques et "top utilisés")';
COMMENT ON COLUMN bookmarks.favicon_url IS 'URL du favicon (récupéré automatiquement ou personnalisé)';

-- ============================================
-- Vérifications
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookmarks') THEN
        RAISE NOTICE '✅ Table bookmarks créée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Erreur: Table bookmarks non créée';
    END IF;
END $$;

-- Afficher la structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookmarks'
ORDER BY ordinal_position;
