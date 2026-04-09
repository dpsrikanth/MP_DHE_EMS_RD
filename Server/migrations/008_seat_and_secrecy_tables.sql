-- Migration to add Seat Allocation and Post-Exam Secrecy Tracking Tables

-- Table for mapping enrolled students to specific seats inside Examination Halls
CREATE TABLE IF NOT EXISTS seat_allocations (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    hall_id INTEGER REFERENCES examination_halls(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Prevent assigning the same seat twice in the same hall for the same exam
    UNIQUE(exam_id, hall_id, seat_number),
    -- Prevent assigning the same student to multiple seats in the same exam
    UNIQUE(exam_id, student_id)
);

-- Table for Post-Exam Secrecy (Coding of Answer Sheets)
-- Replaces actual student identity with a fictitious code before external faculty evaluates it.
CREATE TABLE IF NOT EXISTS secrecy_codes (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    fictitious_code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Each student gets one unique code per exam-subject combination
    UNIQUE(exam_id, subject_id, student_id)
);
