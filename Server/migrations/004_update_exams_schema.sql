-- server/migrations/004_update_exams_schema.sql

-- Seeding exam_types with Internal and External
INSERT INTO exam_types (type_name) 
VALUES ('Internal'), ('External')
ON CONFLICT DO NOTHING;

-- Expanding the exams table to include detailed academic context
ALTER TABLE exams ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES master_departments(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS program_id INTEGER REFERENCES programs(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES master_academic_years(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id);
