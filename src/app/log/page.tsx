'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import supabase from '@/lib/supabase';
import type { BowelMovement } from '@/lib/types';
import { createMovement, getLastMovement } from '@/app/actions/movements';

// Helper function to get local ISO string
const getLocalISOString = () => {
  const now = new Date();
  return new Date(
    now.getTime() - (now.getTimezoneOffset() * 60000)
  ).toISOString().substring(0, 16);
};

export default function LogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastRecordTime, setLastRecordTime] = useState<number | null>(null);
  const [formData, setFormData] = useState<BowelMovement>({
    timestamp: getLocalISOString(),
    location: 'Home',
    type: 'Smooth & soft sausage', 
    speed: 'Fast',
    amount: 'Normal',
    notes: '',
    duration_from_last_hours: undefined,
    day_of_week: new Date().getDay(),
    hour_of_day: new Date().getHours()
  });

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
      let submitData = { ...formData };
      
      // Format the type to include the number prefix
      const typeOption = typeOptions.find(option => option.value === formData.type);
      if (typeOption) {
        // Format according to requested examples
        if (formData.type === 'Sausage with cracks') {
          submitData.type = `${typeOption.label}: Sausage w/ cracks on surface`;
        } else {
          submitData.type = `${typeOption.label}: ${formData.type}`;
        }
      }
      
      // Use standard JavaScript Date handling
      const dateObj = new Date(formData.timestamp);
      
      // Format the timestamp as YYYY-MM-DD HH:MM:SS without timezone information
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      
      submitData.timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      
      // Call server action to create the movement
      const result = await createMovement(submitData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create movement');
      }
      
      // Success handling - reset form and show success indicator
      setSubmitted(true);
      // Reset form to initial state
      setFormData({
        timestamp: getLocalISOString(),
        location: 'Home',
        type: 'Smooth & soft sausage', 
        speed: 'Fast',
        amount: 'Normal',
        notes: '',
        duration_from_last_hours: undefined,
        day_of_week: new Date().getDay(),
        hour_of_day: new Date().getHours()
      });
      
      // Reset last record time to 0 after successful submission
      setLastRecordTime(0);
      
      // Reset success indicator after 2 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Error logging movement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to log movement: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Type options with visual representations
  const typeOptions = [
    { value: 'Small hard lumps', label: '1', description: 'Small Hard Lumps (constipation)', imagePath: '/images/types/type1.png' },
    { value: 'Hard sausage', label: '2', description: 'Hard Sausage (mild constipation)', imagePath: '/images/types/type2.png' },
    { value: 'Sausage with cracks', label: '3', description: 'Sausage with Cracks on Surface', imagePath: '/images/types/type3.png' },
    { value: 'Smooth & soft sausage', label: '4', description: 'Smooth & Soft Sausage', imagePath: '/images/types/type4.png' },
    { value: 'Soft pieces', label: '5', description: 'Soft Pieces', imagePath: '/images/types/type5.png' },
    { value: 'Fluffy pieces', label: '6', description: 'Fluffy Pieces (mild diarrhea)', imagePath: '/images/types/type6.png' },
    { value: 'Watery', label: '7', description: 'Watery (diarrhea)', imagePath: '/images/types/type7.png' },
  ];

  // Fetch the last record when component mounts
  useEffect(() => {
    const fetchLastRecord = async () => {
      const result = await getLastMovement();
      
      if (result.success && result.data) {
        const lastTimestamp = new Date(result.data.timestamp);
        const currentTime = new Date();
        const hoursDiff = (currentTime.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
        setLastRecordTime(Math.round(hoursDiff)); // Round to nearest whole number
      }
    };

    fetchLastRecord();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-xl font-bold">🚽 New Go</h1>
        {lastRecordTime !== null && (
          <p className="text-sm italic text-gray-600">
            {lastRecordTime} hours since last go
          </p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold mb-1">Date & Time</label>
            <div className="relative">
              <input
                type="datetime-local"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Location</label>
            <div className="flex w-full rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleValueChange('location', 'Home')}
                className={`relative flex-1 py-2 text-center ${
                  formData.location === 'Home' 
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-2 border-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleValueChange('location', 'Hotel')}
                className={`relative flex-1 py-2 text-center border-l border-gray-300 ${
                  formData.location === 'Hotel' 
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-2 border-white' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Hotel
              </button>
              <button
                type="button"
                onClick={() => handleValueChange('location', 'Other')}
                className={`relative flex-1 py-2 text-center border-l border-gray-300 ${
                  formData.location === 'Other' 
                    ? 'bg-blue-500 text-white font-bold shadow-inner border-b-2 border-white' 
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
          <div className="mb-1 text-center italic text-sm">{typeOptions.find(option => option.value === formData.type)?.description || 'Smooth and soft sausage'}</div>
          <div className="flex w-full rounded-lg overflow-hidden">
            {typeOptions.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleValueChange('type', option.value)}
                className={`relative flex-1 py-2 text-center ${index > 0 ? 'border-l border-gray-300' : ''} ${
                  formData.type === option.value
                    ? option.label === '1' || option.label === '7'
                      ? 'bg-red-800 text-white font-bold shadow-inner border-b-2 border-white'
                      : option.label === '2' || option.label === '6'
                        ? 'bg-red-500 text-white font-bold shadow-inner border-b-2 border-white'
                        : 'bg-green-500 text-white font-bold shadow-inner border-b-2 border-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-3">
            {typeOptions.map((option) => (
              <div key={option.value} className="flex-1 flex justify-center items-center">
                <Image 
                  src={option.imagePath} 
                  alt={option.description}
                  width={40}
                  height={40}
                  className="object-contain"
                />
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
              className={`relative flex-1 py-2 text-center ${
                formData.speed === 'Slow' 
                  ? 'bg-red-500 text-white font-bold shadow-inner border-b-2 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Slow
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('speed', 'Fast')}
              className={`relative flex-1 py-2 text-center border-l border-gray-300 ${
                formData.speed === 'Fast' 
                  ? 'bg-green-500 text-white font-bold shadow-inner border-b-2 border-white' 
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
              className={`relative flex-1 py-2 text-center ${
                formData.amount === 'Little' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-2 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Little
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('amount', 'Normal')}
              className={`relative flex-1 py-2 text-center border-l border-gray-300 ${
                formData.amount === 'Normal' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-2 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => handleValueChange('amount', 'Monstrous')}
              className={`relative flex-1 py-2 text-center border-l border-gray-300 ${
                formData.amount === 'Monstrous' 
                  ? 'bg-blue-500 text-white font-bold shadow-inner border-b-2 border-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Monstrous
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Notes</label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded-md text-base"
            placeholder="Enter any notes here"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 ${
            submitted 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white rounded-md font-bold transition-colors disabled:bg-blue-400 flex items-center justify-center`}
        >
          {loading ? 'Submitting...' : (
            submitted ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M0 2C0 0.9 0.9 0 2 0h14l4 4v14a2 2 0 01-2 2H2a2 2 0 01-2-2V2zm5 0v6h10V2H5zm-.5 8a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-3a.5.5 0 00-.5-.5h-11z" />
                </svg>
                Save
              </>
            )
          )}
        </button>
      </form>
    </div>
  );
} 