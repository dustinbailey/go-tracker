'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { BowelMovement } from '@/lib/types';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

export default function Dashboard() {
  const [movements, setMovements] = useState<BowelMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [filter, setFilter] = useState({
    location: '',
    type: '',
    speed: '',
    amount: ''
  });

  useEffect(() => {
    fetchMovements();
  }, [dateRange, filter]);

  const fetchMovements = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('gos')
        .select('*')
        .gte('timestamp', `${dateRange.startDate}T00:00:00`)
        .lte('timestamp', `${dateRange.endDate}T23:59:59`)
        .order('timestamp', { ascending: false });
      
      if (filter.location) query = query.eq('location', filter.location);
      if (filter.type) query = query.eq('type', filter.type);
      if (filter.speed) query = query.eq('speed', filter.speed);
      if (filter.amount) query = query.eq('amount', filter.amount);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const exportCSV = () => {
    if (movements.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = ['timestamp', 'location', 'type', 'speed', 'amount', 'notes'];
    const csvContent = [
      headers.join(','),
      ...movements.map(movement => 
        headers.map(header => 
          `"${movement[header as keyof BowelMovement] || ''}"`
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `go-tracker-export-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data
  const getChartData = (field: keyof BowelMovement) => {
    const counts: Record<string, number> = {};
    
    movements.forEach(movement => {
      const value = movement[field] as string;
      counts[value] = (counts[value] || 0) + 1;
    });
    
    return {
      labels: Object.keys(counts),
      datasets: [{
        label: `${field.charAt(0).toUpperCase() + field.slice(1)} Distribution`,
        data: Object.values(counts),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)', 
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (movements.length === 0) return { total: 0, avgBetween: 'N/A' };
    
    // Total count
    const total = movements.length;
    
    // Average time between movements (using the duration_from_last_hours field if available)
    let avgDuration = 'N/A';
    const durationsWithValues = movements.filter(m => m.duration_from_last_hours !== null && m.duration_from_last_hours !== undefined);
    
    if (durationsWithValues.length > 0) {
      const sum = durationsWithValues.reduce((acc, curr) => acc + (curr.duration_from_last_hours || 0), 0);
      avgDuration = `${(sum / durationsWithValues.length).toFixed(1)} hours`;
    } else {
      // Calculate manually from timestamps if durations not available
      const sortedMovements = [...movements].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      if (sortedMovements.length > 1) {
        let totalHours = 0;
        for (let i = 1; i < sortedMovements.length; i++) {
          const prev = new Date(sortedMovements[i-1].timestamp).getTime();
          const curr = new Date(sortedMovements[i].timestamp).getTime();
          totalHours += (curr - prev) / (1000 * 60 * 60);
        }
        avgDuration = `${(totalHours / (sortedMovements.length - 1)).toFixed(1)} hours`;
      }
    }
    
    return { total, avgBetween: avgDuration };
  };

  const stats = getSummaryStats();

  // Add this new function to use the day_of_week field if available
  const getDayOfWeekDataOptimized = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = Array(7).fill(0);
    
    // Use the day_of_week field if available, otherwise calculate from timestamp
    movements.forEach(movement => {
      if (movement.day_of_week !== undefined && movement.day_of_week !== null) {
        counts[movement.day_of_week]++;
      } else {
        const date = new Date(movement.timestamp);
        counts[date.getDay()]++;
      }
    });
    
    return {
      labels: daysOfWeek,
      datasets: [{
        label: 'Frequency by Day of Week',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
  };
  
  // Add this new function to use the hour_of_day field if available
  const getHourOfDayDataOptimized = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const counts = Array(24).fill(0);
    
    // Use the hour_of_day field if available, otherwise calculate from timestamp
    movements.forEach(movement => {
      if (movement.hour_of_day !== undefined && movement.hour_of_day !== null) {
        counts[movement.hour_of_day]++;
      } else {
        const date = new Date(movement.timestamp);
        counts[date.getHours()]++;
      }
    });
    
    return {
      labels: hours,
      datasets: [{
        label: 'Frequency by Hour of Day',
        data: counts,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    };
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1">Location</label>
            <select
              name="location"
              value={filter.location}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All</option>
              <option value="Home">Home</option>
              <option value="Hotel">Hotel</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              name="type"
              value={filter.type}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All</option>
              <option value="Small hard lumps">Small hard lumps</option>
              <option value="Hard sausage">Hard sausage</option>
              <option value="Sausage with cracks">Sausage with cracks</option>
              <option value="Smooth & soft sausage">Smooth & soft sausage</option>
              <option value="Soft pieces">Soft pieces</option>
              <option value="Fluffy pieces">Fluffy pieces</option>
              <option value="Watery">Watery</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Speed</label>
            <select
              name="speed"
              value={filter.speed}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All</option>
              <option value="Fast">Fast</option>
              <option value="Slow">Slow</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <select
              name="amount"
              value={filter.amount}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All</option>
              <option value="Little">Little</option>
              <option value="Normal">Normal</option>
              <option value="Monstrous">Monstrous</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-500">Average Time Between</p>
            <p className="text-2xl font-bold">{stats.avgBetween}</p>
          </div>
        </div>
      </div>
      
      {/* Data Export */}
      <div className="flex justify-end">
        <button 
          onClick={exportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Export CSV
        </button>
      </div>
      
      {loading ? (
        <div className="text-center p-8">Loading data...</div>
      ) : movements.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p>No data found for the selected filters.</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or log some movements.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Type Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Bar data={getChartData('type')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Type Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Pie data={getChartData('type')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Speed Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Bar data={getChartData('speed')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Speed Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Pie data={getChartData('speed')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Amount Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Bar data={getChartData('amount')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Amount Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Pie data={getChartData('amount')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Location Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Bar data={getChartData('location')} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Location Distribution</h3>
              <div className="h-64">
                {movements.length > 0 && <Pie data={getChartData('location')} />}
              </div>
            </div>
          </div>
          
          {/* Frequency Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Frequency by Day of Week</h3>
              <div className="h-64">
                {movements.length > 0 && <Bar data={getDayOfWeekDataOptimized()} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Frequency by Hour of Day</h3>
              <div className="h-64">
                {movements.length > 0 && <Bar data={getHourOfDayDataOptimized()} />}
              </div>
            </div>
          </div>
          
          {/* Recent Movements Table */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Recent Logs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.slice(0, 10).map((movement, index) => (
                    <tr key={movement.id || index} className="border-b">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(movement.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{movement.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{movement.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{movement.speed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{movement.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{movement.duration_from_last_hours !== undefined && movement.duration_from_last_hours !== null 
                        ? `${movement.duration_from_last_hours.toFixed(1)} hrs` 
                        : '-'}</td>
                      <td className="px-6 py-4 text-sm">{movement.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 