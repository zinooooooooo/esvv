import React, { useState, useEffect } from 'react';
import { IoCalendarOutline, IoTimeOutline, IoCheckmarkCircle, IoClose } from 'react-icons/io5';
import { supabase } from '../supabase';

const AppointmentScheduler = ({ 
  selectedDate, 
  selectedTime, 
  onDateChange, 
  onTimeChange, 
  bookedSlots = [],
  maxAppointmentsPerDay = 25,
  timeSlotCapacity = 3
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointmentCounts, setAppointmentCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedDateBookedSlots, setSelectedDateBookedSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
      const isPast = date < today;
      const appointmentCount = appointmentCounts[dateString] || 0;
      const isFullyBooked = appointmentCount >= maxAppointmentsPerDay;
      const isAvailable = isCurrentMonth && !isPast && !isFullyBooked;
      
      days.push({
        date,
        dateString,
        isCurrentMonth,
        isPast,
        appointmentCount,
        isFullyBooked,
        isAvailable
      });
    }
    
    return days;
  };

  // Fetch booked slots for a specific date
  const fetchBookedSlotsForDate = async (date) => {
    if (!date) {
      setSelectedDateBookedSlots([]);
      return;
    }

    console.log(`Fetching booked slots for date: ${date} (type: ${typeof date})`);
    setFetchingSlots(true);
    try {
      const tables = ['pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector'];
      const allBookedSlots = [];

      for (const table of tables) {
        console.log(`Fetching from table: ${table} for date: ${date}`);
        const { data, error } = await supabase
          .from(table)
          .select('appointment_time, status')
          .eq('appointment_date', date)
          .not('appointment_time', 'is', null)
          .neq('status', 'declined'); // Count all appointments except declined ones

        if (error) {
          console.error(`Error fetching from ${table}:`, error);
        } else {
          console.log(`Data from ${table}:`, data);
          if (data && data.length > 0) {
            // Convert time format from HH:MM:SS to HH:MM for comparison
            const normalizedTimes = data.map(slot => {
              const time = slot.appointment_time;
              // If time is in HH:MM:SS format, convert to HH:MM
              if (time && time.includes(':')) {
                const parts = time.split(':');
                const normalized = `${parts[0]}:${parts[1]}`;
                console.log(`Converting time: ${time} -> ${normalized}`);
                return normalized;
              }
              return time;
            });
            allBookedSlots.push(...normalizedTimes);
          }
        }
      }

      setSelectedDateBookedSlots(allBookedSlots);
      console.log(`Fetched booked slots for ${date}:`, allBookedSlots);
    } catch (error) {
      console.error('Error fetching booked slots for date:', error);
      setSelectedDateBookedSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const displayTimeString = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Count how many appointments exist for this time slot
      const bookedCount = selectedDate ? selectedDateBookedSlots.filter(slot => slot === timeString).length : 0;
      const remainingSlots = Math.max(0, timeSlotCapacity - bookedCount);
      const isFullyBooked = remainingSlots === 0;
      const isBooked = bookedCount > 0;
      
      // Debug logging
      if (selectedDate) {
        const matchingSlots = selectedDateBookedSlots.filter(slot => slot === timeString);
        console.log(`Time slot ${timeString}: checking against booked slots [${selectedDateBookedSlots.join(', ')}]`);
        console.log(`Time slot ${timeString}: found ${matchingSlots.length} matches: [${matchingSlots.join(', ')}]`);
        console.log(`Time slot ${timeString}: ${bookedCount} appointments, ${remainingSlots} remaining`);
      }
      
      slots.push({
        time: timeString,
        displayTime: displayTimeString,
        isBooked,
        remainingSlots,
        isFullyBooked,
        bookedCount
      });
    }
    return slots;
  };

  // Fetch appointment counts for the current month
  const fetchAppointmentCounts = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      // Get all appointment tables and count appointments per date
      const tables = ['pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector'];
      const counts = {};
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('appointment_date')
          .gte('appointment_date', startDate)
          .lte('appointment_date', endDate)
          .not('appointment_date', 'is', null);
          
        if (!error && data) {
          data.forEach(appointment => {
            const date = appointment.appointment_date;
            counts[date] = (counts[date] || 0) + 1;
          });
        }
      }
      
      setAppointmentCounts(counts);
    } catch (error) {
      console.error('Error fetching appointment counts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentCounts();
  }, [currentMonth]);

  // Fetch booked slots when selectedDate changes
  useEffect(() => {
    fetchBookedSlotsForDate(selectedDate);
  }, [selectedDate]);

  // Test function to manually test the query (for debugging)
  const testQuery = async (date, tableName) => {
    console.log(`Testing query for ${tableName} on ${date}`);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('appointment_time, status, appointment_date')
        .eq('appointment_date', date)
        .not('appointment_time', 'is', null)
        .neq('status', 'declined');
      
      console.log(`Test query result for ${tableName}:`, { data, error });
      return { data, error };
    } catch (err) {
      console.error(`Test query error for ${tableName}:`, err);
      return { data: null, error: err };
    }
  };

  // Expose test function to window for debugging
  useEffect(() => {
    window.testAppointmentQuery = testQuery;
    window.testDateFormat = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      console.log(`Date formatting test: ${date} -> ${formatted}`);
      return formatted;
    };
    console.log('Test functions available:');
    console.log('- window.testAppointmentQuery(date, tableName)');
    console.log('- window.testDateFormat(date)');
  }, []);

  const handleDateClick = (dateString, isAvailable) => {
    console.log(`Date clicked: ${dateString}, Available: ${isAvailable}`);
    if (isAvailable) {
      onDateChange(dateString);
    }
  };

  const handleTimeClick = (time) => {
    if (!time.isFullyBooked) {
      onTimeChange(time.time);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calendarDays = generateCalendarDays();
  const timeSlots = generateTimeSlots();
  const selectedDateInfo = calendarDays.find(day => day.dateString === selectedDate);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <IoCalendarOutline className="mr-3 text-indigo-600" />
        Schedule Your Appointment
      </h3>
      
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-700">Date</h4>

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <span className="text-xl">«</span>
            </button>
            <h5 className="text-lg font-semibold text-gray-800">
              {formatMonthYear(currentMonth)}
            </h5>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <span className="text-xl">»</span>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isSelected = day.dateString === selectedDate;
                const isToday = day.date.toDateString() === new Date().toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day.dateString, day.isAvailable)}
                    disabled={!day.isAvailable}
                    className={`
                      relative h-12 w-full rounded-lg text-sm font-medium transition-all duration-200
                      ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                      ${day.isPast ? 'text-gray-400 cursor-not-allowed' : ''}
                      ${day.isFullyBooked 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer' 
                        : day.isAvailable 
                        ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer'
                        : 'text-gray-400 cursor-not-allowed'
                      }
                      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100 text-blue-700' : ''}
                      ${isToday ? 'ring-1 ring-gray-400' : ''}
                    `}
                  >
                    {day.date.getDate()}
                    {day.isFullyBooked && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
              <span className="text-gray-600">Partially Booked</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
              <span className="text-gray-600">Fully Booked</span>
            </div>
          </div>
          
          {/* Descriptive texts below container */}
          <div className="text-sm text-gray-600">
            {selectedDateInfo && (
              <span className="text-green-600 font-medium">
                Earliest available appointment: {new Date(selectedDateInfo.dateString).toLocaleDateString('en-US', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            )}
          </div>
          
          {selectedDateInfo && (
            <p className="text-sm text-red-600">
              To the extent possible, additional slots are made regularly.
            </p>
          )}
        </div>

        {/* Time Slots Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-gray-700">Time</h4>
          
          {/* Add spacing to align with calendar navigation */}
          <div className="h-10"></div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 max-h-96 overflow-y-auto">
            {fetchingSlots ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mr-3"></div>
                <span className="text-gray-600 font-medium">Loading available slots...</span>
              </div>
            ) : (
              timeSlots.map((slot, index) => (
              <div key={index} className="mb-3 last:mb-0">
                <label className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                  slot.isFullyBooked 
                    ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60' 
                    : slot.isBooked
                    ? 'border-orange-200 bg-orange-50 cursor-pointer hover:border-orange-300'
                    : 'border-gray-200 hover:border-indigo-300 cursor-pointer bg-white'
                }`}>
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.time}
                    checked={selectedTime === slot.time}
                    onChange={() => handleTimeClick(slot)}
                    disabled={slot.isFullyBooked}
                    className={`mr-3 w-4 h-4 ${
                      slot.isFullyBooked
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-indigo-600 focus:ring-indigo-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className={`font-semibold ${
                      slot.isFullyBooked 
                        ? 'text-red-800' 
                        : slot.isBooked
                        ? 'text-orange-800'
                        : 'text-gray-800'
                    }`}>
                      {slot.displayTime}
                    </div>
                    <div className={`text-sm font-medium ${
                      slot.isFullyBooked 
                        ? 'text-red-600' 
                        : slot.isBooked
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}>
                      {slot.isFullyBooked 
                        ? 'Fully Booked' 
                        : slot.isBooked
                        ? `${slot.bookedCount} appointment${slot.bookedCount > 1 ? 's' : ''} - ${slot.remainingSlots} slot${slot.remainingSlots !== 1 ? 's' : ''} left`
                        : `Available Slots: ${slot.remainingSlots}`
                      }
                    </div>
                  </div>
                  {slot.isFullyBooked && (
                    <IoClose className="text-red-500 ml-2" size={20} />
                  )}
                  {slot.isBooked && !slot.isFullyBooked && (
                    <IoTimeOutline className="text-orange-500 ml-2" size={20} />
                  )}
                  {!slot.isBooked && !slot.isFullyBooked && slot.remainingSlots > 0 && (
                    <IoCheckmarkCircle className="text-green-500 ml-2" size={20} />
                  )}
                </label>
              </div>
            ))
            )}
          </div>
          
          {/* Descriptive texts below container */}
          
        </div>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
