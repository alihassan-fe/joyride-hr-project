-- Create outbox table for email notifications and general messaging
-- This table is used by the user notification system for password reset and welcome emails

BEGIN;

-- Create the outbox table for general notifications (emails, etc.)
CREATE TABLE IF NOT EXISTS public.outbox (
  id           BIGSERIAL PRIMARY KEY,
  type         TEXT NOT NULL,                 -- e.g., 'email', 'sms', 'notification'
  subject      TEXT NOT NULL,
  recipients   TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  html_content TEXT,                          -- HTML content for emails
  text_content TEXT,                          -- Plain text content
  status       TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,                         -- Error message if failed
  sent_at      TIMESTAMPTZ,                   -- When the message was sent
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outbox_status ON public.outbox (status);
CREATE INDEX IF NOT EXISTS idx_outbox_type ON public.outbox (type);
CREATE INDEX IF NOT EXISTS idx_outbox_created_at ON public.outbox (created_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_outbox_updated_at ON public.outbox;
CREATE TRIGGER trigger_update_outbox_updated_at
  BEFORE UPDATE ON public.outbox
  FOR EACH ROW
  EXECUTE FUNCTION update_outbox_updated_at();

COMMIT;

-- Verification query (optional)
-- SELECT to_regclass('public.outbox') AS outbox_table;
