-- ============================================
-- MIGRATION 008: Add Width to Groups
-- Description: Ajoute une colonne width pour définir la largeur d'un groupe
-- Author: AI Assistant
-- Date: 2026-01-08
-- ============================================

-- Ajouter la colonne width avec valeur par défaut '100%'
ALTER TABLE groups ADD COLUMN IF NOT EXISTS width VARCHAR(10) DEFAULT '100%';

-- Contrainte de validation pour les valeurs permises
ALTER TABLE groups ADD CONSTRAINT check_group_width 
    CHECK (width IN ('25%', '33%', '50%', '66%', '75%', '100%'));

-- Commentaire pour documentation
COMMENT ON COLUMN groups.width IS 'Largeur du groupe: 25%, 33%, 50%, 66%, 75%, 100%';

-- Vérification
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'groups' AND column_name = 'width'
    ) THEN
        RAISE NOTICE '✅ Colonne width ajoutée à groups';
    ELSE
        RAISE EXCEPTION '❌ Erreur: Colonne width non ajoutée';
    END IF;
END $$;
