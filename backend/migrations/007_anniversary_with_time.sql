-- Migration 007: Allow anniversary to include the exact time, not just the date.
--
-- Reported: users want to enter the exact time they first met, not just the
-- date. The home screen also needs to show a live "X years, Y months, Z days,
-- H hours, M minutes, S seconds together" ticker — which requires second-level
-- precision.
--
-- Approach: keep `anniversary_date DATE` for backward-compatibility, add a new
-- `anniversary_at TIMESTAMPTZ` for the precise instant. Backfill existing rows
-- by treating the date as midnight UTC.

ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS anniversary_at TIMESTAMPTZ;

-- Backfill: anniversary_date -> anniversary_at (midnight UTC)
UPDATE public.couples
SET anniversary_at = anniversary_date::TIMESTAMPTZ
WHERE anniversary_at IS NULL
  AND anniversary_date IS NOT NULL;
