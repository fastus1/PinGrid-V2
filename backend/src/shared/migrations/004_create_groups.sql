-- ============================================
-- MIGRATION 004: Create Groups Table
-- Description: Table pour stocker les Groups (niveau 3 de la hiérarchie)
-- Author: Claude AI
-- Date: 2026-01-06
-- ============================================

-- Table: groups
-- Niveau 3 de la hiérarchie: Page → Section → Group → Bookmark
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    column_count INTEGER NOT NULL DEFAULT 3,
    group_type VARCHAR(50) NOT NULL DEFAULT 'manual',
    bookmark_limit INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- CHECK Constraints
    CONSTRAINT check_column_count CHECK (column_count >= 1 AND column_count <= 6),
    CONSTRAINT check_group_type CHECK (group_type IN ('manual', 'dynamic-top-used'))
);

-- Index pour performance: Récupérer groups d'une section triés par position
CREATE INDEX idx_groups_section_position ON groups(section_id, position);

-- Index unique: Empêcher doublons de nom pour même section (case-insensitive)
CREATE UNIQUE INDEX idx_groups_section_name ON groups(section_id, LOWER(name));

-- Trigger: Auto-update updated_at
-- Note: La fonction update_updated_at_column() existe déjà (créée dans migration 002)
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE groups IS 'Groups (niveau 3): Conteneurs pour organiser bookmarks dans une grille';
COMMENT ON COLUMN groups.name IS 'Nom du group (ex: "Communication", "Development Tools", "Top 10")';
COMMENT ON COLUMN groups.position IS 'Ordre d affichage dans la section (0, 1, 2...)';
COMMENT ON COLUMN groups.column_count IS 'Nombre de colonnes pour la grille de bookmarks (1-6)';
COMMENT ON COLUMN groups.group_type IS 'Type: "manual" (user gère bookmarks) ou "dynamic-top-used" (auto-triés par usage)';
COMMENT ON COLUMN groups.bookmark_limit IS 'Pour dynamic groups: nombre max de bookmarks à afficher (ex: 10 pour "Top 10")';

-- ============================================
-- Données de test (optionnel - à commenter en production)
-- ============================================

-- Créer 3 groups de test pour la première section
-- (Décommenter si besoin de données de test)
/*
INSERT INTO groups (section_id, name, position, column_count, group_type, bookmark_limit)
SELECT
    id,
    'Communication',
    0,
    3,
    'manual',
    NULL
FROM sections
WHERE name = 'Daily Tools'
LIMIT 1;

INSERT INTO groups (section_id, name, position, column_count, group_type, bookmark_limit)
SELECT
    id,
    'Development',
    1,
    4,
    'manual',
    NULL
FROM sections
WHERE name = 'Daily Tools'
LIMIT 1;

INSERT INTO groups (section_id, name, position, column_count, group_type, bookmark_limit)
SELECT
    id,
    'Top 10',
    2,
    2,
    'dynamic-top-used',
    10
FROM sections
WHERE name = 'Daily Tools'
LIMIT 1;
*/

-- ============================================
-- Vérifications
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups') THEN
        RAISE NOTICE '✅ Table groups créée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Erreur: Table groups non créée';
    END IF;
END $$;

-- Afficher la structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'groups'
ORDER BY ordinal_position;
