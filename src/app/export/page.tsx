'use client';

import { useState } from 'react';
import supabase from '@/lib/supabase';
import { BowelMovement } from '@/lib/types';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ExportPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  const exportToCSV = async () => {
    setIsLoading(true);
    try {
      // Fetch all records from the gos table
      const { data, error } = await supabase.from('gos').select('*');
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        alert('No data to export');
        return;
      }
      
      // Convert data to CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: BowelMovement) => {
        return Object.values(row)
          .map(value => {
            // Wrap strings in quotes and handle null/undefined
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            return value;
          })
          .join(',');
      });
      
      const csv = [headers, ...rows].join('\n');
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `data-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. See console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">💾 Export / Backup All Data</h1>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p className="mb-4 text-gray-800 dark:text-gray-200">
          Click the button below to download all your database information as a CSV file for backup or analysis.
        </p>
        <button
          onClick={exportToCSV}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{isLoading ? 'Exporting...' : 'Export to CSV'}</span>
        </button>
      </div>
    </div>
  );
} 