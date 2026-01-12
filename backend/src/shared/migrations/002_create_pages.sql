-- ============================================
-- MIGRATION 002: Create Pages Table
-- Description: Table pour stocker les Pages (niveau 1 de la hiérarchie)
-- Author: Claude AI
-- Date: 2026-01-05
-- ============================================

-- Table: pages
-- Niveau 1 de la hiérarchie: Page → Section → Group → Bookmark
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    icon VARCHAR(50) DEFAULT '📄',
    color VARCHAR(7) DEFAULT '#667eea',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance: Récupérer pages d'un user triées par position
CREATE INDEX idx_pages_user_position ON pages(user_id, position);

-- Index unique: Empêcher doublons de nom pour même user
CREATE UNIQUE INDEX idx_pages_user_name ON pages(user_id, LOWER(name));

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE pages IS 'Pages (niveau 1): Conteneurs principaux pour organiser bookmarks';
COMMENT ON COLUMN pages.name IS 'Nom de la page (ex: "Travail", "Personnel")';
COMMENT ON COLUMN pages.position IS 'Ordre d affichage dans les tabs (0, 1, 2...)';
COMMENT ON COLUMN pages.icon IS 'Emoji ou identifiant d icône pour le tab';
COMMENT ON COLUMN pages.color IS 'Couleur hex pour le tab (#667eea)';

-- ============================================
-- Données de test (optionnel - à commenter en production)
-- ============================================

-- Créer 2 pages de test pour le premier user
-- (Décommenter si besoin de données de test)
/*
INSERT INTO pages (user_id, name, position, icon, color)
SELECT
    id,
    'Travail',
    0,
    '💼',
    '#4A90E2'
FROM users
WHERE email = 'test@pingrid.com'
LIMIT 1;

INSERT INTO pages (user_id, name, position, icon, color)
SELECT
    id,
    'Personnel',
    1,
    '🏠',
    '#E24A4A'
FROM users
WHERE email = 'test@pingrid.com'
LIMIT 1;
*/

-- ============================================
-- Vérifications
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pages') THEN
        RAISE NOTICE '✅ Table pages créée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Erreur: Table pages non créée';
    END IF;
END $$;

-- Afficher la structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'pages'
ORDER BY ordinal_position;
