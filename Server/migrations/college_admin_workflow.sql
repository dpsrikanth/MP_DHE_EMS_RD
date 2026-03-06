-- college_admin_workflow.sql

-- 1. Add new role
INSERT INTO roles (role_name) VALUES ('college_admin') ON CONFLICT (role_name) DO NOTHING;

-- 2. Policy Mapping Tables
CREATE TABLE IF NOT EXISTS policy_program_semesters (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES master_policies(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES master_programs(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    UNIQUE(policy_id, program_id, semester_id)
);

CREATE TABLE IF NOT EXISTS policy_program_subjects (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES master_policies(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES master_programs(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    UNIQUE(policy_id, program_id, semester_id, subject_id)
);

-- 3. Faculty Assignment Table
CREATE TABLE IF NOT EXISTS faculty_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES master_teachers(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES master_academic_years(id) ON DELETE CASCADE,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    section VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, subject_id, semester_id, academic_year_id, section)
);

-- 4. Internal Marks Structure Table
CREATE TABLE IF NOT EXISTS internal_marks_structure (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES master_policies(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES master_programs(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    component_name VARCHAR(100) NOT NULL, -- e.g., 'IA1', 'IA2', 'Assignment', 'Internal Theory', 'Internal Practical'
    max_marks DECIMAL(5,2) NOT NULL,
    passing_marks DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, policy_id, program_id, semester_id, subject_id, component_name)
);

-- 5. Marks Entry and Approval Tables
CREATE TABLE IF NOT EXISTS student_internal_marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES internal_marks_structure(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2),
    is_absent BOOLEAN DEFAULT FALSE,
    entered_by_faculty_id INTEGER REFERENCES master_teachers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, component_id)
);

CREATE TABLE IF NOT EXISTS marks_workflow_status (
    id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES master_academic_years(id) ON DELETE CASCADE,
    section VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Submitted', 'Verified', 'Approved', 'Locked'
    approved_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(college_id, subject_id, semester_id, academic_year_id, section)
);

-- 6. Audit Logs Table (if not exists)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- e.g., 'MARKS_ENTERED', 'MARKS_LOCKED', 'POLICY_CONFIGURED'
    entity_type VARCHAR(100), -- 'MARKS', 'POLICY', 'FACULTY_ASSIGNMENT'
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
