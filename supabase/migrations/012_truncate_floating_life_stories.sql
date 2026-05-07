-- ============================================================================
-- Migration: 012_truncate_floating_life_stories
-- Description: Clear all existing floating life stories (quality reset)
-- Created: 2026-05-07
-- ============================================================================

TRUNCATE TABLE public.floating_life_stories CASCADE;
