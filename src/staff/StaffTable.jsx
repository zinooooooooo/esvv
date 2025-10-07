import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle, X, ChevronDown, ChevronUp, Calendar, Clock, AlertCircle, CheckCircle2, AlertTriangle, MessageSquare, Archive, Eye } from "lucide-react";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";
import { notificationService } from "../services/notificationService";

const supabase = createClient(
  "https://eshktejqytwxwnpnimvq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGt0ZWpxeXR3eHducG5pbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTAxODgsImV4cCI6MjA1ODI2NjE4OH0.ILVbcWegUe4Ka1LdyObZ2J1edSJKMaRw7_AWUm68G5A"
);

const DataTable = () => {
  const [selectedTable, setSelectedTable] = useState("pwd");
  const [data, setData] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [imagePreviewData, setImagePreviewData] = useState({
    url: "",
    title: ""
  });
  const [notificationData, setNotificationData] = useState({
    type: "success", 
    title: "",
    message: ""
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "",
    notes: ""
  });
  const [noteForm, setNoteForm] = useState({
    note: ""
  });
  const [cancelNote, setCancelNote] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toasts, removeToast, showInfo } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedTable, showArchived]);

  // Set up real-time subscription for appointment updates
  useEffect(() => {
    if (!selectedTable) return;

    const subscription = supabase
      .channel(`appointments-${selectedTable}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: selectedTable
        }, 
        (payload) => {
          console.log('New appointment received:', payload);
          setData(prev => [payload.new, ...prev]);
          // Show toast notification for new appointments
          const appointment = payload.new;
          const fullName = [appointment.first_name, appointment.middle_name, appointment.last_name]
            .filter(Boolean).join(" ");
          showInfo(
            "New Appointment", 
            `${fullName} - ${appointment.service || 'Service Application'}`,
            5000
          );
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: selectedTable
        }, 
        (payload) => {
          console.log('Appointment updated:', payload);
          setData(prev => 
            prev.map(item => item.id === payload.new.id ? payload.new : item)
          );
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: selectedTable
        }, 
        (payload) => {
          console.log('Appointment deleted:', payload);
          setData(prev => prev.filter(item => item.id !== payload.old.id));
        }
      )
      .on('system', {}, (status) => {
        console.log('Real-time status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'error') {
          console.error('Real-time subscription failed. Please enable Realtime for the table in Supabase Dashboard.');
          showInfo(
            "Connection Issue", 
            "Real-time updates are not available. Please refresh the page.",
            8000
          );
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedTable]);

  const fetchData = async () => {
    const query = supabase.from(selectedTable).select("*");
    const { data, error } = showArchived
      ? await query.eq("archived", true)
      : await query.neq("archived", true);
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      setData(data);
    }
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setScheduleForm({
      date: appointment.appointment_date || "",
      time: appointment.appointment_time || "",
      notes: appointment.appointment_notes || ""
    });
    setNoteForm({
      note: appointment.appointment_notes || ""
    });
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAppointment(null);
  };

  const handleApproveSimple = async () => {
    if (!selectedAppointment) return;
    if (!noteForm.note.trim()) {
      showNotification("warning", "Note Required", "Please provide a note when approving the appointment.");
      return;
    }
    
    const { error } = await supabase
      .from(selectedTable)
      .update({ 
        status: "approved",
        appointment_notes: noteForm.note
      })
      .eq("id", selectedAppointment.id);
    if (error) {
      showNotification("error", "Update Failed", "Failed to approve appointment. Please try again.");
    } else {
      showNotification("success", "Approved", "Appointment approved successfully!");
      closeDetailsModal();
      fetchData();
    }
  };

  const handleDeclineSimple = async () => {
    if (!selectedAppointment) return;
    if (!noteForm.note.trim()) {
      showNotification("warning", "Note Required", "Please provide a reason for declining the appointment.");
      return;
    }
    
    const { error } = await supabase
      .from(selectedTable)
      .update({ 
        status: "declined",
        decline_reason: noteForm.note
      })
      .eq("id", selectedAppointment.id);
    if (error) {
      showNotification("error", "Update Failed", "Failed to decline appointment. Please try again.");
    } else {
      showNotification("success", "Declined", "Appointment declined successfully.");
      closeDetailsModal();
      fetchData();
    }
  };

  const handleScheduleFromDetails = async () => {
    if (!selectedAppointment) return;
    if (!scheduleForm.date || !scheduleForm.time) {
      showNotification("warning", "Missing Information", "Please select both date and time for the appointment.");
      return;
    }
    if (!scheduleForm.notes || !scheduleForm.notes.trim()) {
      showNotification("warning", "Note Required", "Please provide a note explaining the reschedule.");
      return;
    }

    const { error } = await supabase
      .from(selectedTable)
      .update({
        appointment_date: scheduleForm.date,
        appointment_time: scheduleForm.time,
        appointment_notes: scheduleForm.notes,
        status: "scheduled"
      })
      .eq("id", selectedAppointment.id);

    if (error) {
      console.error("Error scheduling appointment:", error);
      showNotification("error", "Scheduling Failed", "Failed to schedule appointment. Please try again.");
    } else {
      showNotification("success", "Appointment Scheduled", "The appointment has been scheduled successfully!");
      // Send notification to client with staff's note
      try {
        const serviceName = selectedAppointment.service || 'Service Application';
        const appointmentDate = new Date(scheduleForm.date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const appointmentTime = new Date(`2000-01-01T${scheduleForm.time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        await notificationService.createNotification(
          selectedAppointment.user_id,
          "Appointment Rescheduled",
          `Your appointment for ${serviceName} is rescheduled to ${appointmentDate} at ${appointmentTime}. *Note: ${scheduleForm.notes}`,
          "info",
          selectedAppointment.id,
          selectedTable
        );
      } catch (e) {
        console.error("Failed to send reschedule notification", e);
      }
      fetchData();
      closeDetailsModal();
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedData = [...data].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setData(sortedData);
  };

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const showNotification = (type, title, message) => {
    setNotificationData({ type, title, message });
    setShowNotificationModal(true);
  };

  const closeNotificationModal = () => {
    setShowNotificationModal(false);
  };

  // Helper function to check if appointment is scheduled for today
  const isAppointmentToday = (appointmentDate) => {
    if (!appointmentDate) return false;
    const today = new Date();
    const appointmentDateObj = new Date(appointmentDate);
    
    // Compare dates (ignore time)
    return today.toDateString() === appointmentDateObj.toDateString();
  };

  // Helper function to get allowed status options for today's appointments
  const getAllowedStatusOptions = (appointment) => {
    if (!isAppointmentToday(appointment.appointment_date)) {
      return []; // No status updates allowed for non-today appointments
    }
    
    // For today's appointments, only allow specific status updates
    return ['completed', 're-scheduled', 'did-not-show-up'];
  };

  const updateStatus = async (id, newStatus) => {
    // Find the appointment to check if it's scheduled for today
    const appointment = data.find(item => item.id === id);
    
    if (!appointment) {
      showNotification("error", "Update Failed", "Appointment not found.");
      return;
    }

    // Check if appointment is scheduled for today
    if (!isAppointmentToday(appointment.appointment_date)) {
      showNotification("error", "Update Restricted", "You can only update the status of appointments scheduled for today.");
      return;
    }

    // Check if the status is allowed for today's appointments
    const allowedStatuses = getAllowedStatusOptions(appointment);
    if (!allowedStatuses.includes(newStatus)) {
      showNotification("error", "Invalid Status", "For today's appointments, you can only set status to: Completed, Re-Scheduled, or Did Not Show Up.");
      return;
    }

    const { error } = await supabase
      .from(selectedTable)
      .update({ status: newStatus })
      .eq("id", id);
    if (error) {
      showNotification("error", "Update Failed", "Failed to update status. Please try again.");
    } else {
      if (newStatus === "approved") {
        
        const appointment = data.find(item => item.id === id);
        setSelectedAppointment(appointment);
        setNoteForm({ note: "" });
        setShowNoteModal(true);
      } else {
        // Send customized notification based on status
        await sendStatusNotification(appointment, newStatus);
        
        const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        showNotification("success", "Status Updated", `Appointment ${statusText.toLowerCase()} successfully!`);
        fetchData();
      }
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

      // Send notification to user using notification service
      await notificationService.createNotification(
        appointment.user_id,
        notificationTitle,
        notificationMessage,
        notificationType,
        appointment.id,
        selectedTable
      );
    } catch (error) {
      console.error('Error in sendStatusNotification:', error);
    }
  };

  const openDeclineModal = (appointment) => {
    setSelectedAppointment(appointment);
    setDeclineReason("");
    setShowDeclineModal(true);
  };

  const closeDeclineModal = () => {
    setShowDeclineModal(false);
    setSelectedAppointment(null);
    setDeclineReason("");
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      showNotification("warning", "Missing Information", "Please provide a reason for declining the appointment.");
      return;
    }

    const { error } = await supabase
      .from(selectedTable)
      .update({ 
        status: "declined",
        decline_reason: declineReason
      })
      .eq("id", selectedAppointment.id);

    if (error) {
      console.error("Error declining appointment:", error);
      showNotification("error", "Decline Failed", "Failed to decline appointment. Please try again.");
    } else {
      showNotification("success", "Appointment Declined", "The appointment has been declined successfully.");
      fetchData();
      closeDeclineModal();
    }
  };

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancelNote("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelNote("");
  };

  const handleCancel = async () => {
    if (!cancelNote.trim()) {
      showNotification("warning", "Missing Information", "Please provide a note explaining the cancellation.");
      return;
    }

    const { error } = await supabase
      .from(selectedTable)
      .update({ 
        status: "cancelled",
        appointment_notes: cancelNote
      })
      .eq("id", selectedAppointment.id);

    if (error) {
      console.error("Error cancelling appointment:", error);
      showNotification("error", "Cancellation Failed", "Failed to cancel appointment. Please try again.");
    } else {
      showNotification("success", "Appointment Cancelled", "The appointment has been cancelled.");
      try {
        const serviceName = selectedAppointment.service || 'Service Application';
        
        await notificationService.createNotification(
          selectedAppointment.user_id,
          "Appointment Cancelled",
          `Your appointment for ${serviceName} has been cancelled. *Note: ${cancelNote}`,
          "warning",
          selectedAppointment.id,
          selectedTable
        );
      } catch (e) {
        console.error("Failed to send cancellation notification", e);
      }
      fetchData();
      closeCancelModal();
      closeDetailsModal();
    }
  };

  const openScheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setScheduleForm({
      date: appointment.appointment_date || "",
      time: appointment.appointment_time || "",
      notes: appointment.appointment_notes || ""
    });
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedAppointment(null);
    setScheduleForm({ date: "", time: "", notes: "" });
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleForm.date || !scheduleForm.time) {
      showNotification("warning", "Missing Information", "Please select both date and time for the appointment.");
      return;
    }
    if (!scheduleForm.notes || !scheduleForm.notes.trim()) {
      showNotification("warning", "Note Required", "Please provide a note explaining the reschedule.");
      return;
    }

    const { error } = await supabase
      .from(selectedTable)
      .update({
        appointment_date: scheduleForm.date,
        appointment_time: scheduleForm.time,
        appointment_notes: scheduleForm.notes,
        status: "scheduled"
      })
      .eq("id", selectedAppointment.id);

    if (error) {
      console.error("Error scheduling appointment:", error);
      showNotification("error", "Scheduling Failed", "Failed to schedule appointment. Please try again.");
    } else {
      showNotification("success", "Appointment Scheduled", "The appointment has been scheduled successfully!");
      try {
        const serviceName = selectedAppointment.service || 'Service Application';
        const appointmentDate = new Date(scheduleForm.date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        const appointmentTime = new Date(`2000-01-01T${scheduleForm.time}`).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        await notificationService.createNotification(
          selectedAppointment.user_id,
          "Appointment Rescheduled",
          `Your appointment for ${serviceName} is rescheduled to ${appointmentDate} at ${appointmentTime}. *Note: ${scheduleForm.notes}`,
          "info",
          selectedAppointment.id,
          selectedTable
        );
      } catch (e) {
        console.error("Failed to send reschedule notification", e);
      }
      fetchData();
      closeScheduleModal();
    }
  };

  const openNoteModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNoteForm({ note: appointment.appointment_notes || "" });
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
    setSelectedAppointment(null);
    setNoteForm({ note: "" });
  };

  const handleNoteSubmit = async () => {
    if (!selectedAppointment.appointment_notes && !noteForm.note.trim()) {
      showNotification("warning", "Missing Information", "Please provide a note for the user.");
      return;
    }

    const { error } = await supabase
      .from(selectedTable)
      .update({
        appointment_notes: noteForm.note,
        status: "approved"
      })
      .eq("id", selectedAppointment.id);

    if (error) {
      console.error("Error adding note:", error);
      showNotification("error", "Note Failed", "Failed to add note. Please try again.");
    } else {
      const action = selectedAppointment.appointment_notes ? "updated" : "added";
      showNotification("success", "Note Updated", `Appointment note has been ${action} successfully!`);
      fetchData();
      closeNoteModal();
    }
  };

  const openImagePreview = (imageUrl, title) => {
    setImagePreviewData({ url: imageUrl, title });
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setImagePreviewData({ url: "", title: "" });
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "Not scheduled";
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTableDisplayName = (table) => {
    const names = {
      pwd: "PWD Records",
      senior_citizens: "Senior Citizens",
      solo_parents: "Solo Parents",
      financial_assistance: "Financial Assistance",
      early_childhood: "Early Childhood Care",
      youth_sector: "Youth Sector",
      womens_sector: "Women's Sector"
    };
    return names[table] || table;
  };

  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  const handleArchive = async () => {
    const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (selectedIds.length === 0) {
      showNotification("warning", "No Selection", "No rows selected for archiving.");
      return;
    }
    const { error } = await supabase
      .from(selectedTable)
      .update({ archived: true })
      .in("id", selectedIds.map(Number));
    if (error) {
      showNotification("error", "Archive Failed", "Failed to archive records. Please try again.");
    } else {
      showNotification("success", "Archived", "Records archived successfully.");
      fetchData();
      setSelectedRows({});
    }
  };

  const handleUnarchive = async () => {
    const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (selectedIds.length === 0) {
      showNotification("warning", "No Selection", "No rows selected for unarchiving.");
      return;
    }
    const { error } = await supabase
      .from(selectedTable)
      .update({ archived: false })
      .in("id", selectedIds.map(Number));
    if (error) {
      showNotification("error", "Unarchive Failed", "Failed to unarchive records. Please try again.");
    } else {
      showNotification("success", "Unarchived", "Records unarchived successfully.");
      fetchData();
      setSelectedRows({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Appointment</h1>
                <p className="text-sm text-gray-600">Appointments List</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-sm text-gray-600 font-medium">Live</span>
                </div>
                <div className="flex items-center gap-2">
                  
                </div>
              </div>
            </div>

          
            {/* Status Filter Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setStatusFilter("today")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "today" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setStatusFilter("pending")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "pending" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pending
                </button>
                <button 
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "all" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All Appointments
                </button>
                <button 
                  onClick={() => setStatusFilter("approved")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "approved" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Approved
                </button>
                <button 
                  onClick={() => setStatusFilter("rescheduled")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "rescheduled" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Re-Scheduled
                </button>
                <button 
                  onClick={() => setStatusFilter("declined")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "declined" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Declined
                </button>
                <button 
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    statusFilter === "cancelled" 
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {statusFilter === "all" ? "All Appointments" : 
                   statusFilter === "pending" ? "Pending Appointments" :
                   statusFilter === "approved" ? "Approved Appointments" :
                   statusFilter === "rescheduled" ? "Re-Scheduled Appointments" :
                   statusFilter === "declined" ? "Declined Appointments" :
                   statusFilter === "cancelled" ? "Cancelled Appointments" :
                   statusFilter === "today" ? "Today's Appointments" :
                   "All Appointments"} - {getTableDisplayName(selectedTable)}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {data.filter((row) => {
                    let matchesStatus = true;
                    if (statusFilter !== "all") {
                      const normalizedStatus = (row.status || "pending").toLowerCase();
                      switch (statusFilter) {
                        case "pending":
                          matchesStatus = normalizedStatus === "pending" || normalizedStatus === "Pending";
                          break;
                        case "approved":
                          matchesStatus = normalizedStatus === "approved" || normalizedStatus === "Active";
                          break;
                        case "declined":
                          matchesStatus = normalizedStatus === "declined" || normalizedStatus === "Declined";
                          break;
                        case "cancelled":
                          matchesStatus = normalizedStatus === "cancelled" || normalizedStatus === "Cancelled";
                          break;
                        case "rescheduled":
                          matchesStatus = normalizedStatus === "rescheduled" || normalizedStatus === "re-scheduled" || normalizedStatus === "Re-Scheduled";
                          break;
                        case "today":
                          // Filter for appointments scheduled today
                          if (row.appointment_date) {
                            const today = new Date();
                            const appointmentDate = new Date(row.appointment_date);
                            matchesStatus = appointmentDate.toDateString() === today.toDateString();
                          } else {
                            matchesStatus = false;
                          }
                          break;
                        default:
                          matchesStatus = true;
                      }
                    }
                    return matchesStatus;
                  }).length} appointments found
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Table Select */}
                <div className="relative">
                  <select 
                    value={selectedTable} 
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-40 text-sm"
                  >
                    <option value="pwd">PWD</option>
                    <option value="senior_citizens">Senior Citizens</option>
                    <option value="solo_parents">Solo Parents</option>
                    <option value="financial_assistance">Financial Assistance</option>
                    <option value="early_childhood">Early Childhood Care</option>
                    <option value="youth_sector">Youth Sector</option>
                    <option value="womens_sector">Women's Sector</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-gray-600 text-sm">Archived</label>
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => { setSelectedRows({}); setShowArchived(e.target.checked); }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    title="Toggle archived view"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Real-time Status Indicator */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-gray-600 text-sm font-medium">
                      {isConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                  
                  {selectedCount > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedCount} selected
                    </span>
                  )}
                  {!showArchived ? (
                    <button 
                      onClick={handleArchive}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-200"
                      title="Archive Selected"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleUnarchive}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors duration-200"
                      title="Unarchive Selected"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-8">✓</th>
                  <th 
                    onClick={() => handleSort("id")} 
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-12"
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortConfig.key === "id" && (
                        sortConfig.direction === "asc" ? 
                          <ChevronUp className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort("name")} 
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-200 w-32"
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortConfig.key === "name" && (
                        sortConfig.direction === "asc" ? 
                          <ChevronUp className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-24">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-32">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-16">Gender</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">Barangay</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">ID Type</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-24">ID Number</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-40">Service</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-24">Appt Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">Appt Time</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-24">Notes</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-24">Decline Reason</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">Front ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">Back ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 w-20">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {data.filter((row) => {
                  // Status filtering
                  let matchesStatus = true;
                  if (statusFilter !== "all") {
                    const normalizedStatus = (row.status || "pending").toLowerCase();
                    switch (statusFilter) {
                      case "pending":
                        matchesStatus = normalizedStatus === "pending" || normalizedStatus === "Pending";
                        break;
                      case "approved":
                        matchesStatus = normalizedStatus === "approved" || normalizedStatus === "Active";
                        break;
                      case "declined":
                        matchesStatus = normalizedStatus === "declined" || normalizedStatus === "Declined";
                        break;
                      case "cancelled":
                        matchesStatus = normalizedStatus === "cancelled" || normalizedStatus === "Cancelled";
                        break;
                      case "rescheduled":
                        matchesStatus = normalizedStatus === "rescheduled" || normalizedStatus === "re-scheduled" || normalizedStatus === "Re-Scheduled";
                        break;
                      case "today":
                        // Filter for appointments scheduled today
                        if (row.appointment_date) {
                          const today = new Date();
                          const appointmentDate = new Date(row.appointment_date);
                          matchesStatus = appointmentDate.toDateString() === today.toDateString();
                        } else {
                          matchesStatus = false;
                        }
                        break;
                      default:
                        matchesStatus = true;
                    }
                  }
                  return matchesStatus;
                }).map((row, index) => (
                  <tr 
                    key={row.id} 
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-all duration-200 hover:shadow-sm`}
                    onClick={() => openDetailsModal(row)}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={!!selectedRows[row.id]}
                        onChange={(e) => { e.stopPropagation(); toggleRowSelection(row.id); }}
                        className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs font-bold text-gray-900">#{row.id}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-700 truncate" title={[row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ")}>
                      {[row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate" title={row.phone}>{row.phone}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate" title={row.email}>{row.email}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-1 py-0.5 text-xs font-medium rounded-full ${
                        row.gender === 'Male' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {row.gender}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate" title={row.barangay}>{row.barangay}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate" title={row.id_type}>{row.id_type}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate" title={row.id_number}>{row.id_number}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 truncate" title={row.service}>{row.service || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-1 py-0.5 text-xs font-medium rounded-full ${
                        row.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : row.status === 'declined'
                          ? 'bg-red-100 text-red-800'
                          : row.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.status}
                      </span>
                      {row.archived && (
                        <span className="inline-flex ml-2 px-1 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700" title="Archived">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                        {row.appointment_date 
                          ? new Date(row.appointment_date).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric' 
                            }) 
                          : <span className="text-gray-400">—</span>
                        }
                      </td>

                      {/* Appointment Time */}
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {row.appointment_time 
                          ? new Date(`1970-01-01T${row.appointment_time}`).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            }) 
                          : <span className="text-gray-400">—</span>
                        }
                      </td>

                      {/* Appointment Notes */}
                      <td className="px-3 py-3 text-xs text-gray-600 truncate max-w-20" title={row.appointment_notes}>
                        {row.appointment_notes || <span className="text-gray-400">—</span>}
                      </td>

                      <td className="px-3 py-3 text-xs text-gray-600 truncate max-w-20" title={row.decline_reason}>
                        {row.decline_reason || ""}
                      </td>

                     {/* Front ID */}
                    <td className="px-3 py-3">
                       {row.front_id_url ? (
                         <div className="inline-block">
                           {row.front_id_url.toLowerCase().endsWith(".pdf") ? (
                             <a
                               href={row.front_id_url}
                               target="_blank"
                               rel="noopener noreferrer"
                              className="inline-flex px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors duration-200 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                             >
                               PDF
                             </a>
                           ) : (
                             <div 
                               className="w-8 h-6 border border-gray-200 rounded overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); openImagePreview(row.front_id_url, "Front ID"); }}
                             >
                               <img
                                 src={row.front_id_url}
                                 alt="Front ID"
                                 className="w-full h-full object-cover"
                               />
                             </div>
                           )}
                         </div>
                       ) : (
                         <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                           No File
                         </span>
                       )}
                     </td>

                     {/* Back ID */}
                     <td className="px-3 py-3">
                       {row.back_id_url ? (
                         <div className="inline-block">
                           {row.back_id_url.toLowerCase().endsWith(".pdf") ? (
                             <a
                               href={row.back_id_url}
                               target="_blank"
                               rel="noopener noreferrer"
                              className="inline-flex px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors duration-200 cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                             >
                               PDF
                             </a>
                           ) : (
                             <div 
                               className="w-8 h-6 border border-gray-200 rounded overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); openImagePreview(row.back_id_url, "Back ID"); }}
                             >
                               <img
                                 src={row.back_id_url}
                                 alt="Back ID"
                                 className="w-full h-full object-cover"
                               />
                             </div>
                           )}
                         </div>
                       ) : (
                         <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                           No File
                         </span>
                       )}
                     </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {/* Show different actions based on status */}
                        {row.status === "pending" && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "approved"); }}
                              className="group relative inline-flex items-center justify-center p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                              title="Approve"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openDeclineModal(row); }}
                              className="group relative inline-flex items-center justify-center p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                              title="Decline"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        
                        {row.status === "approved" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openNoteModal(row); }}
                            className="group relative inline-flex items-center justify-center p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            title="Add/Edit Notes"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        )}

                        {/* Edit schedule button for already scheduled appointments */}
                        {row.status === "scheduled" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openScheduleModal(row); }}
                            className="group relative inline-flex items-center justify-center p-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            title="Edit Schedule"
                          >
                            <Calendar className="w-3 h-3" />
                          </button>
                        )}

                        {/* Status update buttons for today's appointments */}
                        {isAppointmentToday(row.appointment_date) && (row.status === "scheduled" || row.status === "approved") && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "completed"); }}
                              className="group relative inline-flex items-center justify-center p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                              title="Mark as Completed"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "re-scheduled"); }}
                              className="group relative inline-flex items-center justify-center p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              title="Mark as Re-Scheduled"
                            >
                              <Calendar className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(row.id, "did-not-show-up"); }}
                              className="group relative inline-flex items-center justify-center p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                              title="Mark as Did Not Show Up"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black-60 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Re-Schedule Appointment
              </h2>
              <p className="text-blue-100 mt-1">
                {selectedAppointment?.name} (#{selectedAppointment?.id})
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Appointment Date
                </label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Appointment Time
                </label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reschedule Note *
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about the appointment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeScheduleModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleScheduleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black-60 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <X className="w-5 h-5" />
                Cancel Appointment
              </h2>
              <p className="text-red-100 mt-1">
                {selectedAppointment?.name} (#{selectedAppointment?.id})
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Cancellation *
                </label>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder="Please provide a reason for cancelling this appointment..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeCancelModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black-60 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-pulse">
            <div className={`p-6 rounded-t-2xl ${
              notificationData.type === 'success' 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                : notificationData.type === 'error'
                ? 'bg-gradient-to-r from-red-600 to-pink-600'
                : 'bg-gradient-to-r from-amber-600 to-orange-600'
            } text-white`}>
              <div className="flex items-center gap-3">
                {notificationData.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {notificationData.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {notificationData.type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                <h2 className="text-xl font-bold">{notificationData.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-slate-700 mb-6">{notificationData.message}</p>
              
              <button
                onClick={closeNotificationModal}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  notificationData.type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : notificationData.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black-60 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <X className="w-5 h-5" />
                Decline Appointment
              </h2>
              <p className="text-red-100 mt-1">
                {selectedAppointment?.name} (#{selectedAppointment?.id})
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason for Declining *
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please provide a clear reason for declining this appointment..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeDeclineModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black-60 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                             <h2 className="text-xl font-bold flex items-center gap-2">
                 <MessageSquare className="w-5 h-5" />
                 {selectedAppointment?.appointment_notes ? "Edit Appointment Note" : "Add Appointment Note"}
               </h2>
              <p className="text-blue-100 mt-1">
                {selectedAppointment?.name} (#{selectedAppointment?.id})
              </p>
            </div>

            <div className="p-6 space-y-4">
                             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">
                   Appointment Note {!selectedAppointment?.appointment_notes && "*"}
                 </label>
                <textarea
                  value={noteForm.note}
                  onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note for the user..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeNoteModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                                 <button
                   type="button"
                   onClick={handleNoteSubmit}
                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                 >
                   <MessageSquare className="w-4 h-4" />
                   {selectedAppointment?.appointment_notes ? "Update Note" : "Add Note"}
                 </button>
              </div>
            </div>
          </div>
                 </div>
       )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Appointment Details</h3>
                  <p className="text-gray-600 mt-1">Complete information about this appointment</p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedAppointment.archived ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const { error } = await supabase
                          .from(selectedTable)
                          .update({ archived: true })
                          .eq("id", selectedAppointment.id);
                        if (error) {
                          showNotification("error", "Archive Failed", "Failed to archive record. Please try again.");
                        } else {
                          showNotification("success", "Archived", "Record archived.");
                          fetchData();
                          closeDetailsModal();
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 inline-flex items-center gap-2"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const { error } = await supabase
                          .from(selectedTable)
                          .update({ archived: false })
                          .eq("id", selectedAppointment.id);
                        if (error) {
                          showNotification("error", "Unarchive Failed", "Failed to unarchive record. Please try again.");
                        } else {
                          showNotification("success", "Unarchived", "Record unarchived.");
                          fetchData();
                          closeDetailsModal();
                        }
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 inline-flex items-center gap-2"
                      title="Unarchive"
                    >
                      <Eye className="w-4 h-4" />
                      Unarchive
                    </button>
                  )}
                  <button
                    onClick={closeDetailsModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Full Name</label>
                    <p className="text-gray-900 font-medium">{[selectedAppointment.first_name, selectedAppointment.middle_name, selectedAppointment.last_name].filter(Boolean).join(" ")}</p>
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
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Appointment Date</label>
                    <p className="text-gray-900 font-medium">{selectedAppointment.appointment_date ? new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Not scheduled'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Appointment Time</label>
                    <p className="text-gray-900 font-medium">{selectedAppointment.appointment_time ? new Date(`1970-01-01T${selectedAppointment.appointment_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not scheduled'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Status</label>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedAppointment.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedAppointment.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : selectedAppointment.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
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

                {selectedAppointment.decline_reason && (
                  <div className="bg-red-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Decline Reason</label>
                    <p className="text-gray-900">{selectedAppointment.decline_reason}</p>
                  </div>
                )}

                {/* ID Previews */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 text-gray-700 text-sm font-medium">Front ID</div>
                    <div className="p-4 flex items-center justify-center bg-white min-h-36">
                      {selectedAppointment.front_id_url ? (
                        selectedAppointment.front_id_url.toLowerCase().endsWith('.pdf') ? (
                          <a
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
                            href={selectedAppointment.front_id_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PDF
                          </a>
                        ) : (
                          <img
                            onClick={() => openImagePreview(selectedAppointment.front_id_url, 'Front ID')}
                            src={selectedAppointment.front_id_url}
                            alt="Front ID"
                            className="max-h-48 max-w-full object-contain rounded-md cursor-zoom-in shadow"
                          />
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 text-gray-700 text-sm font-medium">Back ID</div>
                    <div className="p-4 flex items-center justify-center bg-white min-h-36">
                      {selectedAppointment.back_id_url ? (
                        selectedAppointment.back_id_url.toLowerCase().endsWith('.pdf') ? (
                          <a
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm"
                            href={selectedAppointment.back_id_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PDF
                          </a>
                        ) : (
                          <img
                            onClick={() => openImagePreview(selectedAppointment.back_id_url, 'Back ID')}
                            src={selectedAppointment.back_id_url}
                            alt="Back ID"
                            className="max-h-48 max-w-full object-contain rounded-md cursor-zoom-in shadow"
                          />
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">No file</span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedAppointment.status === 'pending' ? (
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Decision Note *</label>
                      <textarea
                        value={noteForm.note}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, note: e.target.value }))}
                        placeholder="Please provide a note explaining your decision..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        required
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleDeclineSimple}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={handleApproveSimple}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    </div>
                  </div>
                ) : selectedAppointment.status === 'approved' ? (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => openCancelModal(selectedAppointment)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                      Cancel Appointment
                    </button>
                    <button
                      type="button"
                      onClick={() => openScheduleModal(selectedAppointment)}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Calendar className="w-4 h-4" />
                      Reschedule Appointment
                    </button>
                  </div>
                ) : selectedAppointment.status === 'scheduled' ? (
                  <div className="pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Date</label>
                        <input
                          type="date"
                          value={scheduleForm.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Appointment Time</label>
                        <input
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, time: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Reschedule Note *</label>
                        <input
                          type="text"
                          value={scheduleForm.notes}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Add a note"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => openCancelModal(selectedAppointment)}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <X className="w-4 h-4" />
                        Cancel Appointment
                      </button>
                      <button
                        type="button"
                        onClick={handleScheduleFromDetails}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Clock className="w-4 h-4" />
                        Save Schedule
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Image Preview Modal */}
       {showImagePreview && (
         <div className="fixed inset-0 bg-black-60 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[100]">
           <div className="bg-white rounded-2xl shadow-xl max-w-4xl max-h-[90vh] mx-4 overflow-hidden">
             <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 flex justify-between items-center">
               <h2 className="text-lg font-bold">{imagePreviewData.title}</h2>
               <button
                 onClick={closeImagePreview}
                 className="text-white hover:text-gray-300 transition-colors duration-200"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
               <img
                 src={imagePreviewData.url}
                 alt={imagePreviewData.title}
                 className="w-full h-auto max-w-full object-contain"
               />
             </div>
           </div>
         </div>
       )}

       {/* Toast Notifications */}
       <ToastContainer toasts={toasts} onRemove={removeToast} />
     </div>
   );
 };
 
 export default DataTable;