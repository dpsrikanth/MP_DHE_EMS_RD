-- Migration to create student_semester_payments table
CREATE TABLE IF NOT EXISTS student_semester_payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES master_semesters(id),
    academic_year_id INTEGER REFERENCES master_academic_years(id),
    amount DECIMAL(10, 2),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) DEFAULT 'Paid', -- e.g., 'Paid', 'Pending', 'Partial'
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_student_semester_payments_student_id ON student_semester_payments(student_id);
