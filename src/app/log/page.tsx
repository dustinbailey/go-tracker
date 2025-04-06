'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import type { BowelMovement } from '@/lib/types';

export default function LogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BowelMovement>({
    timestamp: new Date().toISOString().substring(0, 16),
    location: 'Home',
    type: 'Smooth & soft sausage', 
    speed: 'Fast',
    amount: 'Normal',
    notes: '',
    duration_from_last_hours: undefined,
    day_of_week: new Date().getDay(),
    hour_of_day: new Date().getHours()
  });

  // Initialize datetime with proper local time including timezone
  useEffect(() => {
    // Format the current local date time in the format required by datetime-local input
    const now = new Date();
    const localISOString = new Date(
      now.getTime() - (now.getTimezoneOffset() * 60000)
    ).toISOString().substring(0, 16);
    
    setFormData(prev => ({
      ...prev,
      timestamp: localISOString,
      day_of_week: now.getDay(),
      hour_of_day: now.getHours()
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'timestamp') {
      // When timestamp changes, also update day_of_week and hour_of_day
      const date = new Date(value);
      setFormData({
        ...formData,
        [name]: value,
        day_of_week: date.getDay(),
        hour_of_day: date.getHours()
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle direct value changes (for tabs and sliders)
  const handleValueChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the last movement to calculate duration_from_last_hours
      const { data: lastMovements } = await supabase
        .from('gos')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      let submitData = { ...formData };
      
      // Use standard JavaScript Date handling with proper timezone information
      const dateObj = new Date(formData.timestamp);
      
      // Log timezone information for debugging
      console.log('Browser timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
      console.log('Date from input:', dateObj.toString());
      console.log('UTC hours:', dateObj.getUTCHours());
      console.log('Local hours:', dateObj.getHours());
      console.log('Timezone offset (minutes):', dateObj.getTimezoneOffset());
      
      // Use the native JavaScript toISOString method, which creates a UTC-based ISO string
      submitData.timestamp = dateObj.toISOString();
      
      console.log('Final timestamp being sent to Supabase:', submitData.timestamp);
      
      // Calculate duration from last if available
      if (lastMovements && lastMovements.length > 0) {
        const lastTimestamp = new Date(lastMovements[0].timestamp);
        const currentTimestamp = dateObj;
        const hoursDiff = (currentTimestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
        submitData.duration_from_last_hours = Math.round(hoursDiff * 100) / 100; // Round to 2 decimal places
      }

      const { error } = await supabase
        .from('gos')
        .insert([submitData]);

      if (error) throw error;
      
      alert('Movement logged successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error logging movement:', error);
      alert('Failed to log movement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Type options with visual representations
  const typeOptions = [
    { value: 'Small hard lumps', label: '1', description: 'Small Hard Lumps (constipation)', visual: '💩' },
    { value: 'Hard sausage', label: '2', description: 'Hard Sausage (mild constipation)', visual: '🍌' },
    { value: 'Sausage with cracks', label: '3', description: 'Sausage with Cracks on Surface', visual: '🥖' },
    { value: 'Smooth & soft sausage', label: '4', description: 'Smooth & Soft Sausage', visual: '🌭' },
    { value: 'Soft pieces', label: '5', description: 'Soft Pieces', visual: '💩' },
    { value: 'Fluffy pieces', label: '6', description: 'Fluffy Pieces (mild diarrhea)', visual: '☁️' },
    { value: 'Watery', label: '7', description: 'Watery (diarrhea)', visual: '💦' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Go</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Date & Time</label>
            <div className="relative">
              <input
                type="datetime-local"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Location</label>
            <div className="flex w-full rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleValueChange('location', 'Home')}
                className={`relative flex-1 py-4 text-center ${
                  formData.location === 'Home' 
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleValueChange('location', 'Hotel')}
                className={`relative flex-1 py-4 text-center border-l border-gray-300 ${
                  formData.location === 'Hotel' 
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Hotel
              </button>
              <button
                type="button"
                onClick={() => handleValueChange('location', 'Other')}
                className={`relative flex-1 py-4 text-center border-l border-gray-300 ${
                  formData.location === 'Other' 
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Other
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Type</label>
          <div className="mb-2 text-center italic text-sm">{typeOptions.find(option => option.value === formData.type)?.description || 'Smooth and soft sausage'}</div>
          <div className="flex w-full rounded-lg overflow-hidden">
            {typeOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleValueChange('type', option.value)}
                className={`relative flex-1 py-4 text-center ${index > 0 ? 'border-l border-gray-300' : ''} ${
                  formData.type === option.value
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {typeOptions.map((option) => (
              <div key={option.value} className="flex-1 text-center text-2xl">
                {option.visual}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Speed</label>
          <div className="flex w-full rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => handleValueChange('speed', 'Slow')}
              className={`relative flex-1 py-4 text-center ${
                formData.speed === 'Slow' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Slow
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('speed', 'Fast')}
              className={`relative flex-1 py-4 text-center border-l border-gray-300 ${
                formData.speed === 'Fast' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Fast
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Amount</label>
          <div className="flex w-full rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => handleValueChange('amount', 'Little')}
              className={`relative flex-1 py-4 text-center ${
                formData.amount === 'Little' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Little
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('amount', 'Normal')}
              className={`relative flex-1 py-4 text-center border-l border-gray-300 ${
                formData.amount === 'Normal' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('amount', 'Monstrous')}
              className={`relative flex-1 py-4 text-center border-l border-gray-300 ${
                formData.amount === 'Monstrous' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-4 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Monstrous
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-3 border rounded-md h-32"
            placeholder="e.g. second wave, pungent smell, greenish, clean wipe"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Submitting...' : 'Save'}
        </button>
      </form>
    </div>
  );
} 