-- ============================================================================
-- Migration: 015_daily_fortune
-- Description: 今日命运签 - 每日签文表
-- ============================================================================

CREATE TABLE public.daily_fortunes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fortune_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    fortune_text  TEXT NOT NULL,
    source_title  TEXT,
    source_id     UUID REFERENCES public.scripts(id),
    shared        BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, fortune_date)
);

-- Indexes
CREATE INDEX idx_daily_fortunes_user_date ON public.daily_fortunes(user_id, fortune_date);

-- RLS
ALTER TABLE public.daily_fortunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own fortunes"
    ON public.daily_fortunes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fortunes"
    ON public.daily_fortunes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fortunes"
    ON public.daily_fortunes FOR UPDATE
    USING (auth.uid() = user_id);
