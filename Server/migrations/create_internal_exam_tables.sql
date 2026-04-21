-- Migration: Create Internal Exam Tables

CREATE TABLE IF NOT EXISTS internal_exam_rounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    college_id INTEGER REFERENCES colleges(id),
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS internal_exam_schedules (
    id SERIAL PRIMARY KEY,
    round_id INTEGER REFERENCES internal_exam_rounds(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES master_programs(id),
    semester_id INTEGER REFERENCES master_semesters(id),
    academic_year_id INTEGER REFERENCES master_academic_years(id),
    college_id INTEGER REFERENCES colleges(id),
    subject_id INTEGER REFERENCES master_subjects(id),
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(round_id, subject_id, college_id, semester_id)
);
