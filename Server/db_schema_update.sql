-- Master Data Tables
CREATE TABLE IF NOT EXISTS master_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    duration_years INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_academic_years (
    id SERIAL PRIMARY KEY,
    year_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_semesters (
    id SERIAL PRIMARY KEY,
    semester_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_designations (
    id SERIAL PRIMARY KEY,

    designation_name VARCHAR(100) UNIQUE NOT NULL,

    designation_type VARCHAR(50), -- Teaching / Administrative

    level INT, -- hierarchy level (1 = highest)

    status VARCHAR(20) DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS master_departments (
    id SERIAL PRIMARY KEY,

    department_code VARCHAR(20) UNIQUE NOT NULL,
    department_name VARCHAR(150) NOT NULL,

    college_id INT NOT NULL REFERENCES colleges(id),

    hod_id INT NULL REFERENCES teachers(id),

    status VARCHAR(20) DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS master_teachers (
    id SERIAL PRIMARY KEY,

    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    employee_code VARCHAR(50) UNIQUE NOT NULL,

    designation_id INT NOT NULL REFERENCES master_designations(id),

    department_id INT NOT NULL REFERENCES master_departments(id),

    college_id INT NOT NULL REFERENCES colleges(id),

    qualification VARCHAR(255),

    experience_years INT,

    joining_date DATE,

    phone VARCHAR(20),

    address TEXT,

    status VARCHAR(20) DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: We already have a roles table in our DB config for Auth mapping.
-- To avoid conflicts, and since the user requestedRoles like 'CoE,HOD,Lecture,AsstLect,Pueon,Prof,AsstPro,ComputerOper'
-- we will update the existing roles or create master_roles depending on the required use case.
CREATE TABLE IF NOT EXISTS master_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- University Mapping Tables
CREATE TABLE IF NOT EXISTS university_master_policies (
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES master_policies(id) ON DELETE CASCADE,
    PRIMARY KEY (university_id, policy_id)
);

CREATE TABLE IF NOT EXISTS university_master_programs (
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES master_programs(id) ON DELETE CASCADE,
    PRIMARY KEY (university_id, program_id)
);

CREATE TABLE IF NOT EXISTS university_master_subjects (
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (university_id, subject_id)
);

CREATE TABLE IF NOT EXISTS university_master_academic_years (
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES master_academic_years(id) ON DELETE CASCADE,
    PRIMARY KEY (university_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS university_master_semesters (
    university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    PRIMARY KEY (university_id, semester_id)
);

-- College Mapping Tables
CREATE TABLE IF NOT EXISTS college_master_policies (
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES master_policies(id) ON DELETE CASCADE,
    PRIMARY KEY (college_id, policy_id)
);

CREATE TABLE IF NOT EXISTS college_master_programs (
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    program_id INTEGER REFERENCES master_programs(id) ON DELETE CASCADE,
    PRIMARY KEY (college_id, program_id)
);

CREATE TABLE IF NOT EXISTS college_master_subjects (
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (college_id, subject_id)
);

CREATE TABLE IF NOT EXISTS college_master_academic_years (
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    academic_year_id INTEGER REFERENCES master_academic_years(id) ON DELETE CASCADE,
    PRIMARY KEY (college_id, academic_year_id)
);

CREATE TABLE IF NOT EXISTS college_master_semesters (
    college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id) ON DELETE CASCADE,
    PRIMARY KEY (college_id, semester_id)
);

-- Seed Initial Data
INSERT INTO master_policies (name, description) VALUES
    ('NEP2020', 'National Education Policy 2020'),
    ('NEP2021', 'National Education Policy 2021 update'),
    ('XYZ', 'Previous Education Policy')
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_programs (name, duration_years) VALUES
    ('BSc', 3),
    ('BTech', 4),
    ('MCA', 2),
    ('MTech', 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO master_subjects (subject_code, name) VALUES
    ('MATH0123', 'Mathematics I'),
    ('PHY011', 'Physics I'),
    ('CHEM022', 'Chemistry I')
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO master_academic_years (year_name) VALUES
    ('2024-2025'),
    ('2025-2026'),
    ('2026-2027')
ON CONFLICT (year_name) DO NOTHING;

INSERT INTO master_semesters (semester_name) VALUES
    ('Semester 1'),
    ('Semester 2'),
    ('Semester 3'),
    ('Semester 4'),
    ('Semester 5'),
    ('Semester 6'),
    ('Semester 7'),
    ('Semester 8')
ON CONFLICT (semester_name) DO NOTHING;

INSERT INTO master_roles (role_name) VALUES
    ('CoE'),
    ('HOD'),
    ('Lecture'),
    ('AsstLect'),
    ('Pueon'),
    ('Prof'),
    ('AsstPro'),
    ('ComputerOper')
ON CONFLICT (role_name) DO NOTHING;
-- Add department and experience fields for teachers if they are missing
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS experience INTEGER; 