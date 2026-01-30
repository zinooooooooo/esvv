import React from "react";
import { IoIosHome, IoIosSettings, IoIosLogOut } from "react-icons/io";
import { FaTable } from "react-icons/fa";
import { Calendar } from "lucide-react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

const StaffSidebar = ({ setActiveTab, activeTab }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="bg-white h-screen w-64 shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Staff Dashboard</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[
          { label: "Home", icon: <IoIosHome size={20} />, tab: "home" },
          { label: "Queue Management", icon: <Calendar size={20} />, tab: "todays" },
          { label: "All Appointments", icon: <FaTable size={20} />, tab: "appointments" },
        //**   { label: "Settings", icon: <IoIosSettings size={20} />, tab: "settings" },**//
        ].map((item, index) => (
          <button
            key={index}
            onClick={() => setActiveTab && setActiveTab(item.tab)}
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

export default StaffSidebar;