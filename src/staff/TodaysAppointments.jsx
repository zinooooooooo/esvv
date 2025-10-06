import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Eye,
  Edit,
  Trash2,
  Archive,
  Check,
  X,
  RotateCcw
} from "lucide-react";

const TodaysAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  
  // Realtime subscriptions ref
  const subscriptionsRef = useRef([]);

  const statusOptions = [
    { value: "completed", label: "Completed", color: "green", icon: CheckCircle },
    { value: "re-scheduled", label: "Re-Scheduled", color: "blue", icon: RotateCcw },
    { value: "did-not-show-up", label: "Did Not Show Up", color: "red", icon: XCircle }
  ];

  useEffect(() => {
    fetchTodaysAppointments();
    setupRealtimeSubscriptions();
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter]);

  const fetchTodaysAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const tables = ['pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector'];
      const allAppointments = [];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('appointment_date', today)
          .in('status', ['scheduled', 'approved', 'completed', 're-scheduled', 'did-not-show-up']);

        if (error) {
          console.error(`Error fetching from ${table}:`, error);
        } else if (data) {
          const appointmentsWithTable = data.map(apt => ({ ...apt, table_name: table }));
          allAppointments.push(...appointmentsWithTable);
        }
      }

      // Sort by appointment time
      allAppointments.sort((a, b) => {
        if (!a.appointment_time || !b.appointment_time) return 0;
        return a.appointment_time.localeCompare(b.appointment_time);
      });

      setAppointments(allAppointments);
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      showNotification('error', 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchTodaysAppointments();
    setupRealtimeSubscriptions(); // Refresh realtime subscriptions
    showNotification('success', 'Data refreshed and realtime reconnected');
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.phone?.includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 3000);
  };

  const setupRealtimeSubscriptions = () => {
    // Clean up existing subscriptions first
    cleanupRealtimeSubscriptions();
    
    const today = new Date().toISOString().split('T')[0];
    const tables = ['pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector'];
    
    tables.forEach(table => {
      const subscription = supabase
        .channel(`${table}_appointments_channel`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `appointment_date=eq.${today}`
          },
          (payload) => {
            handleRealtimeChange(payload, table);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealtimeConnected(true);
          } else if (status === 'CHANNEL_ERROR') {
            setIsRealtimeConnected(false);
          }
        });

      subscriptionsRef.current.push(subscription);
    });
  };

  const cleanupRealtimeSubscriptions = () => {
    subscriptionsRef.current.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    subscriptionsRef.current = [];
  };

  const handleRealtimeChange = (payload, tableName) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    setAppointments(currentAppointments => {
      let updatedAppointments = [...currentAppointments];
      
      switch (eventType) {
        case 'INSERT':
          if (newRecord && isTodayAppointment(newRecord)) {
            const appointmentWithTable = { ...newRecord, table_name: tableName };
            updatedAppointments.push(appointmentWithTable);
            showNotification('success', 'New appointment added');
          }
          break;
          
        case 'UPDATE':
          if (newRecord && isTodayAppointment(newRecord)) {
            const appointmentWithTable = { ...newRecord, table_name: tableName };
            const index = updatedAppointments.findIndex(apt => 
              apt.id === newRecord.id && apt.table_name === tableName
            );
            if (index !== -1) {
              updatedAppointments[index] = appointmentWithTable;
              showNotification('info', 'Appointment updated');
            }
          }
          break;
          
        case 'DELETE':
          if (oldRecord) {
            updatedAppointments = updatedAppointments.filter(apt => 
              !(apt.id === oldRecord.id && apt.table_name === tableName)
            );
            showNotification('info', 'Appointment removed');
          }
          break;
      }
      
      // Sort by appointment time
      updatedAppointments.sort((a, b) => {
        if (!a.appointment_time || !b.appointment_time) return 0;
        return a.appointment_time.localeCompare(b.appointment_time);
      });
      
      return updatedAppointments;
    });
  };

  const isTodayAppointment = (appointment) => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.appointment_date === today && 
           ['scheduled', 'approved', 'completed', 're-scheduled', 'did-not-show-up'].includes(appointment.status);
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNewStatus("");
    setStatusNote("");
    setRescheduleDate("");
    setRescheduleTime("");
    setShowStatusModal(true);
  };

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDate(appointment.appointment_date || "");
    setRescheduleTime(appointment.appointment_time || "");
    setStatusNote("");
    setShowRescheduleModal(true);
  };

  const updateAppointmentStatus = async () => {
    if (!newStatus || !selectedAppointment) return;

    try {
      const { error } = await supabase
        .from(selectedAppointment.table_name)
        .update({ 
          status: newStatus,
          appointment_notes: statusNote || selectedAppointment.appointment_notes
        })
        .eq('id', selectedAppointment.id);

      if (error) {
        showNotification('error', 'Failed to update status');
      } else {
        // Send customized notification based on status
        await sendStatusNotification(selectedAppointment, newStatus);
        
        showNotification('success', 'Status updated successfully');
        setShowStatusModal(false);
        fetchTodaysAppointments();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', 'Failed to update status');
    }
  };

  const rescheduleAppointment = async () => {
    if (!rescheduleDate || !rescheduleTime || !selectedAppointment) return;

    try {
      const { error } = await supabase
        .from(selectedAppointment.table_name)
        .update({ 
          appointment_date: rescheduleDate,
          appointment_time: rescheduleTime,
          status: 're-scheduled',
          appointment_notes: statusNote || selectedAppointment.appointment_notes
        })
        .eq('id', selectedAppointment.id);

      if (error) {
        showNotification('error', 'Failed to reschedule appointment');
      } else {
        // Send reschedule notification
        await sendRescheduleNotification(selectedAppointment, rescheduleDate, rescheduleTime);
        
        showNotification('success', 'Appointment rescheduled successfully');
        setShowRescheduleModal(false);
        fetchTodaysAppointments();
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      showNotification('error', 'Failed to reschedule appointment');
    }
  };

  const sendStatusNotification = async (appointment, status) => {
    try {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType = 'info';

      switch (status) {
        case 'completed':
          notificationTitle = 'Appointment Completed';
          notificationMessage = 'Your appointment for today has been completed. Thank you for trusting us!';
          notificationType = 'success';
          break;
        
        case 're-scheduled':
          notificationTitle = 'Appointment Rescheduled';
          notificationMessage = 'We\'re sorry, but your appointment has been rescheduled. Please check your new appointment details.';
          notificationType = 'warning';
          break;
        
        case 'did-not-show-up':
          notificationTitle = 'Missed Appointment';
          notificationMessage = 'Uh-oh! You didn\'t attend your appointment today. You may schedule a new appointment anytime.';
          notificationType = 'warning';
          break;
        
        default:
          notificationTitle = 'Appointment Status Updated';
          notificationMessage = 'Your appointment status has been updated.';
          notificationType = 'info';
      }

      // Send notification to user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: appointment.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          appointment_id: appointment.id,
          table_name: appointment.table_name,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    } catch (error) {
      console.error('Error in sendStatusNotification:', error);
    }
  };

  const sendRescheduleNotification = async (appointment, newDate, newTime) => {
    try {
      const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = new Date(`2000-01-01T${newTime}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const notificationTitle = 'Appointment Rescheduled';
      const notificationMessage = `Your appointment has been rescheduled to ${formattedDate} at ${formattedTime}. Please make sure to attend at the new time.`;

      // Send notification to user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: appointment.user_id,
          title: notificationTitle,
          message: notificationMessage,
          type: 'warning',
          appointment_id: appointment.id,
          table_name: appointment.table_name,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Error sending reschedule notification:', notificationError);
      }
    } catch (error) {
      console.error('Error in sendRescheduleNotification:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 're-scheduled': return 'bg-blue-100 text-blue-800';
      case 'did-not-show-up': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 're-scheduled': return <RotateCcw className="w-4 h-4" />;
      case 'did-not-show-up': return <XCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTime = (time) => {
    if (!time) return 'No time set';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Today's Appointments</h1>
            <p className="text-gray-600">Appointments Scheduled for Today</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Realtime Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isRealtimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            <button
              onClick={handleManualRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => ['scheduled', 'approved'].includes(apt.status)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">No Show</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'did-not-show-up').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, service, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="re-scheduled">Re-Scheduled</option>
                <option value="did-not-show-up">Did Not Show Up</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Appointments ({filteredAppointments.length})</h3>
        </div>
        
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No appointments found for today</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={`${appointment.table_name}-${appointment.id}`} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {appointment.first_name} {appointment.last_name}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(appointment.appointment_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{appointment.service || 'No service specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{appointment.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openDetailsModal(appointment)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {['scheduled', 'approved'].includes(appointment.status) && (
                      <button
                        onClick={() => openStatusModal(appointment)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Update Status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

       {/* Details Modal */}
       {showDetailsModal && selectedAppointment && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
             <div className="p-8">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-2xl font-bold text-gray-900">Appointment Details</h3>
                   <p className="text-gray-600 mt-1">Complete information about this appointment</p>
                 </div>
                 <button
                   onClick={() => setShowDetailsModal(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>
              
               <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-gray-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                     <p className="text-gray-900 font-medium">{selectedAppointment.first_name} {selectedAppointment.last_name}</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</label>
                     <p className="text-gray-900 font-medium">{selectedAppointment.phone || 'Not provided'}</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Email Address</label>
                     <p className="text-gray-900 font-medium">{selectedAppointment.email || 'Not provided'}</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Service Requested</label>
                     <p className="text-gray-900 font-medium">{selectedAppointment.service || 'Not specified'}</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Appointment Time</label>
                     <p className="text-gray-900 font-medium">{formatTime(selectedAppointment.appointment_time)}</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Status</label>
                     <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAppointment.status)}`}>
                       {getStatusIcon(selectedAppointment.status)}
                       {selectedAppointment.status}
                     </span>
                   </div>
                 </div>
                 
                 {selectedAppointment.appointment_notes && (
                   <div className="bg-blue-50 rounded-xl p-4">
                     <label className="text-sm font-semibold text-gray-700 mb-2 block">Additional Notes</label>
                     <p className="text-gray-900">{selectedAppointment.appointment_notes}</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

       {/* Status Update Modal */}
       {showStatusModal && selectedAppointment && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-lg w-full shadow-2xl border border-white/20">
             <div className="p-8">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-2xl font-bold text-gray-900">Update Status</h3>
                   <p className="text-gray-600 mt-1">Choose the new status for this appointment</p>
                 </div>
                 <button
                   onClick={() => setShowStatusModal(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>
               
               <div className="space-y-6">
                 {/* Status Buttons */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-4">Select New Status</label>
                   <div className="grid grid-cols-1 gap-3">
                     {statusOptions.map(option => {
                       const Icon = option.icon;
                       const isSelected = newStatus === option.value;
                       return (
                         <button
                           key={option.value}
                           onClick={() => setNewStatus(option.value)}
                           className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                             isSelected
                               ? `border-${option.color}-300 bg-${option.color}-50 shadow-lg`
                               : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                           }`}
                         >
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${
                               isSelected 
                                 ? `bg-${option.color}-100 text-${option.color}-600` 
                                 : 'bg-gray-100 text-gray-600'
                             }`}>
                               <Icon className="w-5 h-5" />
                             </div>
                             <div className="text-left">
                               <p className={`font-semibold ${
                                 isSelected ? `text-${option.color}-900` : 'text-gray-900'
                               }`}>
                                 {option.label}
                               </p>
                               <p className={`text-sm ${
                                 isSelected ? `text-${option.color}-600` : 'text-gray-500'
                               }`}>
                                 {option.value === 'completed' && 'Mark appointment as completed'}
                                 {option.value === 're-scheduled' && 'Reschedule this appointment'}
                                 {option.value === 'did-not-show-up' && 'Mark as no-show'}
                               </p>
                             </div>
                           </div>
                           {isSelected && (
                             <div className={`w-6 h-6 rounded-full bg-${option.color}-500 flex items-center justify-center`}>
                               <Check className="w-4 h-4 text-white" />
                             </div>
                           )}
                         </button>
                       );
                     })}
                   </div>
                 </div>
                 
                 {/* Notes Section */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Notes</label>
                   <textarea
                     value={statusNote}
                     onChange={(e) => setStatusNote(e.target.value)}
                     placeholder="Add any additional notes or comments..."
                     rows={4}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                   />
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex justify-end gap-3 pt-4">
                   <button
                     onClick={() => setShowStatusModal(false)}
                     className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                   >
                     Cancel
                   </button>
                   {newStatus === 're-scheduled' ? (
                     <button
                       onClick={() => {
                         setShowStatusModal(false);
                         openRescheduleModal(selectedAppointment);
                       }}
                       className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                     >
                       Reschedule Appointment
                     </button>
                   ) : (
                     <button
                       onClick={updateAppointmentStatus}
                       disabled={!newStatus}
                       className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                     >
                       Update Status
                     </button>
                   )}
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Reschedule Modal */}
       {showRescheduleModal && selectedAppointment && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-lg w-full shadow-2xl border border-white/20">
             <div className="p-8">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h3>
                   <p className="text-gray-600 mt-1">Select a new date and time for this appointment</p>
                 </div>
                 <button
                   onClick={() => setShowRescheduleModal(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                 >
                   <X className="w-6 h-6" />
                 </button>
               </div>
               
               <div className="space-y-6">
                 {/* Appointment Info */}
                 <div className="bg-gray-50 rounded-xl p-4">
                   <h4 className="font-semibold text-gray-900 mb-2">Current Appointment</h4>
                   <p className="text-gray-700">
                     <strong>{selectedAppointment.first_name} {selectedAppointment.last_name}</strong>
                   </p>
                   <p className="text-sm text-gray-600">
                     Service: {selectedAppointment.service || 'Not specified'}
                   </p>
                 </div>
                 
                 {/* Date and Time Selection */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-3">New Date</label>
                     <input
                       type="date"
                       value={rescheduleDate}
                       onChange={(e) => setRescheduleDate(e.target.value)}
                       min={new Date().toISOString().split('T')[0]}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-3">New Time</label>
                     <input
                       type="time"
                       value={rescheduleTime}
                       onChange={(e) => setRescheduleTime(e.target.value)}
                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                     />
                   </div>
                 </div>
                 
                 {/* Notes Section */}
                 <div>
                   <label className="block text-sm font-semibold text-gray-700 mb-3">Reschedule Notes</label>
                   <textarea
                     value={statusNote}
                     onChange={(e) => setStatusNote(e.target.value)}
                     placeholder="Add any notes about the reschedule..."
                     rows={3}
                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                   />
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex justify-end gap-3 pt-4">
                   <button
                     onClick={() => setShowRescheduleModal(false)}
                     className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={rescheduleAppointment}
                     disabled={!rescheduleDate || !rescheduleTime}
                     className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                   >
                     Reschedule Appointment
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default TodaysAppointments;
