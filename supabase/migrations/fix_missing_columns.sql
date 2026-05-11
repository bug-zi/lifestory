-- ============================================================================
-- Fix: Add missing columns for floating_life_stories
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Created: 2026-05-12
-- ============================================================================

-- 1. Add archive columns (from migration 013)
ALTER TABLE public.floating_life_stories
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2. Add generate policy (from migration 013)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can insert floating_life_stories'
  ) THEN
    CREATE POLICY "Authenticated users can insert floating_life_stories"
        ON public.floating_life_stories FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
