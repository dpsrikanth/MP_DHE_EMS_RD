-- Migration to add multi-tenancy support for College Admins and Department mapping

-- 1. Add college_id to users to bind an admin to a specific college
ALTER TABLE users ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id);

-- 2. Add department_id to policy_program_semesters mapping
ALTER TABLE policy_program_semesters ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES master_departments(id);
ALTER TABLE policy_program_semesters ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id);

-- 3. Add department_id to policy_program_subjects mapping
ALTER TABLE policy_program_subjects ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES master_departments(id);
ALTER TABLE policy_program_subjects ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id);

-- 4. Add department_id to internal_marks_structure
ALTER TABLE internal_marks_structure ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES master_departments(id);
