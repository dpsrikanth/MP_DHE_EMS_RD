CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    password VARCHAR(255),
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colleges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    university_id INTEGER REFERENCES universities(id),
    address TEXT,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    duration_years INTEGER,
    university_id INTEGER REFERENCES universities(id),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS academic_years (
    id SERIAL PRIMARY KEY,
    year_name VARCHAR(100) NOT NULL,
    university_id INTEGER REFERENCES universities(id),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    semester_number INTEGER,
    program_id INTEGER REFERENCES programs(id),
    academic_year_id INTEGER REFERENCES academic_years(id),
    start_date DATE,
    end_date DATE,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    program_id INTEGER REFERENCES programs(id),
    semester_id INTEGER REFERENCES semesters(id),
    credits INTEGER,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    college_id INTEGER REFERENCES colleges(id),
    designation VARCHAR(100),
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    college_id INTEGER REFERENCES colleges(id),
    program_id INTEGER REFERENCES programs(id),
    current_semester_id INTEGER REFERENCES semesters(id),
    admission_year INTEGER,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exam_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    semester_id INTEGER REFERENCES semesters(id),
    college_id INTEGER REFERENCES colleges(id),
    exam_type INTEGER REFERENCES exam_types(id),
    exam_date DATE,
    status BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    subject_id INTEGER REFERENCES subjects(id),
    exam_id INTEGER REFERENCES exams(id),
    marks_obtained DECIMAL(5,2),
    max_marks DECIMAL(5,2)
);

-- Seed basic roles required for Controller (e.g., student, superAdmin, admin)
INSERT INTO roles (role_name) VALUES ('student'), ('admin'), ('superAdmin') ON CONFLICT DO NOTHING;
