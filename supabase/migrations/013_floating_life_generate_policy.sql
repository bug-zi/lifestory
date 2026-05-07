-- ============================================================================
-- Migration: 013_floating_life_generate_policy
-- Description: Allow authenticated users to INSERT AI-generated stories
-- Created: 2026-05-07
-- ============================================================================

-- Allow authenticated users to insert stories (for AI generation feature)
CREATE POLICY "Authenticated users can insert floating_life_stories"
    ON public.floating_life_stories FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
