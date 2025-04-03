-- Create the bowel_movements table
CREATE TABLE IF NOT EXISTS bowel_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT NOT NULL CHECK (location IN ('Home', 'Hotel', 'Other')),
  type TEXT NOT NULL CHECK (
    type IN (
      'Small hard lumps', 
      'Hard sausage', 
      'Sausage with cracks', 
      'Smooth & soft sausage', 
      'Soft pieces', 
      'Fluffy pieces', 
      'Watery'
    )
  ),
  speed TEXT NOT NULL CHECK (speed IN ('Fast', 'Slow')),
  amount TEXT NOT NULL CHECK (amount IN ('Little', 'Normal', 'Monstrous')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE bowel_movements ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for now)
-- Later, this can be modified to restrict access by user if needed
CREATE POLICY "Allow all operations" ON bowel_movements FOR ALL USING (true); 