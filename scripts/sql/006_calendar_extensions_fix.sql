-- Safe extension of calendar_events and creation of event_notifications outbox.
-- This script is idempotent and can be run multiple times.

BEGIN;

-- 1) Extend calendar_events with richer fields
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Outbox table to record notifications (e.g., email invites)
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,                 -- e.g., 'email'
  subject      TEXT NOT NULL,
  recipients   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  payload      JSONB NOT NULL,                -- { html, ics, event }
  status       TEXT NOT NULL DEFAULT 'queued',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful index for latest-first queries
CREATE INDEX IF NOT EXISTS idx_event_notifications_created_at
  ON public.event_notifications (created_at DESC);

COMMIT;

-- Optional quick sanity checks (uncomment to verify)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='calendar_events';
-- SELECT to_regclass('public.event_notifications') AS event_notifications_table;
