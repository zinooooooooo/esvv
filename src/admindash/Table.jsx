import { useState, useEffect } from "react";
import { Archive, Search, ChevronDown, ChevronUp, X, Eye } from "lucide-react";
import { supabase } from "../supabase";
import { useToast } from "../hooks/useToast";
import ToastContainer from "../components/ToastContainer";

const DataTable = () => {
  const [selectedTable, setSelectedTable] = useState("pwd");
  const [data, setData] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: "", title: "" });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
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
      .channel(`admin-appointments-${selectedTable}`)
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
    const query = supabase
      .from(selectedTable)
      .select("*");
    const { data, error } = showArchived
      ? await query.eq("archived", true)
      : await query.neq("archived", true);
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      setData(data);
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

  const handleArchive = async () => {
    const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (selectedIds.length === 0) {
      alert("No rows selected for archiving.");
      return;
    }
    const { error } = await supabase
      .from(selectedTable)
      .update({ archived: true })
      .in("id", selectedIds.map(Number));
    if (error) {
      console.error("Archive Error:", error);
      alert("Failed to archive records.");
    } else {
      alert("Records archived successfully.");
      fetchData();
      setSelectedRows({});
    }
  };

  const handleUnarchive = async () => {
    const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (selectedIds.length === 0) {
      alert("No rows selected for unarchiving.");
      return;
    }
    const { error } = await supabase
      .from(selectedTable)
      .update({ archived: false })
      .in("id", selectedIds.map(Number));
    if (error) {
      console.error("Unarchive Error:", error);
      alert("Failed to unarchive records.");
    } else {
      alert("Records unarchived successfully.");
      fetchData();
      setSelectedRows({});
    }
  };

  const filteredData = data.filter((row) => {
    const fullName = [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = (
      fullName.includes(searchQuery.toLowerCase()) ||
      row.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
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
          matchesStatus = normalizedStatus === "rescheduled" || normalizedStatus === "Re-Scheduled";
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
    
    return matchesSearch && matchesStatus;
  });

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

  const openImageModal = (imageUrl, title) => {
    setImageModal({ isOpen: true, imageUrl, title });
  };

  const closeImageModal = () => {
    setImageModal({ isOpen: false, imageUrl: "", title: "" });
  };

  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailsModal({ isOpen: true });
  };

  const closeDetailsModal = () => {
    setDetailsModal({ isOpen: false });
    setSelectedAppointment(null);
  };

  const archiveSingle = async (archived) => {
    if (!selectedAppointment) return;
    const { error } = await supabase
      .from(selectedTable)
      .update({ archived })
      .eq("id", selectedAppointment.id);
    if (error) {
      alert(archived ? "Failed to archive record." : "Failed to unarchive record.");
    } else {
      alert(archived ? "Record archived." : "Record unarchived.");
      fetchData();
      closeDetailsModal();
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
                  {filteredData.length} appointments found
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
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-8">✓</th>
                <th 
                  onClick={() => handleSort("id")} 
                  className="px-3 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors duration-200 w-12"
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
                  className="px-3 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors duration-200 w-32"
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
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-40">Service</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-24">Phone</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-32">Email</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-16">Gender</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-20">Barangay</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-20">Status</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-24">Appt Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-20">Appt Time</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-24">Notes</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-24">Decline Reason</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-20">Front ID</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 w-20">Back ID</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredData.map((row, index) => (
                <tr
                  key={row.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
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

                  <td className="px-3 py-3 text-xs font-bold text-slate-900">#{row.id}</td>
                  <td className="px-3 py-3 text-xs font-medium text-slate-700 truncate" title={[row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ")}>
                    {[row.first_name, row.middle_name, row.last_name].filter(Boolean).join(" ")}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 truncate" title={row.service}>{row.service || <span className="text-slate-400">—</span>}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 truncate" title={row.phone}>{row.phone}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 truncate" title={row.email}>{row.email}</td>

                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex px-1 py-0.5 text-xs font-medium rounded-full ${
                        row.gender === "Male"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-pink-100 text-pink-800"
                      }`}
                    >
                      {row.gender}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600 truncate" title={row.barangay}>{row.barangay}</td>

                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex px-1 py-0.5 text-xs font-medium rounded-full ${
                        row.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : row.status === "Declined"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {row.status}
                    </span>
                    {row.archived && (
                      <span className="inline-flex ml-2 px-1 py-0.5 text-xs font-medium rounded-full bg-slate-200 text-slate-700" title="Archived">
                        Archived
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600">
                    {row.appointment_date 
                      ? new Date(row.appointment_date).toLocaleDateString('en-US', { 
                          month: 'short', day: 'numeric' 
                        }) 
                      : <span className="text-slate-400">—</span>
                    }
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600">
                    {row.appointment_time 
                      ? new Date(`1970-01-01T${row.appointment_time}`).toLocaleTimeString([], { 
                          hour: '2-digit', minute: '2-digit' 
                        }) 
                      : <span className="text-slate-400">—</span>
                    }
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-20" title={row.appointment_notes}>
                    {row.appointment_notes || <span className="text-slate-400">—</span>}
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-600 truncate max-w-20" title={row.decline_reason}>
                    {row.status === "Declined" && row.decline_reason ? (
                      row.decline_reason
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {row.front_id_url ? (
                      row.front_id_url.toLowerCase().endsWith(".pdf") ? (
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
                          className="w-8 h-6 border border-slate-200 rounded overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); openImageModal(row.front_id_url, "Front ID"); }}
                        >
                          <img
                            src={row.front_id_url}
                            alt="Front Valid ID"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    ) : (
                      <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        No File
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {row.back_id_url ? (
                      row.back_id_url.toLowerCase().endsWith(".pdf") ? (
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
                          className="w-8 h-6 border border-slate-200 rounded overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); openImageModal(row.back_id_url, "Back ID"); }}
                        >
                          <img
                            src={row.back_id_url}
                            alt="Back Valid ID"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    ) : (
                      <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        No File
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black-60 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">{imageModal.title}</h3>
              <button
                onClick={closeImageModal}
                className="p-2 text-white hover:text-gray-300 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={imageModal.imageUrl}
                alt={imageModal.title}
                className="w-full h-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Read-only Details Modal */}
      {detailsModal.isOpen && selectedAppointment && (
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
                      onClick={() => archiveSingle(true)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 inline-flex items-center gap-2"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => archiveSingle(false)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 inline-flex items-center gap-2"
                      title="Unarchive"
                    >
                      <Eye className="w-4 h-4" />
                      Unarchive
                    </button>
                  )}
                  <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
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
                            onClick={() => openImageModal(selectedAppointment.front_id_url, 'Front ID')}
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
                            onClick={() => openImageModal(selectedAppointment.back_id_url, 'Back ID')}
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
              </div>
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