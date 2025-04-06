export type BowelMovement = {
  id?: string;
  timestamp: string;
  location: 'Home' | 'Hotel' | 'Other';
  type: string;
  speed: 'Fast' | 'Slow';
  amount: 'Little' | 'Normal' | 'Monstrous';
  notes?: string;
  duration_from_last_hours?: number;
  day_of_week?: number;
  hour_of_day?: number;
  created_at?: string;
}; 