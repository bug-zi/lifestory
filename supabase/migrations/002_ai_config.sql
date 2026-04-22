-- ============================================================================
-- Migration: 002_ai_config
-- Description: Add AI configuration column to profiles for user-configured LLM providers
-- Supported providers: deepseek, doubao, zhipu, qwen, chatgpt
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{
  "provider": "deepseek",
  "api_key": "",
  "model": "deepseek-chat"
}'::jsonb;

-- Allow users to update their own ai_config (already covered by existing RLS policy
-- "Users can update own profile", but add a specific policy for clarity)
