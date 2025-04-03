export type BowelMovement = {
  id?: string;
  timestamp: string;
  location: 'Home' | 'Hotel' | 'Other';
  type: 'Small hard lumps' | 'Hard sausage' | 'Sausage with cracks' | 'Smooth & soft sausage' | 'Soft pieces' | 'Fluffy pieces' | 'Watery';
  speed: 'Fast' | 'Slow';
  amount: 'Little' | 'Normal' | 'Monstrous';
  notes?: string;
  created_at?: string;
}; 