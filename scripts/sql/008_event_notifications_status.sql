-- Safely enhance event_notifications to track sending results
ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS message_id TEXT;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

ALTER TABLE public.event_notifications
  ADD COLUMN IF NOT EXISTS error TEXT;
