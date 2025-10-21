'use client';

import { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabase';
import { BowelMovement } from '@/lib/types';
import { deleteMovement } from '@/app/actions/movements';
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

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

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

export default function StatsAndRecords() {
  const [movements, setMovements] = useState<BowelMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [filter, setFilter] = useState({
    location: [] as string[],
    type: [] as string[],
    speed: [] as string[],
    amount: [] as string[]
  });
  const [pendingFilter, setPendingFilter] = useState({
    location: [] as string[],
    type: [] as string[],
    speed: [] as string[],
    amount: [] as string[]
  });
  const [pendingDateRange, setPendingDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [datePreset, setDatePreset] = useState('last-month');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    recordsPerPage: 25
  });
  const [hoursSinceLastLog, setHoursSinceLastLog] = useState<string>('N/A');

  useEffect(() => {
    setPendingFilter(filter);
  }, []);

  useEffect(() => {
    fetchMovements();
    fetchLastMovementTime();
  }, [dateRange, filter]);

  // Add separate function to fetch the most recent movement time
  const fetchLastMovementTime = async () => {
    try {
      const { data, error } = await supabase
        .from('gos')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const lastMovementTime = new Date(data[0].timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursDiff = (currentTime - lastMovementTime) / (1000 * 60 * 60);
        
        setHoursSinceLastLog(`${Math.round(hoursDiff)} hours`);
      } else {
        setHoursSinceLastLog('N/A');
      }
    } catch (error) {
      console.error('Error fetching last movement time:', error);
      setHoursSinceLastLog('N/A');
    }
  };

  // Add click outside listener to dismiss delete confirmation
  useEffect(() => {
    if (deleteConfirm) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // If clicked element is not a delete button (doesn't have delete-btn class), dismiss
        if (!target.closest('.delete-btn')) {
          setDeleteConfirm(null);
          // Clear the timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [deleteConfirm]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    
    try {
      // Create base query
      let baseQuery = supabase
        .from('gos')
        .select('*')
        .gte('timestamp', `${dateRange.startDate}T00:00:00`)
        .lte('timestamp', `${dateRange.endDate}T23:59:59`)
        .order('timestamp', { ascending: false });
      
      // Apply filters - updated to handle arrays of values
      if (filter.location.length > 0) baseQuery = baseQuery.in('location', filter.location);
      if (filter.type.length > 0) baseQuery = baseQuery.in('type', filter.type);
      if (filter.speed.length > 0) baseQuery = baseQuery.in('speed', filter.speed);
      if (filter.amount.length > 0) baseQuery = baseQuery.in('amount', filter.amount);
      
      // Initialize an empty array to hold all results
      let allData: BowelMovement[] = [];
      
      // Implement pagination to get all results
      let hasMore = true;
      let page = 0;
      const pageSize = 1000; // Supabase's maximum page size
      
      while (hasMore) {
        const { data, error } = await baseQuery
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          
          // Check if we received a full page of results
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
      }
      
      setMovements(allData);
    } catch (error) {
      console.error('Error fetching movements:', error);
      alert('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setPendingFilter(prev => ({ ...prev, [name]: selectedValues }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPendingDateRange(prev => ({ ...prev, [name]: value }));
    // Reset preset when manually changing dates
    setDatePreset('custom');
  };

  const handleDatePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    setDatePreset(preset);
    
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch(preset) {
      case 'last-week':
        // Last 7 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
        
      case 'last-month':
        // Last 30 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
        
      case 'last-3-months':
        // Last 90 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
        
      case 'last-6-months':
        // Last 180 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 180);
        break;
        
      case 'last-year':
        // Last 365 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        break;
        
      case 'year-to-date':
        // January 1st of current year to today
        startDate = new Date(today.getFullYear(), 0, 1); // Jan 1 of current year
        break;
        
      case 'prev-year':
        // Previous calendar year
        startDate = new Date(today.getFullYear() - 1, 0, 1); // Jan 1 of previous year
        endDate = new Date(today.getFullYear() - 1, 11, 31); // Dec 31 of previous year
        break;
        
      case 'prev-prev-year':
        // Calendar year before previous year
        startDate = new Date(today.getFullYear() - 2, 0, 1); // Jan 1 of 2 years ago
        endDate = new Date(today.getFullYear() - 2, 11, 31); // Dec 31 of 2 years ago
        break;
        
      case 'all':
        // Far past to today
        startDate = new Date(2000, 0, 1); // Jan 1, 2000 as a reasonable "far past"
        break;
        
      case 'custom':
        // Keep existing pending values
        return;
        
      default:
        return;
    }
    
    // Format dates to strings
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    
    // Update pending date range
    setPendingDateRange({
      startDate: formattedStartDate,
      endDate: formattedEndDate
    });
  };

  const applyFilters = () => {
    setFilter(pendingFilter);
    setDateRange(pendingDateRange);
    // Reset to first page when applying new filters
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const exportCSV = () => {
    if (movements.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = ['timestamp', 'location', 'type', 'speed', 'amount', 'duration_from_last_hours', 'notes'];
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
    
    // Different color schemes based on field
    let backgroundColor, borderColor;
    let orderedLabels = Object.keys(counts);
    let orderedData = Object.values(counts);
    
    // For type field, order according to Bristol Stool Scale (1-7)
    if (field === 'type') {
      // Define the correct order of stool types
      const typeOrder = [
        "Small hard lumps",
        "1: Small hard lumps",
        "Hard sausage",
        "2: Hard sausage",
        "Sausage with cracks",
        "3: Sausage with cracks",
        "3: Sausage w/ cracks on surface",
        "Smooth & soft sausage",
        "4: Smooth & soft sausage",
        "Soft pieces",
        "5: Soft pieces",
        "Fluffy pieces",
        "6: Fluffy pieces",
        "Watery",
        "7: Watery"
      ];
      
      // Create standardized labels and data arrays in the correct order
      const orderedPairs: [string, number][] = [];
      
      // Push each type that exists in our data in the correct order
      typeOrder.forEach(type => {
        if (counts[type] !== undefined) {
          orderedPairs.push([type, counts[type]]);
        }
      });
      
      // Handle any types that might not be in our predefined order
      Object.entries(counts).forEach(([label, count]) => {
        if (!typeOrder.includes(label)) {
          orderedPairs.push([label, count]);
        }
      });
      
      // Extract ordered labels and data
      orderedLabels = orderedPairs.map(pair => pair[0]);
      orderedData = orderedPairs.map(pair => pair[1]);
      
      // Custom color scheme for Bristol Stool Scale types
      // 1-2: red shades, 3-5: green shades, 6-7: red shades
      const bgColors: string[] = [];
      const borderColors: string[] = [];
      
      orderedLabels.forEach(label => {
        // Extract the type number if present, or infer from the label text
        let typeNumber = 0;
        if (label.includes("1:") || label.includes("Small hard lumps")) {
          typeNumber = 1;
        } else if (label.includes("2:") || label.includes("Hard sausage")) {
          typeNumber = 2;
        } else if (label.includes("3:") || label.includes("Sausage with cracks") || label.includes("Sausage w/ cracks")) {
          typeNumber = 3;
        } else if (label.includes("4:") || label.includes("Smooth & soft sausage")) {
          typeNumber = 4;
        } else if (label.includes("5:") || label.includes("Soft pieces")) {
          typeNumber = 5;
        } else if (label.includes("6:") || label.includes("Fluffy pieces")) {
          typeNumber = 6;
        } else if (label.includes("7:") || label.includes("Watery")) {
          typeNumber = 7;
        }
        
        // Assign colors based on type number
        if (typeNumber === 1) {
          bgColors.push('rgba(220, 38, 38, 0.6)'); // Darker red for Type 1
          borderColors.push('rgba(220, 38, 38, 1)');
        } else if (typeNumber === 2) {
          bgColors.push('rgba(255, 99, 132, 0.6)'); // Lighter red for Type 2
          borderColors.push('rgba(255, 99, 132, 1)');
        } else if (typeNumber === 3) {
          bgColors.push('rgba(12, 161, 94, 0.6)'); // Darker green for Type 3
          borderColors.push('rgba(12, 161, 94, 1)');
        } else if (typeNumber === 4) {
          bgColors.push('rgba(72, 202, 141, 0.6)'); // Medium green for Type 4
          borderColors.push('rgba(72, 202, 141, 1)');
        } else if (typeNumber === 5) {
          bgColors.push('rgba(147, 230, 195, 0.6)'); // Lighter green for Type 5
          borderColors.push('rgba(147, 230, 195, 1)');
        } else if (typeNumber === 6) {
          bgColors.push('rgba(252, 165, 165, 0.6)'); // Light red for Type 6
          borderColors.push('rgba(252, 165, 165, 1)');
        } else if (typeNumber === 7) {
          bgColors.push('rgba(185, 28, 28, 0.6)'); // Darker red for Type 7
          borderColors.push('rgba(185, 28, 28, 1)');
        } else {
          // Default color for anything else
          bgColors.push('rgba(199, 199, 199, 0.6)');
          borderColors.push('rgba(199, 199, 199, 1)');
        }
      });
      
      backgroundColor = bgColors;
      borderColor = borderColors;
    } else if (field === 'amount') {
      backgroundColor = [
        'rgba(54, 162, 235, 0.6)', // blue
        'rgba(75, 192, 192, 0.6)', // teal
        'rgba(72, 202, 141, 0.6)'  // green
      ];
      borderColor = [
        'rgba(54, 162, 235, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(72, 202, 141, 1)'
      ];
    } else if (field === 'location') {
      backgroundColor = [
        'rgba(102, 126, 234, 0.6)', // indigo
        'rgba(79, 209, 197, 0.6)',  // teal
        'rgba(153, 102, 255, 0.6)', // purple
        'rgba(90, 94, 189, 0.6)'    // blue-purple
      ];
      borderColor = [
        'rgba(102, 126, 234, 1)',
        'rgba(79, 209, 197, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(90, 94, 189, 1)'
      ];
    } else if (field === 'speed') {
      // Custom color scheme for speed with green for Fast and red for Slow
      const speedLabels = orderedLabels;
      const fastIndex = speedLabels.findIndex(label => label === 'Fast');
      const slowIndex = speedLabels.findIndex(label => label === 'Slow');
      
      // Create initial arrays with placeholders
      const bgColors = Array(speedLabels.length).fill('rgba(153, 102, 255, 0.6)'); // Default purple
      const borderColors = Array(speedLabels.length).fill('rgba(153, 102, 255, 1)');
      
      // Set specific colors for Fast and Slow
      if (fastIndex !== -1) {
        bgColors[fastIndex] = 'rgba(72, 202, 141, 0.6)'; // Green for Fast
        borderColors[fastIndex] = 'rgba(72, 202, 141, 1)';
      }
      
      if (slowIndex !== -1) {
        bgColors[slowIndex] = 'rgba(255, 99, 132, 0.6)'; // Red for Slow (same as Hard sausage in Type)
        borderColors[slowIndex] = 'rgba(255, 99, 132, 1)';
      }
      
      backgroundColor = bgColors;
      borderColor = borderColors;
    } else {
      backgroundColor = [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)'
      ];
      borderColor = [
        'rgba(54, 162, 235, 1)',
        'rgba(255, 99, 132, 1)', 
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)'
      ];
    }
    
    return {
      labels: orderedLabels,
      datasets: [{
        label: `${field.charAt(0).toUpperCase() + field.slice(1)} Distribution`,
        data: orderedData,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
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
        backgroundColor: 'rgba(79, 209, 197, 0.6)', // teal
        borderColor: 'rgba(79, 209, 197, 1)',
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
        backgroundColor: 'rgba(102, 126, 234, 0.6)', // indigo
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1
      }]
    };
  };

  // Chart options with improved text contrast
  const chartOptions = {
    plugins: {
      legend: {
        display: false, // Hide legend for bar charts since titles are already clear
        labels: {
          color: '#1F2937', // text-gray-800 equivalent
          font: {
            weight: 'bold' as const
          }
        }
      },
      title: {
        color: '#1F2937',
        font: {
          weight: 'bold' as const
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#374151', // text-gray-700 equivalent
          font: {
            weight: 'bold' as const
          }
        },
        grid: {
          display: false // Remove grid lines for cleaner look
        }
      },
      y: {
        ticks: {
          color: '#374151', // text-gray-700 equivalent
          font: {
            weight: 'bold' as const
          }
        },
        grid: {
          color: '#E5E7EB' // text-gray-200 equivalent
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    indexAxis: 'y' as const, // Horizontal bar chart for better label display
    barThickness: 'flex' as const
  };

  // Options for frequency charts (day/hour) - vertical bars
  const frequencyChartOptions = {
    plugins: {
      legend: {
        display: false, // Hide legend for bar charts since titles are already clear
        labels: {
          color: '#1F2937',
          font: {
            weight: 'bold' as const
          }
        }
      },
      title: {
        color: '#1F2937',
        font: {
          weight: 'bold' as const
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#374151',
          font: {
            weight: 'bold' as const
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        ticks: {
          color: '#374151',
          font: {
            weight: 'bold' as const
          }
        },
        grid: {
          color: '#E5E7EB'
        },
        beginAtZero: true
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    barThickness: 'flex' as const
  };

  // Separate options for pie charts (without scales)
  const pieChartOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#1F2937', // text-gray-800 equivalent
          font: {
            weight: 'bold' as const
          },
          padding: 20
        }
      },
      title: {
        color: '#1F2937',
        font: {
          weight: 'bold' as const
        }
      }
    },
    maintainAspectRatio: false,
    responsive: true
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        const result = await deleteMovement(id);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete record');
        }
        
        // Remove from state
        setMovements(movements.filter(m => m.id !== id));
        setDeleteConfirm(null);
      } catch (error) {
        console.error('Error deleting record:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to delete record: ${errorMessage}`);
      }
    } else {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setDeleteConfirm(id);
      
      // Auto-dismiss confirmation after 3 seconds
      timeoutRef.current = setTimeout(() => {
        setDeleteConfirm(current => current === id ? null : current);
        timeoutRef.current = null;
      }, 3000);
    }
  };

  // Add function to handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleRecordsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    setPagination({
      currentPage: 1, // Reset to first page when changing records per page
      recordsPerPage: value
    });
  };

  // Calculate pagination info
  const paginationInfo = {
    totalPages: Math.ceil(movements.length / pagination.recordsPerPage),
    startIndex: (pagination.currentPage - 1) * pagination.recordsPerPage,
    endIndex: Math.min((pagination.currentPage * pagination.recordsPerPage) - 1, movements.length - 1)
  };

  // Generate an array of page numbers for pagination controls
  const getPageNumbers = () => {
    const totalPages = paginationInfo.totalPages;
    const currentPage = pagination.currentPage;
    
    // For small number of pages, show all
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // For larger numbers, show current, first, last, and some adjacents with ellipsis
    const pages = [];
    
    // Always include first page
    pages.push(1);
    
    // Handle first part
    if (currentPage > 3) {
      pages.push(null); // ellipsis
    }
    
    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Handle last part
    if (currentPage < totalPages - 2) {
      pages.push(null); // ellipsis
    }
    
    // Always include last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">📊 Stats & Records</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Date preset selector */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">Date Range Preset</label>
            <select
              value={datePreset}
              onChange={handleDatePresetChange}
              className="w-full p-2 border rounded-md text-gray-800"
            >
              <option value="custom">Custom Date Range</option>
              <option value="last-week">Last Week (7 days)</option>
              <option value="last-month">Last Month (30 days)</option>
              <option value="last-3-months">Last 3 Months (90 days)</option>
              <option value="last-6-months">Last 6 Months (180 days)</option>
              <option value="last-year">Last Year (365 days)</option>
              <option value="year-to-date">Year to Date</option>
              <option value="prev-year">Previous Calendar Year</option>
              <option value="prev-prev-year">Calendar Year Before Previous</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={pendingDateRange.startDate}
              onChange={handleDateChange}
              className="w-full p-2 border rounded-md text-gray-800"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={pendingDateRange.endDate}
              onChange={handleDateChange}
              className="w-full p-2 border rounded-md text-gray-800"
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-2 mb-2">
            <p className="text-sm text-gray-500 italic">Hold Ctrl/Cmd to select multiple options in the filters below</p>
          </div>
          
          <div className="grid grid-cols-4 gap-4 md:col-span-2 lg:col-span-2">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
              <select
                name="location"
                multiple
                value={pendingFilter.location}
                onChange={handleFilterChange}
                size={4}
                className="w-full p-2 border rounded-md text-gray-800"
              >
                <option value="Home">Home</option>
                <option value="Hotel">Hotel</option>
                <option value="Other">Other</option>
                <option value="">(Empty)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
              <select
                name="type"
                multiple
                value={pendingFilter.type}
                onChange={handleFilterChange}
                size={7}
                className="w-full p-2 border rounded-md text-gray-800"
              >
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
              <label className="block text-sm font-bold text-gray-700 mb-1">Speed</label>
              <select
                name="speed"
                multiple
                value={pendingFilter.speed}
                onChange={handleFilterChange}
                size={2}
                className="w-full p-2 border rounded-md text-gray-800"
              >
                <option value="Fast">Fast</option>
                <option value="Slow">Slow</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Amount</label>
              <select
                name="amount"
                multiple
                value={pendingFilter.amount}
                onChange={handleFilterChange}
                size={3}
                className="w-full p-2 border rounded-md text-gray-800"
              >
                <option value="Little">Little</option>
                <option value="Normal">Normal</option>
                <option value="Monstrous">Monstrous</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Apply filters button */}
        <div className="mt-4 flex justify-between">
          <button 
            onClick={() => {
              // Clear all filters
              setPendingFilter({
                location: [],
                type: [],
                speed: [],
                amount: []
              });
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
          <button 
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-700 font-medium">Total Filtered Logs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-700 font-medium">Average Time Between (Filtered)</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgBetween}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-700 font-medium">Hours Since Last Log</p>
            <p className="text-2xl font-bold text-gray-900">{hoursSinceLastLog}</p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center p-8">Loading data...</div>
      ) : movements.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p>No data found for the selected filters.</p>
          <p className="text-sm text-gray-700 mt-2">Try adjusting your filters or log some movements.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Type Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Bar data={getChartData('type')} options={chartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Type Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Pie data={getChartData('type')} options={pieChartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Speed Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Bar data={getChartData('speed')} options={chartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Speed Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Pie data={getChartData('speed')} options={pieChartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Amount Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Bar data={getChartData('amount')} options={chartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Amount Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Pie data={getChartData('amount')} options={pieChartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Location Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Bar data={getChartData('location')} options={chartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Location Distribution</h3>
              <div className="h-80">
                {movements.length > 0 && <Pie data={getChartData('location')} options={pieChartOptions} />}
              </div>
            </div>
          </div>
          
          {/* Frequency Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Frequency by Day of Week</h3>
              <div className="h-80">
                {movements.length > 0 && <Bar data={getDayOfWeekDataOptimized()} options={frequencyChartOptions} />}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Frequency by Hour of Day</h3>
              <div className="h-80">
                {movements.length > 0 && <Bar data={getHourOfDayDataOptimized()} options={frequencyChartOptions} />}
              </div>
            </div>
          </div>
          
          {/* Recent Movements Table */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Recent Logs</h3>
              
              {/* Export CSV button - moved inside Recent Logs header */}
              <button 
                onClick={exportCSV}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
            
            {/* Pagination controls - top */}
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={pagination.recordsPerPage}
                  onChange={handleRecordsPerPageChange}
                  className="border rounded-md px-2 py-1 text-sm text-gray-800"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-700">records per page</span>
              </div>
              
              <div className="text-sm text-gray-700">
                Showing {movements.length > 0 ? paginationInfo.startIndex + 1 : 0} to {movements.length > 0 ? paginationInfo.endIndex + 1 : 0} of {movements.length} records
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Speed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Duration From Last</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.slice(paginationInfo.startIndex, paginationInfo.endIndex + 1).map((movement, index) => (
                    <tr key={movement.id || index} className="border-b">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {new Date(movement.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{movement.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{movement.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{movement.speed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{movement.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{movement.duration_from_last_hours !== undefined && movement.duration_from_last_hours !== null 
                        ? `${Math.round(movement.duration_from_last_hours)} hrs` 
                        : '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{movement.notes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {movement.id && (
                          <button 
                            onClick={() => handleDelete(movement.id as string)}
                            className="p-2 rounded-full w-10 h-10 flex items-center justify-center delete-btn"
                            style={{ 
                              backgroundColor: deleteConfirm === movement.id ? 'rgba(220, 38, 38, 1)' : 'transparent',
                              color: deleteConfirm === movement.id ? 'white' : 'rgba(220, 38, 38, 1)'
                            }}
                            title={deleteConfirm === movement.id ? "Click again to confirm deletion" : "Delete record"}
                          >
                            {deleteConfirm === movement.id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination controls - bottom */}
            {paginationInfo.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className={`px-3 py-1 rounded-md font-bold ${
                    pagination.currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {getPageNumbers().map((page, index) => 
                    page === null ? (
                      <span key={`ellipsis-${index}`} className="px-3 py-1">...</span>
                    ) : (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page as number)}
                        className={`px-3 py-1 rounded-md font-bold ${
                          pagination.currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === paginationInfo.totalPages}
                  className={`px-3 py-1 rounded-md font-bold ${
                    pagination.currentPage === paginationInfo.totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 