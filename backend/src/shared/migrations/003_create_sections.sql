-- ============================================
-- MIGRATION 003: Create Sections Table
-- Description: Table pour stocker les Sections (niveau 2 de la hiérarchie)
-- Author: Claude AI
-- Date: 2026-01-05
-- ============================================

-- Table: sections
-- Niveau 2 de la hiérarchie: Page → Section → Group → Bookmark
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    collapsed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance: Récupérer sections d'une page triées par position
CREATE INDEX idx_sections_page_position ON sections(page_id, position);

-- Index unique: Empêcher doublons de nom pour même page
CREATE UNIQUE INDEX idx_sections_page_name ON sections(page_id, LOWER(name));

-- Trigger: Auto-update updated_at (réutilise la fonction existante)
CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE sections IS 'Sections (niveau 2): Blocs verticaux dans une page pour organiser les groupes';
COMMENT ON COLUMN sections.page_id IS 'Référence vers la page parente';
COMMENT ON COLUMN sections.name IS 'Nom de la section (ex: "Daily Tools", "Work Projects")';
COMMENT ON COLUMN sections.position IS 'Ordre vertical d affichage dans la page (0, 1, 2...)';
COMMENT ON COLUMN sections.collapsed IS 'Section repliée (true) ou dépliée (false)';

-- ============================================
-- Données de test (optionnel - à commenter en production)
-- ============================================

-- Créer 3 sections de test dans la première page de test
-- (Décommenter si besoin de données de test)
/*
-- Section 1: Daily Tools
INSERT INTO sections (page_id, name, position, collapsed)
SELECT
    id,
    'Daily Tools',
    0,
    false
FROM pages
WHERE name = 'Work'
ORDER BY created_at
LIMIT 1;

-- Section 2: Work Projects
INSERT INTO sections (page_id, name, position, collapsed)
SELECT
    id,
    'Work Projects',
    1,
    false
FROM pages
WHERE name = 'Work'
ORDER BY created_at
LIMIT 1;

-- Section 3: Resources
INSERT INTO sections (page_id, name, position, collapsed)
SELECT
    id,
    'Resources',
    2,
    true
FROM pages
WHERE name = 'Work'
ORDER BY created_at
LIMIT 1;
*/

-- ============================================
-- Vérifications
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sections') THEN
        RAISE NOTICE '✅ Table sections créée avec succès';
    ELSE
        RAISE EXCEPTION '❌ Erreur: Table sections non créée';
    END IF;
END $$;

-- Vérifier la foreign key
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name = 'sections'
        AND constraint_name LIKE '%page_id%'
    ) THEN
        RAISE NOTICE '✅ Foreign key page_id créée avec succès';
    ELSE
        RAISE WARNING '⚠️  Foreign key page_id peut ne pas être nommée comme attendu';
    END IF;
END $$;

-- Afficher la structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sections'
ORDER BY ordinal_position;
