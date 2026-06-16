-- Booking + AI intake schema (Phase 1)

CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  slot_time TIMESTAMP NOT NULL UNIQUE,
  is_booked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  slot_id INTEGER REFERENCES slots(id),
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_sessions (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  initial_query TEXT NOT NULL,
  conversation JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_reports (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES intake_sessions(id),
  report_text TEXT NOT NULL,
  lead_score INTEGER,
  proposal_draft TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generate slots: next 10 weekdays, 10:00–16:00 inclusive start times (7 blocks/day = 70 slots).
INSERT INTO slots (slot_time)
SELECT day + make_interval(hours => hr)
FROM (
  SELECT d::date AS day
  FROM generate_series(CURRENT_DATE + 1, CURRENT_DATE + 30, INTERVAL '1 day') AS d
  WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
  ORDER BY d
  LIMIT 10
) weekdays
CROSS JOIN generate_series(10, 16) AS hr
ON CONFLICT (slot_time) DO NOTHING;
