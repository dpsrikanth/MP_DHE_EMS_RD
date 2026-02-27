-- ============================================================
-- Migration: Add Audit Columns to ALL Tables
-- created_at  : when the row was first inserted
-- created_by  : user id who created it (FK to users.id)
-- updated_at  : when the row was last modified
-- updated_by  : user id who last modified it (FK to users.id)
--
-- Junction/mapping tables only get created_at & created_by
-- since rows are inserted/deleted, never updated.
-- ============================================================

-- Helper: IF NOT EXISTS isn't available for ADD COLUMN in older PG,
-- so we wrap each in a DO block to skip if column already exists.

-- ===================== ENTITY TABLES (4 audit cols) =====================

-- 1. users
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 2. universities
ALTER TABLE universities ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE universities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 3. colleges
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 4. programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 5. academic_years
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 6. semesters
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 7. subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 8. roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 9. teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 10. students
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 11. exams
ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 12. exam_types
ALTER TABLE exam_types ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE exam_types ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE exam_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE exam_types ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 13. marks
ALTER TABLE marks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE marks ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- ===================== MASTER TABLES (4 audit cols) =====================

-- 14. master_policies
ALTER TABLE master_policies ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE master_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_policies ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);
-- created_at already exists

-- 15. master_programs
ALTER TABLE master_programs ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE master_programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_programs ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 16. master_subjects
ALTER TABLE master_subjects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE master_subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_subjects ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 17. master_academic_years
ALTER TABLE master_academic_years ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE master_academic_years ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_academic_years ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 18. master_semesters
ALTER TABLE master_semesters ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE master_semesters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_semesters ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- 19. master_roles
ALTER TABLE master_roles ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);
ALTER TABLE master_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE master_roles ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id);

-- ========= JUNCTION / MAPPING TABLES (2 audit cols only) =========

-- 20. university_master_policies
ALTER TABLE university_master_policies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE university_master_policies ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 21. university_master_programs
ALTER TABLE university_master_programs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE university_master_programs ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 22. university_master_subjects
ALTER TABLE university_master_subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE university_master_subjects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 23. university_master_academic_years
ALTER TABLE university_master_academic_years ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE university_master_academic_years ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 24. university_master_semesters
ALTER TABLE university_master_semesters ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE university_master_semesters ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 25. college_master_policies
ALTER TABLE college_master_policies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE college_master_policies ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 26. college_master_programs
ALTER TABLE college_master_programs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE college_master_programs ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 27. college_master_subjects
ALTER TABLE college_master_subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE college_master_subjects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 28. college_master_academic_years
ALTER TABLE college_master_academic_years ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE college_master_academic_years ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- 29. college_master_semesters
ALTER TABLE college_master_semesters ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE college_master_semesters ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id);

-- ===================== AUTO-UPDATE TRIGGER =====================
-- This trigger automatically sets updated_at = NOW() on every UPDATE.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply auto-update trigger to all entity & master tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'users','universities','colleges','programs','academic_years',
            'semesters','subjects','roles','teachers','students',
            'exams','exam_types','marks',
            'master_policies','master_programs','master_subjects',
            'master_academic_years','master_semesters','master_roles'
        ])
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            tbl, tbl
        );
    END LOOP;
END;
$$;

SELECT 'Audit columns and triggers added successfully!' AS result;
