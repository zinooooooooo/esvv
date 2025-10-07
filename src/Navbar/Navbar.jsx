import { useState, useEffect, useCallback } from 'react';
import logo from '../assets/logo.png';
import { supabase } from '../supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { IoCheckmarkCircle, IoAlert, IoClose, IoNotifications, IoNotificationsOutline } from "react-icons/io5";
import AppointmentPDFPreview from '../components/AppointmentPDFPreview';
import { downloadAppointmentPDF } from '../services/pdfService';
import useSessionTimeout from '../hooks/useSessionTimeout';
import SessionTimeoutWarning from '../components/SessionTimeoutWarning';

const Modal = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;
  const isSuccess = type === 'success';
  const Icon = isSuccess ? IoCheckmarkCircle : IoAlert;
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[10001] p-4 backdrop-blur-xl">
      <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full border-2 ${borderColor}`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Icon className={`mr-3 ${iconColor}`} size={24} />
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IoClose size={24} />
            </button>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              isSuccess 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [selectedAppointmentForPDF, setSelectedAppointmentForPDF] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
 

  const fetchUserProfile = async (userId, logAudit = false) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Profile Error',
        message: 'Could not load your profile data. Please try again later.'
      });
      return;
    }

    const userType = data.role || 'unknown';
    setFullName(data.full_name || '');
    setRole(userType);

    if (logAudit) {
      await supabase.from("audit_logs").insert([
        {
          user_id: userId,
          user_type: userType,
          action: "LOGIN",
          location: location,
          date: new Date().toISOString(),
        },
      ]);

      if (data.role === "admin") {
        navigate("/AdminDashboard");
      } else if (data.role === "staff") {
        navigate("/staff");
      } else {
        navigate("/");
      }
    }
  };

  const handleLogin = async () => {
    // Prevent double submission
    if (submitting) return;
    
    if (password.length < 8) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Password Error",
        message: "Incorrect Password",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Login failed: " + error.message);
        return;
      }

      const user = data.user;
      // Mark that this tab initiated a fresh login to avoid kiosk auto-login
      try {
        sessionStorage.setItem('explicitLoginThisTab', '1');
      } catch (_) {}
      setUser(user);
      fetchUserProfile(user.id, true);
      setShowLogin(false);
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAppointments = async () => {
    console.log('fetchAppointments called, user:', user);
    if (!user) {
      console.log('No user found, returning early');
      return;
    }
  
    setLoadingAppointments(true);
    try {
      const userEmail = user.email;
      console.log('Fetching appointments for email:', userEmail);
      const allAppointments = [];
  
      const tables = [
        { name: 'pwd', label: 'PWD Services' },
        { name: 'senior_citizens', label: 'Senior Citizen Services' },
        { name: 'solo_parents', label: 'Solo Parent Services' },
        { name: 'financial_assistance', label: 'Financial Assistance' },
        { name: 'early_childhood', label: 'Early Childhood Care' },
        { name: 'youth_sector', label: 'Youth Sector' },
        { name: 'womens_sector', label: `Women's Sector` },
      ];
  
      for (let table of tables) {
        console.log(`Fetching from table: ${table.name}`);
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .eq('email', userEmail);
  
        if (error) {
          console.error(`Error fetching ${table.label}:`, error.message);
        } else {
          console.log(`Found ${data?.length || 0} appointments in ${table.name}`);
          data?.forEach(appointment => {
            const fullName = `${appointment.first_name || ''} ${appointment.middle_name || ''} ${appointment.last_name || ''}`.replace(/\s+/g, ' ').trim();
  
            allAppointments.push({
              ...appointment,
              service_type: table.label,
              table_source: table.name,
              full_name_combined: fullName
            });
          });
        }
      }
  
      console.log(`Total appointments found: ${allAppointments.length}`);
      allAppointments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAppointments(allAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  const handleAppointmentStatusClick = () => {
    console.log('handleAppointmentStatusClick called');
    setShowAppointmentModal(true);
    setShowProfileDropdown(false);
    fetchAppointments();
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'canceled':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return 'No time specified';
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDownloadPDF = (appointment) => {
    try {
      downloadAppointmentPDF(appointment);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to generate PDF. Please try again.'
      });
    }
  };

  const handlePreviewPDF = (appointment) => {
    setSelectedAppointmentForPDF(appointment);
    setShowPDFPreview(true);
  };

  const handleClosePDFPreview = () => {
    setShowPDFPreview(false);
    setSelectedAppointmentForPDF(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setFullName('');
    setRole('');
    setShowSessionWarning(false);
    try {
      sessionStorage.removeItem('explicitLoginThisTab');
    } catch (_) {}
  };

  // Session timeout configuration
  const sessionTimeoutConfig = {
    timeoutMinutes: 10,
    warningMinutes: 2,
    onLogout: handleLogout,
    isActive: !!user // Only active when user is logged in
  };

  const {
    timeLeft,
    showWarning,
    extendSession,
    formatTime: formatSessionTime
  } = useSessionTimeout(
    sessionTimeoutConfig.timeoutMinutes,
    sessionTimeoutConfig.warningMinutes,
    sessionTimeoutConfig.onLogout,
    sessionTimeoutConfig.isActive
  );

  // Handle session warning display
  useEffect(() => {
    if (showWarning && user) {
      setShowSessionWarning(true);
    } else {
      setShowSessionWarning(false);
    }
  }, [showWarning, user]);

  const handleExtendSession = () => {
    extendSession();
    setShowSessionWarning(false);
  };

  const handleCloseSessionWarning = () => {
    setShowSessionWarning(false);
  };

  // Notification functions
  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        return deletedNotification && !deletedNotification.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    setShowProfileDropdown(false);
    fetchNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <IoAlert className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <IoAlert className="w-5 h-5 text-yellow-500" />;
      default:
        return <IoNotifications className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  

  // Restore session on app load and keep state in sync with Supabase
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      // Validate session with Supabase instead of trusting local storage
      const { data, error } = await supabase.auth.getUser();
      // Debug logs for troubleshooting auto-login state
      try {
        console.log('[Auth] getUser error:', error);
        console.log('[Auth] getUser user:', data?.user);
        console.log('[Auth] explicitLoginThisTab:', sessionStorage.getItem('explicitLoginThisTab'));
      } catch (_) {}
      if (!isMounted) return;
      // Kiosk-safe behavior: if there is a persisted session but no explicit login in this tab, sign out
      const hasExplicitLogin = (() => {
        try { return sessionStorage.getItem('explicitLoginThisTab') === '1'; } catch (_) { return false; }
      })();
      // If recovery flow is happening in URL, treat as explicit for this tab
      const recoveryInUrl = (() => {
        try {
          const hash = window.location.hash || '';
          const search = window.location.search || '';
          return hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('recovery');
        } catch (_) { return false; }
      })();
      if (!hasExplicitLogin && data?.user) {
        if (recoveryInUrl) {
          try { sessionStorage.setItem('explicitLoginThisTab', '1'); } catch (_) {}
        }
        // Keep the session for non-explicit tabs to avoid cross-tab sign-outs.
        // We simply avoid logging audit or redirecting since logAudit is false below.
      }
      if (error || !data?.user) {
        setUser(null);
        setFullName('');
        setRole('');
        return;
      }
      setUser(data.user);
      console.log('User set in restoreSession:', data.user);
      fetchUserProfile(data.user.id, false);
    };
    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      try { console.log('[Auth] onAuthStateChange event:', _event, 'session user:', session?.user); } catch (_) {}
      if (_event === 'PASSWORD_RECOVERY') {
        // Supabase redirected back after the user clicked the email link
        setShowLogin(false);
        setShowForgotModal(false);
        setShowResetModal(true);
        setIsRecoverySession(true);
        try { sessionStorage.setItem('explicitLoginThisTab', '1'); } catch (_) {}
        if (session?.user?.email) {
          setResetEmail(session.user.email);
        }
        return;
      }
      if (session?.user) {
        console.log('Auth state change - setting user:', session.user);
        setUser(session.user);
        fetchUserProfile(session.user.id, false);
      } else {
        console.log('Auth state change - clearing user');
        setUser(null);
        setFullName('');
        setRole('');
        try { sessionStorage.removeItem('explicitLoginThisTab'); } catch (_) {}
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('New notification received:', payload);
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Notification updated:', payload);
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
          setUnreadCount(prev => {
            const oldNotification = payload.old;
            const newNotification = payload.new;
            if (!oldNotification.is_read && newNotification.is_read) {
              return Math.max(0, prev - 1);
            }
            return prev;
          });
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Notification deleted:', payload);
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          setUnreadCount(prev => {
            const deletedNotification = payload.old;
            return deletedNotification && !deletedNotification.is_read ? Math.max(0, prev - 1) : prev;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);
  
  if (role === 'admin' || role === 'staff') {
   return null;
  }

  return (
    <>
      <nav className={`fixed top-0 w-full bg-white/95 backdrop-blur-md z-[9999] transition-all duration-300 ${scrolled ? 'shadow-lg border-b border-gray-100' : 'shadow-sm'}`}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center">
            <img src={logo} alt="eSVMSWDO Logo" className="h-10" />
            <span className="ml-2 text-lg font-bold text-gray-900">eSVSMWDO</span>
          </div>

   
         
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={handleNotificationClick}
                    className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {unreadCount > 0 ? (
                      <IoNotifications className="w-6 h-6" />
                    ) : (
                      <IoNotificationsOutline className="w-6 h-6" />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Profile Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown((prev) => !prev)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center hover:shadow-lg transform hover:scale-105 transition-all duration-200 ring-2 ring-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  >
                    {fullName.charAt(0).toUpperCase()}
                  </button>
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl z-[10000] border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="p-4 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 truncate">{fullName}</p>
                        <p className="text-sm text-gray-500 capitalize">{role}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={handleAppointmentStatusClick}
                          className="group flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Appointment Status
                        </button>
                      
                        
                      </div>
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleLogout}
                          className="group flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2 text-sm font-medium transition duration-300 rounded-lg shadow hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                LOG IN
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-800 hover:bg-gray-100 hover:text-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md shadow-lg border-t border-gray-100">
            
            <div className="px-4 pt-4 pb-5 border-t border-gray-200 flex flex-col space-y-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-50 rounded-md">
                    {fullName} ({role})
                  </div>
                  <button
                    onClick={handleNotificationClick}
                    className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded text-left flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {unreadCount > 0 ? (
                        <IoNotifications className="w-5 h-5 mr-2 text-gray-600" />
                      ) : (
                        <IoNotificationsOutline className="w-5 h-5 mr-2 text-gray-600" />
                      )}
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={handleAppointmentStatusClick}
                    className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded text-left"
                  >
                    Appointment Status
                  </button>
             
                  <button onClick={handleLogout} className="px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded text-left">
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 text-sm font-medium rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  LOG IN
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xl z-[10001] p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-sm">Sign in to your account to continue</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.664-2.09A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.664 2.09A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.925-1.925M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c2.042 0 3.97.613 5.542 1.667M21.542 12c-1.274 4.057-5.065 7-9.542 7-2.042 0-3.97-.613-5.542-1.667" /></svg>
                    )}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setShowLogin(false); setResetEmail(email || ''); }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={submitting}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowLogin(false);
                  navigate('/signup');
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal - Request Email */}
      {showForgotModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xl z-[10001] p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => { setShowForgotModal(false); setShowLogin(true); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
              <p className="text-gray-600 text-sm">Enter your email and we'll send you a reset link.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <button
                disabled={isSubmitting}
                onClick={async () => {
                  if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
                    setModal({ isOpen: true, type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.' });
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                      redirectTo: `${window.location.origin}`,
                    });
                    if (error) throw error;
                    setModal({ isOpen: true, type: 'success', title: 'Reset Link Sent', message: 'Check your email for the password reset link.' });
                  } catch (err) {
                    setModal({ isOpen: true, type: 'error', title: 'Reset Failed', message: err.message || 'Could not send reset email.' });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending…' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setShowForgotModal(false); setShowResetModal(true); }}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Have a token? Enter code & new password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal - Enter Token & New Password */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xl z-[10001] p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => { setShowResetModal(false); setShowLogin(true); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter New Password</h2>
              <p className="text-gray-600 text-sm">set your new password.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              {!isRecoverySession && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Token / Code</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                    placeholder="Paste the token from your email link"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  placeholder="Re-enter new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>

              <button
                disabled={isSubmitting}
                onClick={async () => {
                  if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
                    setModal({ isOpen: true, type: 'error', title: 'Invalid Email', message: 'Please enter a valid email address.' });
                    return;
                  }
                  if (!isRecoverySession && !resetToken) {
                    setModal({ isOpen: true, type: 'error', title: 'Token Required', message: 'Please paste the token from your email.' });
                    return;
                  }
                  if (!newPassword || newPassword.length < 8) {
                    setModal({ isOpen: true, type: 'error', title: 'Weak Password', message: 'Password must be at least 8 characters long.' });
                    return;
                  }
                  if (newPassword !== confirmNewPassword) {
                    setModal({ isOpen: true, type: 'error', title: 'Password Mismatch', message: 'New password and confirmation do not match.' });
                    return;
                  }
                  setIsSubmitting(true);
                  try {
                    if (!isRecoverySession) {
                      const { error: verifyError } = await supabase.auth.verifyOtp({
                        email: resetEmail,
                        token: resetToken,
                        type: 'recovery',
                      });
                      if (verifyError) throw verifyError;
                    }

                    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
                    if (updateError) throw updateError;

                    setModal({ isOpen: true, type: 'success', title: 'Password Updated', message: 'Your password has been successfully updated.' });
                    setShowResetModal(false);
                    setShowLogin(true);
                    setPassword('');
                    setResetToken('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setIsRecoverySession(false);
                  } catch (err) {
                    setModal({ isOpen: true, type: 'error', title: 'Reset Failed', message: err.message || 'Invalid or expired token.' });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
              >
                {isSubmitting ? 'Updating…' : 'Verify & Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Status Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xl z-[10001] p-4">
          <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setShowAppointmentModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 z-10"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Appointments</h2>
                <p className="text-gray-600 text-sm">Track the status of your appointments</p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loadingAppointments ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading appointments...</span>
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
                    <p className="text-gray-500">You don't have any appointments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div
                        key={`${appointment.table_source}-${appointment.id}`}
                        className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {appointment.service || appointment.service_type || 'Service Application'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                  {appointment.status || 'Pending'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm font-medium">
                                  {appointment.full_name_combined}
                                </span>
                              </div>
                              
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-sm">
                                  {appointment.phone}
                                </span>
                              </div>

                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm">
                                  {appointment.barangay || 'Not specified'}
                                </span>
                              </div>

                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                <span className="text-sm">
                                  {appointment.id_type}: {appointment.id_number}
                                </span>
                              </div>
                            </div>

                            <div className="bg-white/60 rounded-lg p-4 border border-gray-200 space-y-2">
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">
                                  <span className="font-medium">Date:</span> {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('en-US') : 'Not set'}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">
                                  <span className="font-medium">Time:</span> {appointment.appointment_time || 'Not scheduled'}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h8m-8 4h6m2 4H5a2 2 0 01-2-2V7a2 2 0 012-2h11a2 2 0 012 2v13z" />
                                </svg>
                                <span className="text-sm">
                                  <span className="font-medium">Note:</span> {appointment.appointment_notes || 'No notes provided'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        


                            

                            {/* Decline Reason (only if declined) */}
                            {appointment.status?.toLowerCase() === 'declined' && (
                              <div className="flex items-center text-red-600">
                                <svg className="w-4 h-4 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                                </svg>
                                <span className="text-sm font-medium">
                                  Decline Reason: {appointment.decline_reason || 'Not provided'}
                                </span>
                              </div>
                            )}
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Applied: {new Date(appointment.created_at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            Service: {appointment.table_source?.replace('_', ' ')}
                          </div>
                        </div>

                        {/* PDF Download Buttons */}
                        <div className="flex items-center justify-end gap-2 mt-3">
                          <button
                            onClick={() => handlePreviewPDF(appointment)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(appointment)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-all duration-200 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-xl z-[10001] p-4">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300 max-h-[80vh] overflow-hidden">
            <button
              onClick={() => setShowNotifications(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-gray-400 z-10"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <IoNotifications className="w-6 h-6 text-blue-500 mr-2" />
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <IoNotificationsOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
                    <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                          notification.is_read 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-sm font-semibold ${
                                  notification.is_read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </h4>
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatNotificationTime(notification.created_at)}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${
                                notification.is_read ? 'text-gray-600' : 'text-gray-700'
                              }`}>
                                {notification.message}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  */}
      {showPDFPreview && selectedAppointmentForPDF && (
        <AppointmentPDFPreview
          appointment={selectedAppointmentForPDF}
          onClose={handleClosePDFPreview}
          onDownload={() => {
            handleClosePDFPreview();
            setModal({
              isOpen: true,
              type: 'success',
              title: 'PDF Downloaded',
              message: 'Your appointment form has been downloaded successfully!'
            });
          }}
        />
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />

      {/* Session Timeout Warning */}
      <SessionTimeoutWarning
        isVisible={showSessionWarning}
        timeLeft={formatSessionTime}
        onExtendSession={handleExtendSession}
        onClose={handleCloseSessionWarning}
        onLogout={handleLogout}
      />
    </>
  );
}