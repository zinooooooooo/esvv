import React, { useState, useEffect } from "react";
import StaffSidebar from "./StaffSidebar";
import DataTable from "./StaffTable";
import TodaysAppointments from "./TodaysAppointments";
import logo from "../assets/logo.png";
import { createClient } from "@supabase/supabase-js";
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  UserX,
  CalendarDays,
  Clock4
} from "lucide-react";

const supabase = createClient(
  "https://eshktejqytwxwnpnimvq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaGt0ZWpxeXR3eHducG5pbXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2OTAxODgsImV4cCI6MjA1ODI2NjE4OH0.ILVbcWegUe4Ka1LdyObZ2J1edSJKMaRw7_AWUm68G5A"
);

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [analytics, setAnalytics] = useState({
    totalAppointments: 0,
    rejectedAppointments: 0,
    approvedAppointments: 0,
    scheduledAppointments: 0,
    pendingAppointments: 0,
    lastAppointment: null,
    recentAppointments: [],
    statusDistribution: {},
    monthlyTrends: [],
    todaysAppointments: [],
    todaysAppointmentsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("pwd");

  useEffect(() => {
    if (activeTab === "home") {
      fetchAnalytics();
    }
  }, [activeTab, selectedTable]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch data from all tables
      const tables = ["pwd", "senior_citizens", "solo_parents", "financial_assistance", "early_childhood", "youth_sector", "womens_sector"];
      let allData = [];

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select("*");
        if (!error && data) {
          allData = [...allData, ...data.map(item => ({ ...item, source_table: table }))];
        }
      }

      // Calculate analytics
      const totalAppointments = allData.length;
      const rejectedAppointments = allData.filter(item => item.status === "declined").length;
      const approvedAppointments = allData.filter(item => item.status === "approved").length;
      const scheduledAppointments = allData.filter(item => item.status === "scheduled").length;
      const pendingAppointments = allData.filter(item => item.status === "pending").length;

      // Get last appointment
      const appointmentsWithDate = allData.filter(item => item.appointment_date);
      const lastAppointment = appointmentsWithDate.length > 0 
        ? appointmentsWithDate.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))[0]
        : null;

      // Get recent appointments (last 5)
      const recentAppointments = appointmentsWithDate
        .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
        .slice(0, 5);

      // Get today's appointments
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const todaysAppointments = appointmentsWithDate.filter(apt => apt.appointment_date === today);
      const todaysAppointmentsCount = todaysAppointments.length;

      // Status distribution
      const statusDistribution = {
        pending: pendingAppointments,
        approved: approvedAppointments,
        scheduled: scheduledAppointments,
        declined: rejectedAppointments
      };

      // Monthly trends (last 6 months)
      const monthlyTrends = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = month.toISOString().split('T')[0];
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
        
        const monthData = allData.filter(item => 
          item.appointment_date && 
          item.appointment_date >= monthStart && 
          item.appointment_date <= monthEnd
        );

        monthlyTrends.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          count: monthData.length,
          date: monthStart
        });
      }

      setAnalytics({
        totalAppointments,
        rejectedAppointments,
        approvedAppointments,
        scheduledAppointments,
        pendingAppointments,
        lastAppointment,
        recentAppointments,
        statusDistribution,
        monthlyTrends,
        todaysAppointments,
        todaysAppointmentsCount
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4">
          {trend > 0 ? (
            <ArrowUpRight className="w-4 h-4 text-green-500" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ml-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend)}% from last month
          </span>
        </div>
      )}
    </div>
  );

  const StatusCard = ({ status, count, total, color, icon: Icon }) => {
    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{count}</span>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 capitalize">{status}</span>
            <span className="text-gray-900 font-medium">{percentage}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${color.replace('bg-', 'bg-').replace('text-white', '')}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const RecentAppointmentCard = ({ appointment }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">
          {[appointment.first_name, appointment.middle_name, appointment.last_name].filter(Boolean).join(" ")}
        </h4>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          appointment.status === 'approved' 
            ? 'bg-green-100 text-green-800' 
            : appointment.status === 'declined'
            ? 'bg-red-100 text-red-800'
            : appointment.status === 'scheduled'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {appointment.status}
        </span>
      </div>
      <div className="flex items-center text-sm text-gray-600 mb-1">
        <Calendar className="w-4 h-4 mr-2" />
        {new Date(appointment.appointment_date).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })}
      </div>
      <div className="flex items-center text-sm text-gray-600">
        <Clock className="w-4 h-4 mr-2" />
        {appointment.appointment_time 
          ? new Date(`1970-01-01T${appointment.appointment_time}`).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : 'No time set'
        }
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar setActiveTab={setActiveTab} activeTab={activeTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "home" && (
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <img src={logo} alt="Logo" className="w-18 h-10 mr-3" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                    <p className="text-gray-600">Comprehensive overview of appointment statistics</p>
                  </div>
                </div>
                <button
                  onClick={fetchAnalytics}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Refresh Data
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <MetricCard
                    title="Total Appointments"
                    value={analytics.totalAppointments}
                    icon={Users}
                    color="bg-blue-500"
                    trend={12}
                  />
                  <MetricCard
                    title="Pending Appointments"
                    value={analytics.pendingAppointments}
                    icon={AlertCircle}
                    color="bg-yellow-500"
                    trend={-5}
                  />
                  <MetricCard
                    title="Approved/Scheduled"
                    value={analytics.approvedAppointments + analytics.scheduledAppointments}
                    icon={CheckCircle}
                    color="bg-green-500"
                    trend={8}
                  />
                  <MetricCard
                    title="Rejected Appointments"
                    value={analytics.rejectedAppointments}
                    icon={XCircle}
                    color="bg-red-500"
                    trend={-2}
                  />
                </div>

                {/* Today's Appointments Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{new Date().toLocaleDateString('en-US', { 
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
                      <h4 className="text-sm font-medium text-gray-700 mb-4">Quick Summary</h4>
                      {analytics.todaysAppointments.length > 0 ? (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {analytics.todaysAppointments.map((appointment, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {[appointment.first_name, appointment.middle_name, appointment.last_name].filter(Boolean).join(" ")}
                                </p>
                                <p className="text-sm text-gray-600">{appointment.service || 'Service Application'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
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
                          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">No appointments scheduled for today</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Status Distribution */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Appointment Status Distribution</h3>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <StatusCard
                          status="pending"
                          count={analytics.statusDistribution.pending}
                          total={analytics.totalAppointments}
                          color="bg-yellow-500"
                          icon={AlertCircle}
                        />
                        <StatusCard
                          status="approved"
                          count={analytics.statusDistribution.approved}
                          total={analytics.totalAppointments}
                          color="bg-green-500"
                          icon={UserCheck}
                        />
                        <StatusCard
                          status="scheduled"
                          count={analytics.statusDistribution.scheduled}
                          total={analytics.totalAppointments}
                          color="bg-blue-500"
                          icon={CalendarDays}
                        />
                        <StatusCard
                          status="declined"
                          count={analytics.statusDistribution.declined}
                          total={analytics.totalAppointments}
                          color="bg-red-500"
                          icon={UserX}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Last Appointment */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Last Appointment</h3>
                      <Clock4 className="w-5 h-5 text-gray-400" />
                    </div>
                    {analytics.lastAppointment ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-8 h-8 text-blue-600" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {[analytics.lastAppointment.first_name, analytics.lastAppointment.middle_name, analytics.lastAppointment.last_name].filter(Boolean).join(" ")}
                          </h4>
                          <p className="text-sm text-gray-600">#{analytics.lastAppointment.id}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">
                              {new Date(analytics.lastAppointment.appointment_date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">
                              {analytics.lastAppointment.appointment_time 
                                ? new Date(`1970-01-01T${analytics.lastAppointment.appointment_time}`).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Not set'
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              analytics.lastAppointment.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : analytics.lastAppointment.status === 'declined'
                                ? 'bg-red-100 text-red-800'
                                : analytics.lastAppointment.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {analytics.lastAppointment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No appointments found</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Appointments */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  {analytics.recentAppointments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analytics.recentAppointments.map((appointment, index) => (
                        <RecentAppointmentCard key={index} appointment={appointment} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No recent appointments</p>
                    </div>
                  )}
                </div>

                {/* Monthly Trends */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Monthly Appointment Trends</h3>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex items-end justify-between h-32">
                    {analytics.monthlyTrends.map((trend, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="bg-blue-500 rounded-t w-8 mb-2 transition-all duration-300 hover:bg-blue-600"
                          style={{ 
                            height: `${Math.max(20, (trend.count / Math.max(...analytics.monthlyTrends.map(t => t.count))) * 100)}px` 
                          }}
                        ></div>
                        <span className="text-xs text-gray-600 text-center">{trend.month}</span>
                        <span className="text-xs font-medium text-gray-900">{trend.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === "todays" && (
          <div className="mt-10"> 
            <TodaysAppointments />
          </div>
        )}
        {activeTab === "appointments" && (
          <div className="mt-10"> 
            <DataTable />
          </div>
        )}
        {activeTab === "settings" && <h1 className="text-3xl font-bold">Settings</h1>}
      </div>
    </div>
  );
};

export default StaffDashboard;