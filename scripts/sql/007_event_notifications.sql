-- Extends calendar_events safely and creates the event_notifications outbox.
-- Idempotent: safe to run multiple times.

BEGIN;

-- 1) Extend calendar_events with richer fields if missing
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS location text;
  -- NOTE: "meta" already exists in your DB, so we do not add it here.

-- 2) Create the outbox table for notifications (e.g., email invites)
CREATE TABLE IF NOT EXISTS public.event_notifications (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,                 -- e.g., 'email'
  subject      TEXT NOT NULL,
  recipients   TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  payload      JSONB NOT NULL,                -- arbitrary payload: { html, ics, event }
  status       TEXT NOT NULL DEFAULT 'queued',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful index for latest-first queries
CREATE INDEX IF NOT EXISTS idx_event_notifications_created_at
  ON public.event_notifications (created_at DESC);

COMMIT;

-- Verification helpers (optional; run manually if you want)
-- SELECT to_regclass('public.event_notifications') AS event_notifications_table;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name='calendar_events' ORDER BY ordinal_position;
