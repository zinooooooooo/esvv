import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack, IoPersonOutline, IoCallOutline, IoMailOutline, IoLocationOutline,
  IoCardOutline, IoDocumentTextOutline, IoCloudUploadOutline, IoCheckmarkCircle,
  IoAlert, IoClose, IoCalendarOutline, IoTimeOutline, IoImageOutline
} from "react-icons/io5";
import logo from "../assets/logo.png";
import { supabase } from '../supabase';
import AppointmentScheduler from '../components/AppointmentScheduler';

const Modal = ({ isOpen, onClose, type, title, message }) => {
  if (!isOpen) return null;
  const isSuccess = type === 'success';
  const Icon = isSuccess ? IoCheckmarkCircle : IoAlert;
  const iconColor = isSuccess ? 'text-green-500' : 'text-red-500';
  const borderColor = isSuccess ? 'border-green-200' : 'border-red-200';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className={`bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 ${borderColor} transform transition-all duration-300 scale-100`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'} mr-4`}>
                <Icon className={iconColor} size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <IoClose size={24} />
            </button>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 ${
              isSuccess 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-200' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg shadow-red-200'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};


const FileUpload = ({ label, file, onFileChange, icon: Icon }) => {
  return (
    <div className="space-y-3">
      <label className="flex text-sm font-bold text-gray-700 uppercase tracking-wide items-center">
        <Icon className="mr-2 text-indigo-600" size={16} />
        {label}
      </label>
      <div className="relative border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition-all duration-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 group cursor-pointer">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ zIndex: 10 }}
        />
        <div className="group-hover:scale-105 transition-transform duration-200 pointer-events-none">
          <IoCloudUploadOutline className="mx-auto text-indigo-400 mb-3 group-hover:text-indigo-600 transition-colors" size={40} />
          <p className="text-gray-700 font-medium">
            {file ? (
              <span className="text-indigo-600">✓ {file.name}</span>
            ) : (
              "Click to upload or drag and drop"
            )}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Accepts images and PDF files
          </p>
        </div>
      </div>
    </div>
  );
};

