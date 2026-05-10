-- ============================================================================
-- Migration: 013_floating_life_archive
-- Description: Add archive support to floating life stories
-- Created: 2026-05-07
-- ============================================================================

ALTER TABLE public.floating_life_stories
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
