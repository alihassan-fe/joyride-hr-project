-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pto','holiday','interview')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_timerange ON calendar_events (start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events (type);

-- PTO Requests
CREATE TABLE IF NOT EXISTS pto_requests (
  id SERIAL PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  manager_id TEXT,
  manager_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pto_requests_status ON pto_requests (status);
CREATE INDEX IF NOT EXISTS idx_pto_requests_date ON pto_requests (start_date, end_date);

-- Broadcasts
CREATE TABLE IF NOT EXISTS broadcasts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON broadcasts (created_at DESC);
