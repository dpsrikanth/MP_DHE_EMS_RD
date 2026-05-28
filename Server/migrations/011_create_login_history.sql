-- 011_create_login_history.sql
-- Migration to add login_history table for tracking user login events
CREATE TABLE IF NOT EXISTS public.login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' -- could be SUCCESS, FAILED, etc.
);

-- Index for fast lookup by user and time
CREATE INDEX IF NOT EXISTS idx_login_history_user_time ON public.login_history (user_id, login_time DESC);
