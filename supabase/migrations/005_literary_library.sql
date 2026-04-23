-- ============================================================================
-- Migration: 005_literary_library
-- Description: Add "Literary Library" for saving selected quotes from scripts
-- Created: 2026-04-23
-- ============================================================================

-- Drop table if exists (cascades policies too)
DROP TABLE IF EXISTS public.literary_library CASCADE;

-- ============================================================================
-- LITERARY_LIBRARY TABLE
-- ============================================================================
CREATE TABLE public.literary_library (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    script_id       UUID            REFERENCES public.scripts(id) ON DELETE SET NULL,
    content         TEXT            NOT NULL,
    script_title    TEXT,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_literary_library_user_id ON public.literary_library(user_id);
CREATE INDEX idx_literary_library_created_at ON public.literary_library(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.literary_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own literary_library"
    ON public.literary_library FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own literary_library"
    ON public.literary_library FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own literary_library"
    ON public.literary_library FOR DELETE
    USING (auth.uid() = user_id);
