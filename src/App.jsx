import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import Hero from './Hero/Hero';
import AboutUs from './AboutUs/AboutUs';
import ContactUs from './ContactUs/ContactUs';
import Faqs from './Faqs/Faqs';
import Appointment from './Appointment/appointment';
import Signup from './Navbar/Signup'; 
import AdminDashboard from './admindash/AdminDashboard';
import StaffDashboard from './staff/StaffDashboard';
import AdminDocuments from './admindash/AdminDocuments';
import DocuManagement from './admindash/DocuManagement';
import AuditLogs from './admindash/AuditLogs';
import StaffPage from './Staff/StaffPage';
import StaffManagement from './admindash/StaffManagement';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <AboutUs />
              <ContactUs />
            </>
          }
        />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/admin/document-management" element={<DocuManagement />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/staff-directory" element={<StaffPage />} />
        <Route path="/admin/staff-management" element={<StaffManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
