-- Migration: Create college_notifications table for correction workflow
CREATE TABLE IF NOT EXISTS college_notifications (
    id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(id),
    subject_id INTEGER NOT NULL,
    section VARCHAR(10),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_college_notifications_college ON college_notifications(college_id);
CREATE INDEX IF NOT EXISTS idx_college_notifications_unread ON college_notifications(college_id, read_at) WHERE read_at IS NULL;
