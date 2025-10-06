import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Table from "./Table";
import UserManagement from "./UserManagement";
import { supabase } from "../supabase";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  UserCheck,
  CalendarCheck,
  CalendarX,
  Activity
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [analytics, setAnalytics] = useState({
    totalAppointments: 0,
    activeUsers: 0,
    totalUsers: 0,
    scheduledAppointments: 0,
    pendingAppointments: 0,
    lastAppointment: null,
    recentAppointments: [],
    monthlyStats: [],
    todaysAppointments: [],
    todaysAppointmentsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch user data from profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      const totalUsers = profilesData?.length || 0;
      const activeUsers = profilesData?.filter(user => user.status === 'Active').length || 0;

      const tables = ['pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector'];
      
      let totalAppointments = 0;
      let scheduledAppointments = 0;
      let pendingAppointments = 0;
      let allAppointments = [];
      let todaysAppointments = [];
      let todaysAppointmentsCount = 0;

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .neq('archived', true);

        if (!error && data) {
    
          const appointmentsInTable = data.filter(user => user.appointment_date).length;
          totalAppointments += appointmentsInTable;

        
          const scheduledInTable = data.filter(user => 
            user.appointment_date && user.appointment_time && user.status !== 'Declined'
          ).length;
          scheduledAppointments += scheduledInTable;

          
          const pendingInTable = data.filter(user => 
            user.appointment_date && (!user.status || user.status === 'Pending')
          ).length;
          pendingAppointments += pendingInTable;

          
          const appointmentsWithTable = data
            .filter(user => user.appointment_date)
            .map(user => ({
              ...user,
              table_name: table,
              full_name: [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(" ")
            }));
          
          allAppointments.push(...appointmentsWithTable);
        }
      }

     
      const sortedAppointments = allAppointments
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
      
      const lastAppointment = sortedAppointments[0] || null;

      
      const recentAppointments = sortedAppointments.slice(0, 5);

      // Get today's appointments
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      todaysAppointments = allAppointments.filter(apt => apt.appointment_date === today);
      todaysAppointmentsCount = todaysAppointments.length;

      const monthlyStats = generateMonthlyStats(allAppointments);

      setAnalytics({
        totalAppointments,
        activeUsers,
        totalUsers,
        scheduledAppointments,
        pendingAppointments,
        lastAppointment,
        recentAppointments,
        monthlyStats,
        todaysAppointments,
        todaysAppointmentsCount
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const monthName = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${monthName} ${day}, ${year}`;
  };

  const generateMonthlyStats = (appointments) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === date.getMonth() && aptDate.getFullYear() === date.getFullYear();
      });

      months.push({
        month: monthName,
        year: year,
        count: monthAppointments.length
      });
    }
    
    return months;
  };

  const renderAnalytics = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 p-6">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Overview of your system's performance and user activity</p>
        </div>

 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Appointments</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalAppointments}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.activeUsers}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.totalUsers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Scheduled Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Scheduled</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.scheduledAppointments}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <CalendarCheck className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.pendingAppointments}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {analytics.totalAppointments > 0 
                    ? Math.round((analytics.scheduledAppointments / analytics.totalAppointments) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Appointments Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Today's Appointments</h3>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-600">{new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Count */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Appointments Today</p>
                  <p className="text-3xl font-bold text-blue-900">{analytics.todaysAppointmentsCount}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Quick Summary */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-medium text-slate-700 mb-4">Quick Summary</h4>
              {analytics.todaysAppointments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics.todaysAppointments.map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{appointment.full_name}</p>
                        <p className="text-sm text-slate-600">{appointment.service || 'Service Application'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            {appointment.appointment_time 
                              ? new Date(`1970-01-01T${appointment.appointment_time}`).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : 'No time set'
                            }
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.status === 'approved' || appointment.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : appointment.status === 'declined' || appointment.status === 'Declined'
                            ? 'bg-red-100 text-red-800'
                            : appointment.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts and Additional Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Appointments</h3>
            <div className="space-y-3">
              {analytics.monthlyStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{stat.month} {stat.year}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((stat.count / Math.max(...analytics.monthlyStats.map(s => s.count))) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-8 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Appointment */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Last Appointment</h3>
            {analytics.lastAppointment ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{analytics.lastAppointment.full_name}</p>
                    <p className="text-sm text-slate-600 capitalize">{analytics.lastAppointment.table_name.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Date</p>
                    <p className="font-medium text-slate-900">{formatDate(analytics.lastAppointment.appointment_date)}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Time</p>
                    <p className="font-medium text-slate-900">{analytics.lastAppointment.appointment_time || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    analytics.lastAppointment.status === 'Active' ? 'bg-green-100 text-green-800' :
                    analytics.lastAppointment.status === 'Declined' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {analytics.lastAppointment.status || 'Pending'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No appointments found</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Appointments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Appointments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analytics.recentAppointments.map((appointment, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{appointment.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600 capitalize">{appointment.table_name.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{formatDate(appointment.appointment_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{appointment.appointment_time || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        appointment.status === 'Active' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'Declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analytics.recentAppointments.length === 0 && (
            <div className="text-center py-8">
              <CalendarX className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No recent appointments</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "analytics":
        return renderAnalytics();
      case "appointments":
        return <Table />;
      case "users":
        return <UserManagement />;
      default:
        return renderAnalytics();
    }
  };

  return (
    <div className="flex">
      <Sidebar setActiveTab={setActiveTab} />
      <div className="ml-64 w-full">{renderContent()}</div>
    </div>
  );
};

export default AdminDashboard;
