import React, { useState, useEffect } from "react";
import {
  IoIosPerson,
  IoIosMail,
  IoIosPeople,
  IoIosLock,
  IoIosSearch,
} from "react-icons/io";
import { TextField, IconButton, Button } from "@mui/material";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://eshktejqytwxwnpnimvq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGt0ZWpxeXR3eHducG5pbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTAxODgsImV4cCI6MjA1ODI2NjE4OH0.ILVbcWegUe4Ka1LdyObZ2J1edSJKMaRw7_AWUm68G5A"
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("archived", false);
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data);
    }
  };

  const fetchArchivedUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("archived", true);
    if (error) {
      console.error("Error fetching archived users:", error);
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    if (showArchived) {
      fetchArchivedUsers();
    } else {
      fetchUsers();
    }
  }, [showArchived]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError) {
        console.error("Error signing up user:", signUpError.message);
        setError(signUpError.message);
        return;
      }

      const user = data.user;
      if (!user || !user.id) {
        console.error("User ID not found after sign-up.");
        setError("User ID not found.");
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: form.name,
          email: form.email,
          role: form.role,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("Error inserting into profiles:", insertError.message);
        setError("Failed to save profile.");
        return;
      }

      await fetchUsers();
      setForm({ name: "", email: "", password: "", role: "staff" });
      setShowForm(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    setConfirmAction(() => () => performArchive(id));
    setConfirmTitle("Archive User");
    setConfirmMessage("Are you sure you want to archive this user? They will be hidden from the active users list.");
    setShowConfirmModal(true);
  };

  const performArchive = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({ archived: true })
      .eq("id", id);
    
    if (error) {
      console.error("Error archiving user:", error);
    } else {
      setUsers((prev) => prev.filter((user) => user.id !== id));
    }
  };

  const handleUnarchive = async (id) => {
    setConfirmAction(() => () => performUnarchive(id));
    setConfirmTitle("Unarchive User");
    setConfirmMessage("Are you sure you want to unarchive this user? They will be restored to the active users list.");
    setShowConfirmModal(true);
  };

  const performUnarchive = async (id) => {
    const { error } = await supabase
      .from("profiles")
      .update({ archived: false })
      .eq("id", id);
    
    if (error) {
      console.error("Error unarchiving user:", error);
    } else {
      setUsers((prev) => prev.filter((user) => user.id !== id));
    }
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // Handle keyboard events and body scroll
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showConfirmModal) {
        if (event.key === 'Escape') {
          handleCancel();
        } else if (event.key === 'Enter') {
          handleConfirm();
        }
      }
    };

    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal]);

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage staff accounts and permissions
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Button
            variant="contained"
            onClick={() => setShowForm(!showForm)}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              borderRadius: "12px",
              padding: "12px 24px",
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 600,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
              },
              transition: "all 0.3s ease",
            }}
            startIcon={showForm ? <CloseIcon /> : <AddIcon />}
          >
            {showForm ? "Close Menu" : "Add Staff Member"}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              setShowArchived(!showArchived);
              setSearchTerm(""); // Reset search when switching views
            }}
            sx={{
              borderColor: showArchived ? "#f59e0b" : "#6b7280",
              color: showArchived ? "#f59e0b" : "#6b7280",
              borderRadius: "12px",
              padding: "12px 24px",
              textTransform: "none",
              fontSize: "16px",
              fontWeight: 600,
              "&:hover": {
                borderColor: showArchived ? "#d97706" : "#4b5563",
                backgroundColor: showArchived ? "#fef3c7" : "#f9fafb",
                transform: "translateY(-2px)",
              },
              transition: "all 0.3s ease",
            }}
            startIcon={showArchived ? <VisibilityOffIcon /> : <VisibilityIcon />}
          >
            {showArchived ? "View Active Users" : "View Archived Users"}
          </Button>
        </div>

        {showForm && (
          <div className="bg-white p-8 rounded-2xl shadow-2xl mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <IoIosPerson className="text-blue-600" size={28} />
              Create New Staff Account
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <IoIosPerson size={20} className="text-gray-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <IoIosMail size={20} className="text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <IoIosLock size={20} className="text-gray-500" />
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <IoIosPeople size={20} className="text-gray-500" />
                  Role
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Staff Account"}
                </button>
                {error && (
                  <p className="text-red-500 mt-2 font-medium">{error}</p>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {showArchived ? "Archived Staff Members" : "Staff Members"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {showArchived ? "Manage archived staff accounts" : "Manage existing staff accounts"}
                </p>
              </div>
              <div className="relative">
                <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={showArchived ? "Search archived staff members..." : "Search staff members..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <IoIosPeople className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 text-lg">
                {showArchived ? "No archived staff members found." : "No staff members found."}
              </p>
              <p className="text-gray-400 mt-2">
                {showArchived 
                  ? "All users are currently active or try adjusting your search." 
                  : "Try adjusting your search or add a new staff member."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const fullName = user.full_name || "";
                    const initial = fullName.charAt(0).toUpperCase() || "U";
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 ${showArchived ? 'bg-amber-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {initial}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {fullName}
                                {showArchived && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                                    Archived
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {showArchived ? (
                            <IconButton
                              onClick={() => handleUnarchive(user.id)}
                              sx={{
                                color: "#10b981",
                                "&:hover": {
                                  backgroundColor: "#d1fae5",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                              }}
                              title="Unarchive User"
                            >
                              <UnarchiveIcon />
                            </IconButton>
                          ) : (
                            <IconButton
                              onClick={() => handleArchive(user.id)}
                              sx={{
                                color: "#f59e0b",
                                "&:hover": {
                                  backgroundColor: "#fef3c7",
                                  transform: "scale(1.1)",
                                },
                                transition: "all 0.2s ease",
                              }}
                              title="Archive User"
                            >
                              <ArchiveIcon />
                            </IconButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-black-60  backdrop-blur-md"
            onClick={handleCancel}
          />
          
          {/* Modal Content */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out animate-in zoom-in-95 fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <div className="p-6">
              <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full ${
                confirmTitle === 'Archive User' 
                  ? 'bg-amber-100' 
                  : 'bg-green-100'
              }`}>
                {confirmTitle === 'Archive User' ? (
                  <ArchiveIcon className="w-6 h-6 text-amber-600" />
                ) : (
                  <UnarchiveIcon className="w-6 h-6 text-green-600" />
                )}
              </div>
              
              <h3 id="modal-title" className="text-lg font-semibold text-gray-900 text-center mb-2">
                {confirmTitle}
              </h3>
              
              <p id="modal-description" className="text-gray-600 text-center mb-6 leading-relaxed">
                {confirmMessage}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                    confirmTitle === 'Archive User'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {confirmTitle === 'Archive User' ? 'Archive' : 'Unarchive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
