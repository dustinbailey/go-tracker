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
ALTER TABLE gos ENABLE ROW LEVEL SECURITY;

-- Remove the old permissive policy if it exists
DROP POLICY IF EXISTS "Allow all operations" ON gos;

-- Allow anyone to read (for Cloudflare worker and dashboard)
CREATE POLICY "Allow public read access" ON gos 
  FOR SELECT 
  USING (true);

-- Restrict INSERT to authenticated requests only
-- This will block anonymous inserts while allowing your app to work
CREATE POLICY "Allow authenticated inserts only" ON gos 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Restrict updates to service role only
CREATE POLICY "Restrict updates to service role" ON gos 
  FOR UPDATE 
  USING (auth.role() = 'service_role');

-- Restrict deletes to service role only
CREATE POLICY "Restrict deletes to service role" ON gos 
  FOR DELETE 
  USING (auth.role() = 'service_role'); 