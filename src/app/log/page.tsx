'use client';

import { useState } from 'react';
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
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('bowel_movements')
        .insert([formData]);

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

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Log a Movement</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input
              type="datetime-local"
              name="timestamp"
              value={formData.timestamp}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="Home">Home</option>
              <option value="Hotel">Hotel</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type (Bristol stool chart)</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="Small hard lumps">Small hard lumps (constipation)</option>
            <option value="Hard sausage">Hard sausage (mild constipation)</option>
            <option value="Sausage with cracks">Sausage with cracks on surface</option>
            <option value="Smooth & soft sausage">Smooth & soft sausage</option>
            <option value="Soft pieces">Soft pieces</option>
            <option value="Fluffy pieces">Fluffy pieces (mild diarrhea)</option>
            <option value="Watery">Watery (diarrhea)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Speed</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="speed"
                  value="Fast"
                  checked={formData.speed === 'Fast'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Fast
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="speed"
                  value="Slow"
                  checked={formData.speed === 'Slow'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Slow
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="amount"
                  value="Little"
                  checked={formData.amount === 'Little'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Little
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="amount"
                  value="Normal"
                  checked={formData.amount === 'Normal'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Normal
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="amount"
                  value="Monstrous"
                  checked={formData.amount === 'Monstrous'}
                  onChange={handleChange}
                  className="mr-2"
                />
                Monstrous
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded-md h-24"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Submitting...' : 'Save Movement'}
        </button>
      </form>
    </div>
  );
} 