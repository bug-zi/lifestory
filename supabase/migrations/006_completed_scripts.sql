-- ============================================================================
-- Migration: 006_completed_scripts
-- Description: Track scripts user has completed reading in daily mode
-- Created: 2026-04-25
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own completed_scripts" ON public.completed_scripts;
DROP POLICY IF EXISTS "Users can insert own completed_scripts" ON public.completed_scripts;
DROP TABLE IF EXISTS public.completed_scripts CASCADE;

-- ============================================================================
-- COMPLETED_SCRIPTS TABLE
-- ============================================================================
CREATE TABLE public.completed_scripts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    script_id       UUID            NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
    completed_at    TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, script_id)
);

CREATE INDEX idx_completed_scripts_user_id ON public.completed_scripts(user_id);
CREATE INDEX idx_completed_scripts_script_id ON public.completed_scripts(script_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.completed_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own completed_scripts"
    ON public.completed_scripts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed_scripts"
    ON public.completed_scripts FOR INSERT
    WITH CHECK (auth.uid() = user_id);
