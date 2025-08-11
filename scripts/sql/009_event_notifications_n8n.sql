-- Ensure event_notifications exists and has required columns for n8n workflow logging

CREATE TABLE IF NOT EXISTS public.event_notifications (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL, -- e.g., 'n8n', 'email'
  subject      TEXT NOT NULL,
  recipients   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  status       TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed
  message_id   TEXT,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at      TIMESTAMPTZ
);

-- Make script idempotent for subsequent runs
ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS error TEXT,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recipients TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_event_notifications_created_at ON public.event_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON public.event_notifications (event_id);
