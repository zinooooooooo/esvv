import React from "react";
import { FaHome, FaTable, FaUsers, FaClipboardList, FaChartBar } from "react-icons/fa";
import { IoIosSettings, IoIosLogOut } from "react-icons/io";
import { IoDocument, IoPerson } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const Sidebar = ({ setActiveTab, activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const menuItems = [
    { label: "Analytics", icon: <FaChartBar size={20} />, tab: "analytics" },
    { label: "Appointments", icon: <FaTable size={20} />, tab: "appointments" },
    { label: "User Management", icon: <FaUsers size={20} />, tab: "users" },
   
    { label: "Manage", icon: <IoDocument size={20} />, tab: "docmanage" },
    { label: "Audit Logs", icon: <FaClipboardList size={20} />, tab: "auditlogs" },
   /**  { label: "Settings", icon: <IoIosSettings size={20} />, tab: "settings" },**/
  ];

  const handleClick = (tab) => {
    if (tab === "docmanage") {
      navigate("/admin/document-management");
    } else if (tab === "auditlogs") {
      navigate("/admin/audit-logs");
    } else if (tab === "staffmanagement") {
      navigate("/admin/staff-management");
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div data-testid="admin-sidebar" className="bg-white w-64 shadow-lg border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Admin Dashboard</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleClick(item.tab)}
            className={`flex items-center w-full px-4 py-3 text-left space-x-3 rounded-lg transition-all duration-200 ${
              activeTab === item.tab
                ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            }`}
          >
            <span className={activeTab === item.tab ? "text-blue-600" : "text-gray-500"}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-left space-x-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <IoIosLogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
