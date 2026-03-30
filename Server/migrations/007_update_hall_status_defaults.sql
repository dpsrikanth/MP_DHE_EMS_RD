-- Update the status column in examination_halls table
ALTER TABLE examination_halls ALTER COLUMN status SET DEFAULT 'Draft';
UPDATE examination_halls SET status = 'Draft' WHERE status IS NULL OR status = 'Active';
