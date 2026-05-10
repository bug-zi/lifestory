-- ============================================================================
-- Migration: 014_interview_messages
-- Description: AI 人生面试官 - 对话消息表
-- ============================================================================

CREATE TABLE public.interview_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    script_id   UUID NOT NULL REFERENCES public.scripts(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interview_messages_user_script ON public.interview_messages(user_id, script_id);
CREATE INDEX idx_interview_messages_created ON public.interview_messages(created_at);

-- RLS
ALTER TABLE public.interview_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interviews"
    ON public.interview_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interviews"
    ON public.interview_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);
