import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import { supabase } from "../supabase";
import { Download, Calendar, User, Activity, Filter, X, ChevronsUpDown } from "lucide-react";

const AuditLog = () => {
  const [activeTab, setActiveTab] = useState("auditlogs");
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userType: '',
    action: ''
  });
  const [uniqueUserTypes, setUniqueUserTypes] = useState([]);
  const [uniqueActions, setUniqueActions] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  async function fetchAuditLogs() {
    setLoading(true);
    
    try {
      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from("audit_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);

      if (logsError) {
        console.error("Error fetching audit logs:", logsError);
        setLoading(false);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(logsData.map(log => log.user_id).filter(Boolean))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setLoading(false);
        return;
      }

      // Create a map of user_id to full_name
      const profilesMap = {};
      profilesData.forEach(profile => {
        profilesMap[profile.id] = profile.full_name;
      });

      // Combine the data
      const combinedData = logsData.map(log => ({
        ...log,
        profiles: {
          full_name: profilesMap[log.user_id] || 'Unknown User'
        }
      }));

      setLogs(combinedData);
      const userTypes = [...new Set(combinedData.map(log => log.user_type).filter(Boolean))];
      const rawActions = combinedData.map(log => log.action).filter(Boolean);
      const actionSet = new Set(rawActions);
      // Add grouped options if present in data
      if (rawActions.some(a => a.startsWith('appointment_created'))) {
        actionSet.add('appointment_created');
      }
      if (rawActions.some(a => a === 'account_created')) {
        actionSet.add('account_created');
      }
      setUniqueUserTypes(userTypes);
      setUniqueActions([...actionSet]);
    } catch (error) {
      console.error("Unexpected error fetching audit logs:", error);
    }
    
    setLoading(false);
  }

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); 
      filtered = filtered.filter(log => new Date(log.date) <= endDate);
    }

    if (filters.userType) {
      filtered = filtered.filter(log => log.user_type === filters.userType);
    }

    if (filters.action) {
      if (filters.action === 'appointment_created') {
        filtered = filtered.filter(log => (log.action || '').startsWith('appointment_created'));
      } else if (filters.action === 'account_created') {
        filtered = filtered.filter(log => log.action === 'account_created');
      } else {
        filtered = filtered.filter(log => log.action === filters.action);
      }
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userType: '',
      action: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortedLogs = (list) => {
    const logsCopy = [...list];
    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;
    return logsCopy.sort((a, b) => {
      let aVal, bVal;

      if (key === 'profiles.full_name') {
        aVal = a?.profiles?.full_name;
        bVal = b?.profiles?.full_name;
      } else {
        aVal = a?.[key];
        bVal = b?.[key];
      }

      if (key === 'date') {
        const aDate = aVal ? new Date(aVal).getTime() : 0;
        const bDate = bVal ? new Date(bVal).getTime() : 0;
        if (aDate === bDate) return 0;
        return aDate > bDate ? multiplier : -multiplier;
      }

      aVal = (aVal ?? '').toString().toLowerCase();
      bVal = (bVal ?? '').toString().toLowerCase();
      if (aVal === bVal) return 0;
      return aVal > bVal ? multiplier : -multiplier;
    });
  };

  const downloadLogs = () => {
    const logsToDownload = hasActiveFilters ? filteredLogs : logs;
    const csvContent = [
      ['Date', 'User Name', 'User Type', 'Action'],
      ...logsToDownload.map(log => [
        new Date(log.date).toLocaleString(),
        log.profiles?.full_name || 'Unknown User',
        log.user_type,
        log.action
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'create': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'view': 'bg-purple-100 text-purple-800',
      'account_created': 'bg-emerald-100 text-emerald-800',
      'appointment_created': 'bg-cyan-100 text-cyan-800'
    };
    
    const actionLower = action?.toLowerCase() || '';
    
    // Check for specific actions first
    if (actionLower.includes('account_created')) return colors['account_created'];
    if (actionLower.includes('appointment_created')) return colors['appointment_created'];
    
    // Then check for general patterns
    for (const [key, color] of Object.entries(colors)) {
      if (actionLower.includes(key)) return color;
    }
    return 'bg-indigo-100 text-indigo-900';
  };

  const getUserTypeBadgeColor = (userType) => {
    const colors = {
      'admin': 'bg-red-100 text-red-900',
      'manager': 'bg-orange-100 text-orange-900',
      'user': 'bg-green-100 text-green-900',
      'guest': 'bg-gray-100 text-gray-900'
    };
    return colors[userType?.toLowerCase()] || 'bg-indigo-100 text-indigo-900';
  };

  const getActionLabel = (action) => {
    if (!action) return 'Unknown';
    if (action === 'account_created') return 'Account Created';
    const match = action.match(/^appointment_created\s*\(([^)]+)\)/i);
    if (match) {
      const who = match[1] === 'self' ? 'Self' : 'Relative';
      return `Appointment Created (${who})`;
    }
    return action.replace(/_/g, ' ');
  };

  const getDetails = (log) => {
    const action = log?.action || '';
    if (action.startsWith('appointment_created')) {
      const match = action.match(/appointment_created\s*\(([^)]+)\)/i);
      const who = match?.[1] || 'self';
      return `Appointee: ${who === 'self' ? 'Self' : 'Relative'}`;
    }
    if (action === 'account_created') {
      return 'New user account registered';
    }
    return '';
  };

  const displayLogsCount = hasActiveFilters ? filteredLogs.length : logs.length;
  const displayLogs = hasActiveFilters ? filteredLogs : logs;
  const sortedDisplayLogs = getSortedLogs(displayLogs);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {displayLogsCount} {displayLogsCount === 1 ? 'log' : 'logs'}
                    {hasActiveFilters && ` (filtered from ${logs.length} total)`}
                  </p>
              
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              )}
              
              {displayLogsCount > 0 && (
                <button
                  onClick={downloadLogs}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {hasActiveFilters ? 'Filtered ' : ''}Logs</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                <select
                  value={filters.userType}
                  onChange={(e) => handleFilterChange('userType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All User Types</option>
                  {uniqueUserTypes.map(userType => (
                    <option key={userType} value={userType}>{userType}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
            </div>

            
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg text-gray-600">Loading audit logs...</span>
              </div>
            </div>
          ) : displayLogsCount === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Activity className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {hasActiveFilters ? 'No matching audit logs found' : 'No audit logs found'}
              </h3>
              <p className="text-base text-gray-600 max-w-md mx-auto">
                {hasActiveFilters 
                  ? 'Try adjusting your filter criteria to see more results.'
                  : 'There are no audit logs to display at this time.'
                }
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-auto max-h-[calc(100vh-200px)]">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Date & Time</span>
                          <ChevronsUpDown className={`w-4 h-4 ml-1 ${sortConfig.key === 'date' ? 'text-gray-700' : 'text-gray-400'}`} />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('profiles.full_name')}
                      >
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>User</span>
                          <ChevronsUpDown className={`w-4 h-4 ml-1 ${sortConfig.key === 'profiles.full_name' ? 'text-gray-700' : 'text-gray-400'}`} />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('user_type')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>User Type</span>
                          <ChevronsUpDown className={`w-4 h-4 ml-1 ${sortConfig.key === 'user_type' ? 'text-gray-700' : 'text-gray-400'}`} />
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('action')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Action</span>
                          <ChevronsUpDown className={`w-4 h-4 ml-1 ${sortConfig.key === 'action' ? 'text-gray-700' : 'text-gray-400'}`} />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedDisplayLogs.map((log, index) => (
                      <tr key={log.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {new Date(log.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.date).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {log.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {log.profiles?.full_name || 'Unknown User'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeBadgeColor(log.user_type)}`}>
                            {log.user_type || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getDetails(log) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;