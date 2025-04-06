-- Create the gos table
CREATE TABLE IF NOT EXISTS gos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP NOT NULL DEFAULT now(),
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  speed TEXT NOT NULL,
  amount TEXT NOT NULL,
  notes TEXT,
  duration_from_last_hours NUMERIC,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  created_at TIMESTAMP NOT NULL DEFAULT now() -- Stored in UTC
);

-- Enable Row Level Security (RLS)
-- ALTER TABLE gos ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for now)
-- Later, this can be modified to restrict access by user if needed
CREATE POLICY "Allow all operations" ON gos FOR ALL USING (true); 