import { useState } from "react";
import { IoArrowBack, IoPersonOutline, IoCallOutline, IoMailOutline, IoLocationOutline, IoCardOutline, IoDocumentTextOutline, IoCloudUploadOutline, IoImageOutline, IoAlert } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { supabase } from "../supabase";

const FileUpload = ({ label, file, onFileChange, icon: Icon }) => {
  return (
    <div className="space-y-3">
      <label className="flex text-sm font-bold text-gray-700 uppercase tracking-wide items-center">
        <Icon className="mr-2 text-indigo-600" size={16} />
        {label}
      </label>
      <div className="relative border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-all duration-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 group cursor-pointer">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ zIndex: 10 }}
        />
        <div className="group-hover:scale-105 transition-transform duration-200 pointer-events-none">
          <IoCloudUploadOutline className="mx-auto text-indigo-400 mb-3 group-hover:text-indigo-600 transition-colors" size={32} />
          <p className="text-gray-700 font-medium text-sm">
            {file ? (
              <span className="text-indigo-600">✓ {file.name}</span>
            ) : (
              "Click to upload or drag and drop"
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Accepts images and PDF files
          </p>
        </div>
      </div>
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    gender: "",
    barangay: "",
    idType: "",
    idNumber: "",
  });
  const [frontIdFile, setFrontIdFile] = useState(null);
  const [backIdFile, setBackIdFile] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const barangayList = [
    "Bantaoay",
    "Bayubay Norte",
    "Bayubay Sur",
    "Lubong",
    "Poblacion",
    "Pudoc",
    "San Sebastian",
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Prevent double submission
    if (submitting) return;

    const { email, confirmEmail, password, confirmPassword, firstName, lastName, phone, gender, barangay, idType, idNumber } = formData;

    // Validate required fields
    if (email !== confirmEmail) {
      setError("Email addresses do not match");
      setShowModal(true);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setShowModal(true);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShowModal(true);
      return;
    }

    if (!firstName) {
      setError("Please enter your first name");
      setShowModal(true);
      return;
    }

    if (!lastName) {
      setError("Please enter your last name");
      setShowModal(true);
      return;
    }

    if (!phone) {
      setError("Please enter your phone number");
      setShowModal(true);
      return;
    }

    if (!gender) {
      setError("Please select your gender");
      setShowModal(true);
      return;
    }

    if (!barangay) {
      setError("Please select your barangay");
      setShowModal(true);
      return;
    }

    if (!idType) {
      setError("Please select the type of ID");
      setShowModal(true);
      return;
    }

    if (!idNumber) {
      setError("Please enter your ID number");
      setShowModal(true);
      return;
    }

    if (!frontIdFile) {
      setError("Please upload the front of your ID");
      setShowModal(true);
      return;
    }

    if (!backIdFile) {
      setError("Please upload the back of your ID");
      setShowModal(true);
      return;
    }

    setSubmitting(true);
    try {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        throw new Error("Signup failed: " + signupError.message);
      }

      const userId = signupData?.user?.id;

      if (!userId) {
        throw new Error("Signup incomplete. User ID not found.");
      }

      // Upload ID files
      const timestamp = Date.now();
      let frontIdUrl, backIdUrl;
      
      try {
        frontIdUrl = await uploadFile(frontIdFile, 'front_ids', userId, timestamp);
      } catch (error) {
        throw new Error(`Failed to upload front ID: ${error.message}`);
      }
      
      try {
        backIdUrl = await uploadFile(backIdFile, 'back_ids', userId, timestamp);
      } catch (error) {
        throw new Error(`Failed to upload back ID: ${error.message}`);
      }

      // Create full name from atomic fields
      const fullName = `${firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${lastName}`.trim();

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userId,
          full_name: fullName,
          email,
          first_name: firstName,
          middle_name: formData.middleName,
          last_name: lastName,
          phone,
          gender,
          barangay,
          id_type: idType,
          id_number: idNumber,
          front_id_url: frontIdUrl,
          back_id_url: backIdUrl,
        },
      ]);

      if (profileError) {
        throw new Error("Profile creation failed: " + profileError.message);
      }

    
      const { error: auditError } = await supabase.from("audit_logs").insert([
        {
          user_id: userId,
          user_type: "user",
          action: "account_created",
          location: "Signup Page",
          date: new Date().toISOString(),
        },
      ]);

      if (auditError) {
        console.error("Failed to log account creation:", auditError);
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw new Error("Login failed: " + loginError.message);
      }

      navigate("/");
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-3xl p-4 sm:p-6 border border-gray-100/50 animate-in zoom-in-95 duration-500 max-h-[90vh] overflow-y-auto">

        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 group z-10"
        >
          <IoArrowBack className="text-lg text-gray-600 group-hover:text-gray-900" />
        </button>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600 text-sm">Join us and start your journey today</p>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-3 rounded-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Information */}
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <IoPersonOutline className="mr-2 text-indigo-600" size={18} />
              Account Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoMailOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoMailOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Confirm Email *
                </label>
                <input
                  type="email"
                  name="confirmEmail"
                  value={formData.confirmEmail}
                  onChange={handleChange}
                  placeholder="Confirm your email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                  </svg>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min. 8 characters)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <IoPersonOutline className="mr-2 text-indigo-600" size={18} />
              Personal Details
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoPersonOutline className="w-4 h-4 mr-2 text-gray-400" />
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoPersonOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Enter your middle name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoPersonOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoCallOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoPersonOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Gender *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center p-3 border-2 border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm group">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === "Male"}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors text-sm">Male</span>
                  </label>
                  <label className="flex items-center p-3 border-2 border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all duration-300 bg-white/70 backdrop-blur-sm group">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === "Female"}
                      onChange={handleChange}
                      className="mr-3 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors text-sm">Female</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoLocationOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Barangay *
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                >
                  <option value="">Select Barangay</option>
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
          <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
              <IoCardOutline className="mr-2 text-indigo-600" size={18} />
              ID Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoCardOutline className="w-4 h-4 mr-2 text-gray-400" />
                  Type of ID *
                </label>
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                >
                  <option value="">Select Type of ID</option>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <IoDocumentTextOutline className="w-4 h-4 mr-2 text-gray-400" />
                  ID Number *
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="Enter your ID number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                  required
                />
              </div>
            </div>

            {/* ID Upload Section */}
            <div className="grid md:grid-cols-2 gap-4">
              <FileUpload
                label="Upload Front of ID *"
                file={frontIdFile}
                onFileChange={handleFrontIdChange}
                icon={IoImageOutline}
              />
              <FileUpload
                label="Upload Back of ID *"
                file={backIdFile}
                onFileChange={handleBackIdChange}
                icon={IoImageOutline}
              />
            </div>

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start">
                <IoAlert className="text-amber-500 mr-2 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">Important Note:</p>
                  <p className="text-xs text-amber-700">
                    Please ensure both sides of your ID are clearly visible and readable. 
                    Accepted formats: JPG, PNG, PDF (max 10MB per file)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full mt-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center ${
              submitting 
                ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Creating Account...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>

      {/* Error Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black-6- bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={closeModal}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl font-medium transition-colors duration-200"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;