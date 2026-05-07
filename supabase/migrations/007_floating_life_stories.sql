-- ============================================================================
-- Migration: 007_floating_life_stories
-- Description: "浮生记" emotional stories section
-- Created: 2026-05-06
-- ============================================================================

-- ============================================================================
-- FLOATING_LIFE_STORIES TABLE
-- Stores pre-written emotional stories (historical, literary, folk, AI-original)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.floating_life_stories (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT            NOT NULL,
    subtitle        TEXT,
    content         TEXT            NOT NULL,
    source          TEXT            NOT NULL CHECK (source IN ('现代言情', '文学经典', '民间传说', 'AI原创')),
    era             TEXT,
    mood            TEXT,
    tags            TEXT[]          DEFAULT '{}',
    word_count      INT,
    cover_image     TEXT,
    author          TEXT,
    is_featured     BOOLEAN         DEFAULT FALSE,
    sort_order      INT             DEFAULT 0,
    view_count      INT             DEFAULT 0,
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_floating_life_stories_source ON public.floating_life_stories(source);
CREATE INDEX IF NOT EXISTS idx_floating_life_stories_era ON public.floating_life_stories(era);
CREATE INDEX IF NOT EXISTS idx_floating_life_stories_featured ON public.floating_life_stories(is_featured);

-- ============================================================================
-- FLOATING_LIFE_READINGS TABLE
-- Tracks which stories a user has read
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.floating_life_readings (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    story_id        UUID            NOT NULL REFERENCES public.floating_life_stories(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_floating_life_readings_user_id ON public.floating_life_readings(user_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Stories: public read
ALTER TABLE public.floating_life_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "floating_life_stories are publicly readable"
    ON public.floating_life_stories FOR SELECT
    USING (true);

-- Readings: user-scoped
ALTER TABLE public.floating_life_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own floating_life_readings"
    ON public.floating_life_readings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own floating_life_readings"
    ON public.floating_life_readings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own floating_life_readings"
    ON public.floating_life_readings FOR DELETE
    USING (auth.uid() = user_id);
