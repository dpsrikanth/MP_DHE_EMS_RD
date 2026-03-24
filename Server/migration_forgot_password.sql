-- Run this in your database to add the forgot password columns to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
