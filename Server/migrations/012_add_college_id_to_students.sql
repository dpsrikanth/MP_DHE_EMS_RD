-- Migration 012: Give students a real FK to colleges.
--
-- Background: students are currently linked to colleges by matching the free-text
-- column students."collageName" against colleges.name with ILIKE. That is fragile
-- (typos, punctuation, renamed colleges) and blocks a clean integration with Fedena,
-- where we need a stable key per record.
--
-- This migration is ADDITIVE and non-destructive:
--   * adds students.college_id (nullable FK) and an index
--   * backfills it via the existing fuzzy name match (best effort)
--   * leaves "collageName" in place so existing queries keep working
--
-- Follow-up (separate, reviewed change): repoint the ~20 ILIKE joins onto college_id,
-- then make the column NOT NULL once backfill + data clean-up is verified.
--
-- SAFE TO RE-RUN: every statement is idempotent.

-- 1. Add the FK column (nullable for now).
ALTER TABLE students ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id);

-- 2. Index it for the joins that will use it.
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students(college_id);

-- 3. Best-effort backfill from the legacy free-text name.
--    Exact (case-insensitive) match first.
UPDATE students s
SET college_id = c.id
FROM colleges c
WHERE s.college_id IS NULL
  AND s."collageName" IS NOT NULL
  AND TRIM(s."collageName") ILIKE TRIM(c.name);

-- 4. Fall back to punctuation-insensitive match for the rest
--    (e.g. "St. Xaviers" vs "St Xaviers").
UPDATE students s
SET college_id = c.id
FROM colleges c
WHERE s.college_id IS NULL
  AND s."collageName" IS NOT NULL
  AND REPLACE(REPLACE(TRIM(s."collageName"), '.', ''), '  ', ' ')
      ILIKE REPLACE(REPLACE(TRIM(c.name), '.', ''), '  ', ' ');

-- 5. Surface anything still unmatched so it can be cleaned up by hand.
--    (Reported via NOTICE; does not fail the migration.)
DO $$
DECLARE unmatched INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmatched
  FROM students
  WHERE college_id IS NULL AND "collageName" IS NOT NULL;
  IF unmatched > 0 THEN
    RAISE NOTICE '012: % student(s) could not be auto-matched to a college and need manual review.', unmatched;
  END IF;
END $$;
