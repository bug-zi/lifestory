-- ============================================================================
-- Migration: 002_read_later
-- Description: Add "Read Later" functionality for DIY scripts
-- Created: 2026-04-21
-- ============================================================================

-- Drop policy if exists
DROP POLICY IF EXISTS "Users can read own read_later" ON public.read_later;
DROP POLICY IF EXISTS "Users can insert own read_later" ON public.read_later;
DROP POLICY IF EXISTS "Users can delete own read_later" ON public.read_later;

-- Drop table if exists
DROP TABLE IF EXISTS public.read_later CASCADE;

-- ============================================================================
-- READ_LATER TABLE
-- ============================================================================
CREATE TABLE public.read_later (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    script_id       UUID            NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
    saved_at        TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

-- Index for performance
CREATE INDEX idx_read_later_user_id ON public.read_later(user_id);
CREATE INDEX idx_read_later_saved_at ON public.read_later(saved_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.read_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own read_later"
    ON public.read_later FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read_later"
    ON public.read_later FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own read_later"
    ON public.read_later FOR DELETE
    USING (auth.uid() = user_id);
