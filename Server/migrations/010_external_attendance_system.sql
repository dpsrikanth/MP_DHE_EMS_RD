-- Migration to add Invigilator Assignments and External Exam Attendance

-- Maps a teacher (user) to a specific hall for a specific exam
CREATE TABLE IF NOT EXISTS hall_invigilators (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    hall_id INTEGER REFERENCES examination_halls(id) ON DELETE CASCADE,
    faculty_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, hall_id, faculty_user_id)
);

-- Tracks the attendance of students in the external exam
CREATE TABLE IF NOT EXISTS external_exam_attendance (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    hall_id INTEGER REFERENCES examination_halls(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Present', -- 'Present', 'Absent', 'UFM'
    marked_by INTEGER REFERENCES users(id), -- The invigilator who marked it
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, hall_id, student_id)
);
