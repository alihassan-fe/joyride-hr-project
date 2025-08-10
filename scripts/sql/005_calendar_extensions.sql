-- Extend calendar_events with richer fields and create an Outbox for notifications.

-- 1) New columns for details and metadata
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Outbox table to record notifications (email for now)
CREATE TABLE IF NOT EXISTS event_notifications (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT REFERENCES calendar_events(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,                 -- e.g., 'email'
  subject      TEXT NOT NULL,
  recipients   TEXT[] NOT NULL DEFAULT '{}',
  payload      JSONB NOT NULL,                -- { html, ics, event }
  status       TEXT NOT NULL DEFAULT 'queued',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_event_notifications_created_at ON event_notifications(created_at DESC);
