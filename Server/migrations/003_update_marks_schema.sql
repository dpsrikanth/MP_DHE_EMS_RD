-- Add enrollment_number and department_id to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_number VARCHAR(100) UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES master_departments(id);

-- Update marks table for 60/40 split and HOD approval workflow
ALTER TABLE marks ADD COLUMN IF NOT EXISTS internal_marks DECIMAL(5,2);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS external_marks DECIMAL(5,2);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS total_marks DECIMAL(5,2);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
ALTER TABLE marks ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES teachers(id);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS hod_id INTEGER REFERENCES teachers(id);
ALTER TABLE marks ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES master_academic_years(id);

-- Since marks_obtained and max_marks might already exist, we can keep them for legacy or compute them.
-- For 60/40, max_marks could be 100, and marks_obtained = total_marks.
