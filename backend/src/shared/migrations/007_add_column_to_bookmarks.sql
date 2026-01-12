-- Migration 007: Add column field to bookmarks table
-- This enables independent columns within groups

-- Add column field (1-based index, default to column 1)
ALTER TABLE bookmarks
ADD COLUMN "column" INTEGER NOT NULL DEFAULT 1;

-- Update existing bookmarks: distribute them across columns based on position
-- For a group with column_count=3 and 9 bookmarks:
--   positions 0,1,2 → column 1 (positions 0,1,2)
--   positions 3,4,5 → column 2 (positions 0,1,2)
--   positions 6,7,8 → column 3 (positions 0,1,2)
DO $$
DECLARE
  rec RECORD;
  group_column_count INTEGER;
  new_column INTEGER;
  new_position INTEGER;
BEGIN
  FOR rec IN
    SELECT b.id, b.group_id, b.position, g.column_count
    FROM bookmarks b
    INNER JOIN groups g ON b.group_id = g.id
    ORDER BY b.group_id, b.position
  LOOP
    group_column_count := rec.column_count;

    -- Calculate which column this bookmark should be in (1-based)
    -- Using modulo to distribute: position 0,3,6,9 → col 1 | 1,4,7,10 → col 2 | 2,5,8,11 → col 3
    new_column := (rec.position % group_column_count) + 1;

    -- Calculate new position within the column (0-based)
    new_position := rec.position / group_column_count;

    UPDATE bookmarks
    SET "column" = new_column, position = new_position
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Add index for efficient queries by group + column
CREATE INDEX idx_bookmarks_group_column ON bookmarks(group_id, "column", position);

-- Add comment
COMMENT ON COLUMN bookmarks."column" IS 'Column number (1-based) within the group. Each group can have 1-6 columns.';
COMMENT ON COLUMN bookmarks.position IS 'Position (0-based) within the column. Lower values appear first.';