const Appointment = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [appointee, setAppointee] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [frontIdFile, setFrontIdFile] = useState(null);
  const [backIdFile, setBackIdFile] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    gender: "",
    barangay: "",
    idType: "",
    idNumber: "",
  });

  const tableMap = {
    PWD: "pwd",
    "Senior Citizen": "senior_citizens",
    "Solo Parent": "solo_parents",
    "Financial Assistance": "financial_assistance",
    "Early Childhood Care": "early_childhood",
    "Youth Sector": "youth_sector",
    "Women's Sector": "womens_sector",
  };

  const serviceMap = {
    PWD: ["PWD ID", "PWD Benefits", "PWD Certification", "PWD Discount Card"],
    "Senior Citizen": ["Senior Citizen ID", "Senior Citizen Benefits", "Senior Citizen Certification", "Senior Citizen Discount Card"],
    "Solo Parent": ["Solo Parent ID", "Solo Parent Benefits", "Solo Parent Certification", "Solo Parent Discount Card"],
    "Financial Assistance": ["Medical Assistance", "Educational Assistance", "Livelihood Assistance", "Emergency Assistance"],
    "Early Childhood Care": [
      "Registration of Children (1–2 years old)",
      "Registration of Children (3–4 years old)"
    ],
    "Youth Sector": [
      "Youth (15–24 years old)",
      "Out-of-School Children and Youth (3–22 years old)",
      "Child in Conflict"
    ],
    "Women's Sector": [
      "Profiles of Women's Organization",
      "VAWC Cases"
    ],
  };

  const barangayList = [
    "Bantaoay",
    "Bayubay Norte",
    "Bayubay Sur",
    "Lubong",
    "Poblacion",
    "Pudoc",
    "San Sebastian",
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
      
      // If user exists, fetch their profile data to pre-populate form
      if (data?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (!profileError && profileData) {
          // Pre-populate form with user profile data
          setFormData({
            firstName: profileData.first_name || "",
            middleName: profileData.middle_name || "",
            lastName: profileData.last_name || "",
            phone: profileData.phone || "",
            email: profileData.email || data.user.email || "",
            gender: profileData.gender || "",
            barangay: profileData.barangay || "",
            idType: profileData.id_type || "",
            idNumber: profileData.id_number || "",
          });
          
          // Set ID files if they exist (for display purposes)
          if (profileData.front_id_url) {
            // Create a dummy file object for display
            setFrontIdFile({ name: "Front ID (Already uploaded)" });
          }
          if (profileData.back_id_url) {
            // Create a dummy file object for display
            setBackIdFile({ name: "Back ID (Already uploaded)" });
          }
        }
      }
    };
    fetchUser();
  }, []);


  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', title: '', message: '' });
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleFrontIdChange = (event) => {
    if (event.target.files.length > 0) {
      setFrontIdFile(event.target.files[0]);
    }
  };

  const handleBackIdChange = (event) => {
    if (event.target.files.length > 0) {
      setBackIdFile(event.target.files[0]);
    }
  };

  const uploadFile = async (file, folder, userId, timestamp) => {
    // More comprehensive filename sanitization
    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace all special characters except dots and hyphens
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single underscore
      .replace(/^_+|_+$/g, ""); // Remove leading/trailing underscores
    
    // Ensure we have a valid filename
    const finalFileName = safeFileName || `file_${timestamp}`;
    const filePath = `${userId}/${folder}/${timestamp}_${finalFileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("appointments")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("appointments")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (submitting) return;
    
    // Validate sector selection
    if (!selectedType) return showModal('error', 'Validation Error', 'Please select a sector.');
    
    // Validate appointee selection
    if (!appointee) return showModal('error', 'Validation Error', 'Please select who the appointment is for (Yourself or Relative).');
    
    // Validate service selection
    if (!selectedService) return showModal('error', 'Validation Error', 'Please select a service.');
    
    // Validate date and time selection
    if (!selectedDate) return showModal('error', 'Validation Error', 'Please select an appointment date.');
    if (!selectedTime) return showModal('error', 'Validation Error', 'Please select an appointment time.');
    
    // Check if user has any active appointments
    try {
      const tables = ['pwd', 'senior_citizens', 'solo_parents', 'financial_assistance', 'early_childhood', 'youth_sector', 'womens_sector'];
      let hasActiveAppointment = false;
      let activeAppointmentDetails = null;

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('id, service, appointment_date, appointment_time, status')
          .eq('user_id', user.id)
          .in('status', ['pending', 'approved', 'scheduled']);

        if (error) {
          console.error(`Error checking active appointments in ${table}:`, error);
        } else if (data && data.length > 0) {
          hasActiveAppointment = true;
          activeAppointmentDetails = data[0];
          break;
        }
      }

      if (hasActiveAppointment) {
        const appointmentDate = new Date(activeAppointmentDetails.appointment_date).toLocaleDateString();
        const appointmentTime = activeAppointmentDetails.appointment_time;
        return showModal(
          'error', 
          'Active Appointment Found', 
          `You already have an active appointment for ${activeAppointmentDetails.service} on ${appointmentDate} at ${appointmentTime}. Please wait until your current appointment is completed before booking a new one.`
        );
      }
    } catch (error) {
      console.error('Error checking for active appointments:', error);
      return showModal('error', 'Validation Error', 'Unable to verify existing appointments. Please try again.');
    }
    
    // Check if user has existing ID files in profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("front_id_url, back_id_url")
      .eq("id", user.id)
      .single();

    const hasExistingFrontId = profileData?.front_id_url;
    const hasExistingBackId = profileData?.back_id_url;

    // Validate file uploads - only require if no existing files
    if (!hasExistingFrontId && !frontIdFile) return showModal('error', 'Validation Error', 'Please upload the front of your ID.');
    if (!hasExistingBackId && !backIdFile) return showModal('error', 'Validation Error', 'Please upload the back of your ID.');
    
    // Validate required form fields with specific messages
    if (!formData.firstName) return showModal('error', 'Validation Error', 'Please enter your first name.');
    if (!formData.lastName) return showModal('error', 'Validation Error', 'Please enter your last name.');
    if (!formData.phone) return showModal('error', 'Validation Error', 'Please enter your phone number.');
    if (!formData.email) return showModal('error', 'Validation Error', 'Please enter your email address.');
    if (!formData.gender) return showModal('error', 'Validation Error', 'Please select your gender.');
    if (!formData.barangay) return showModal('error', 'Validation Error', 'Please select your barangay.');
    if (!formData.idType) return showModal('error', 'Validation Error', 'Please select the type of ID.');
    if (!formData.idNumber) return showModal('error', 'Validation Error', 'Please enter your ID number.');
  
    const tableName = tableMap[selectedType];
    if (!tableName) return showModal('error', 'Error', 'Invalid sector type.');
  
    setSubmitting(true);
    try {
      const userId = user.id;
      const timestamp = Date.now();
  
      // Use existing files or upload new ones
      let frontIdUrl = hasExistingFrontId;
      let backIdUrl = hasExistingBackId;
      
      // Upload new files only if they were provided
      if (frontIdFile && !hasExistingFrontId) {
        try {
          frontIdUrl = await uploadFile(frontIdFile, 'front_ids', userId, timestamp);
        } catch (error) {
          return showModal('error', 'File Upload Error', `Failed to upload front ID: ${error.message}`);
        }
      }
      
      if (backIdFile && !hasExistingBackId) {
        try {
          backIdUrl = await uploadFile(backIdFile, 'back_ids', userId, timestamp);
        } catch (error) {
          return showModal('error', 'File Upload Error', `Failed to upload back ID: ${error.message}`);
        }
      }
  
      const formattedData = {
        user_id: userId,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        barangay: formData.barangay,
        id_type: formData.idType,
        id_number: formData.idNumber,
        front_id_url: frontIdUrl,
        back_id_url: backIdUrl,
        service: selectedService,
        appointee: appointee,
        appointment_date: selectedDate,  
        appointment_time: selectedTime,  
        status: "pending",
      };
  
            const { error } = await supabase.from(tableName).insert([formattedData]);

      if (error) {
        showModal('error', 'Submission Failed', 'Failed to submit appointment: ' + error.message);
      } else {
        // Log appointment creation to audit logs
        const { error: auditError } = await supabase.from("audit_logs").insert([
          {
            user_id: userId,
            user_type: "user",
            action: `appointment_created (${appointee})`,
            location: "Appointment Page",
            date: new Date().toISOString(),
          },
        ]);

        if (auditError) {
          console.error("Failed to log appointment creation:", auditError);
        }

        showModal('success', 'Success!', `Appointment successfully scheduled for ${selectedDate} at ${selectedTime}!`);
    
        setFormData({
          firstName: "", middleName: "", lastName: "",
          phone: "", email: "", gender: "", barangay: "",
          idType: "", idNumber: ""
        });
        setSelectedType("");
        setAppointee("");
        setSelectedService("");
        setSelectedDate("");
        setSelectedTime("");
        setFrontIdFile(null);
        setBackIdFile(null);
      }
    } catch (err) {
      showModal('error', 'Unexpected Error', 'Unexpected error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 pt-16">
        <div className="bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <IoPersonOutline size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign in required</h1>
          <p className="text-gray-600 mb-8 max-w-md">You must be logged in to book an appointment with our services.</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
          >
            Go back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-12 px-4">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #4f46e5, #7c3aed);
        }
      `}</style>
      
      <Modal isOpen={modal.isOpen} onClose={closeModal} type={modal.type} title={modal.title} message={modal.message} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 group bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl"
          >
            <IoArrowBack size={24} className="mr-3 group-hover:-translate-x-2 transition-transform duration-300" />
            <span className="text-lg font-semibold">Back to Home</span>
          </button>
          
          <div className="flex items-center bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
            <img
              src={logo}
              alt="Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6">
              <IoCalendarOutline size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Schedule Your Appointment
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Fill out the form below to schedule your appointment with our services
            </p>
          </div>

          <div className="space-y-10">
            {/* Sector Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Select Sector</label>
              <select
                className="w-full p-5 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setAppointee("");
                  setSelectedService("");
                }}
              >
                <option value="">Choose a sector...</option>
                {Object.keys(tableMap).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {selectedType && (
              <>
                {/* Appointee Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Who is the appointee?</label>
                  <div className="grid md:grid-cols-2 gap-6">
                    <label className="flex items-center p-6 border-2 border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm group">
                      <input
                        type="radio"
                        name="appointee"
                        value="self"
                        checked={appointee === "self"}
                        onChange={(e) => setAppointee(e.target.value)}
                        className="mr-4 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Myself</span>
                    </label>
                    <label className="flex items-center p-6 border-2 border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm group">
                      <input
                        type="radio"
                        name="appointee"
                        value="relative"
                        checked={appointee === "relative"}
                        onChange={(e) => setAppointee(e.target.value)}
                        className="mr-4 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Relative</span>
                    </label>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Select Service</label>
                  <select
                    className="w-full p-5 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm text-lg font-medium"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">Choose a service...</option>
                    {serviceMap[selectedType]?.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time Selection */}
                <AppointmentScheduler
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  onDateChange={setSelectedDate}
                  onTimeChange={setSelectedTime}
                  maxAppointmentsPerDay={25}
                  timeSlotCapacity={3}
                />

                {/* Personal Information */}
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-8 rounded-3xl border border-gray-100 shadow-inner">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                      <IoPersonOutline className="mr-3 text-indigo-600" />
                      Personal Information
                    </h3>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Pre-filled from profile
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative">
                      <IoPersonOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name *"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        required
                      />
                    </div>

                    <div className="relative">
                      <IoPersonOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <input
                        type="text"
                        name="middleName"
                        placeholder="Middle Name"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                      />
                    </div>

                    <div className="relative">
                      <IoPersonOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name *"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        required
                      />
                    </div>

                    <div className="relative">
                      <IoCallOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number *"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        required
                      />
                    </div>

                    <div className="relative md:col-span-2">
                      <IoMailOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address *"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Gender *</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <label className="flex items-center p-4 border-2 border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm group">
                          <input
                            type="radio"
                            name="gender"
                            value="Male"
                            checked={formData.gender === "Male"}
                            onChange={handleChange}
                            className="mr-3 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Male</span>
                        </label>
                        <label className="flex items-center p-4 border-2 border-indigo-200 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm group">
                          <input
                            type="radio"
                            name="gender"
                            value="Female"
                            checked={formData.gender === "Female"}
                            onChange={handleChange}
                            className="mr-3 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Female</span>
                        </label>
                      </div>
                    </div>

                    <div className="relative">
                      <IoLocationOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <select
                        name="barangay"
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm font-medium"
                        value={formData.barangay}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Barangay *</option>
                        {barangayList.map((barangay) => (
                          <option key={barangay} value={barangay}>
                            {barangay}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ID Information */}
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-8 rounded-3xl border border-gray-100 shadow-inner">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                      <IoCardOutline className="mr-3 text-indigo-600" />
                      ID Information
                    </h3>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Pre-filled from profile
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="relative">
                      <IoCardOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <select
                        name="idType"
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm font-medium"
                        value={formData.idType}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Type of ID *</option>
                        {[
                          "National ID",
                          "Passport",
                          "Driver's License",
                          "Voter's ID",
                          "Senior Citizen ID",
                          "PWD ID",
                          "Solo Parent ID",
                        ].map((idType) => (
                          <option key={idType} value={idType}>
                            {idType}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <IoDocumentTextOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                      <input
                        type="text"
                        name="idNumber"
                        placeholder="ID Number *"
                        value={formData.idNumber}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 border-2 border-indigo-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* ID Upload Section */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                     
                      {frontIdFile && frontIdFile.name.includes("Already uploaded") ? (
                        <div className="border-2 border-green-200 rounded-2xl p-6 text-center bg-green-50">
                          <div className="text-green-600 mb-2">
                            <IoCheckmarkCircle size={32} className="mx-auto" />
                          </div>
                          <p className="text-green-800 font-medium text-sm mb-2">ID already uploaded from profile</p>
                          <p className="text-xs text-green-600">You can upload a new file to replace it</p>
                        </div>
                      ) : (
                        <FileUpload
                          label="Upload Front of ID *"
                          file={frontIdFile}
                          onFileChange={handleFrontIdChange}
                          icon={IoImageOutline}
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      
                      {backIdFile && backIdFile.name.includes("Already uploaded") ? (
                        <div className="border-2 border-green-200 rounded-2xl p-6 text-center bg-green-50">
                          <div className="text-green-600 mb-2">
                            <IoCheckmarkCircle size={32} className="mx-auto" />
                          </div>
                          <p className="text-green-800 font-medium text-sm mb-2">ID already uploaded from profile</p>
                          <p className="text-xs text-green-600">You can upload a new file to replace it</p>
                        </div>
                      ) : (
                        <FileUpload
                          label="Upload Back of ID *"
                          file={backIdFile}
                          onFileChange={handleBackIdChange}
                          icon={IoImageOutline}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <div className="flex items-start">
                      <IoAlert className="text-amber-500 mr-3 mt-1 flex-shrink-0" size={20} />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 mb-1">Important Note:</p>
                        <p className="text-sm text-amber-700">
                          Please ensure both sides of your ID are clearly visible and readable. 
                          Accepted formats: JPG, PNG, PDF (max 10MB per file)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}

            {/* Submit Button - Always visible */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full max-w-md py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center group text-white ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <IoCheckmarkCircle className="mr-3 group-hover:rotate-12 transition-transform duration-300" size={24} />
                    Submit Appointment
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 text-center max-w-md">
                By submitting this form, you agree to our terms and conditions. 
                You will receive a confirmation email once your appointment is processed.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Need help? Contact us at{" "}
            <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-800 font-medium">
              esvmswdo@gmail.com
            </a>{" "}
            or{" "}
            <a href="tel:+639171234567" className="text-indigo-600 hover:text-indigo-800 font-medium">
              (+63) 917 123 4567
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Appointment;