import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IoArrowBack, 
  IoPersonOutline, 
  IoCallOutline, 
  IoMailOutline, 
  IoLocationOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircle,
  IoAlert,
  IoClose,
  IoImageOutline
} from 'react-icons/io5';
import logo from '../assets/logo.png';
import { supabase } from '../supabase';

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
      <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center">
        <Icon className="mr-2 text-indigo-600" size={16} />
        {label}
      </label>
      <div className="relative border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-all duration-300 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 group">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="group-hover:scale-105 transition-transform duration-200">
          <IoCloudUploadOutline className="mx-auto text-indigo-400 mb-3 group-hover:text-indigo-600 transition-colors" size={32} />
          <p className="text-gray-700 font-medium">
            {file ? (
              <span className="text-indigo-600">✓ {file.name}</span>
            ) : (
              "Click to upload staff photo"
            )}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Accepts JPG, PNG files (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
};

const StaffCard = ({ staff, onEdit, onDelete, isAdmin }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {staff.photo_url ? (
            <img
              src={staff.photo_url}
              alt={staff.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-4 border-indigo-100 shadow-lg">
              <IoPersonOutline size={32} className="text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{staff.name}</h3>
          <p className="text-indigo-600 font-semibold mb-2">{staff.position}</p>
          
          <div className="space-y-2 text-sm text-gray-600">
            {staff.phone && (
              <div className="flex items-center">
                <IoCallOutline className="mr-2 text-indigo-500" size={16} />
                <span>{staff.phone}</span>
              </div>
            )}
            {staff.email && (
              <div className="flex items-center">
                <IoMailOutline className="mr-2 text-indigo-500" size={16} />
                <span>{staff.email}</span>
              </div>
            )}
            {staff.location && (
              <div className="flex items-center">
                <IoLocationOutline className="mr-2 text-indigo-500" size={16} />
                <span>{staff.location}</span>
              </div>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => onEdit(staff)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Staff Member"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(staff.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Staff Member"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StaffPage = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    location: '',
    hierarchy: ''
  });

  const hierarchyOptions = [
    'MSWDO WELFARE OFFICER',
    'SOCIAL WELFARE OFFICER III',
    'SOCIAL WELFARE ASSISTANT',
    'CHILD DEVT TEACHER 2',
    'MUNICIPAL LINK',
    'LGU LINK',
    'ADMINISTRATIVE AIDE',
    'PWD FOCAL PERSON'
  ];

  useEffect(() => {
    fetchStaffMembers();
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profile?.role || '');
      }
    } catch (error) {
      console.error('Error checking user auth:', error);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('hierarchy_order', { ascending: true });

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
      showModal('error', 'Error', 'Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (type, title, message) => {
    setModal({ isOpen: true, type, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', title: '', message: '' });
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      position: '',
      phone: '',
      email: '',
      location: '',
      hierarchy: ''
    });
    setPhotoFile(null);
    setShowAddModal(true);
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      position: staff.position,
      phone: staff.phone || '',
      email: staff.email || '',
      location: staff.location || '',
      hierarchy: staff.hierarchy || ''
    });
    setPhotoFile(null);
    setShowAddModal(true);
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', staffId);

      if (error) throw error;
      
      showModal('success', 'Success', 'Staff member deleted successfully');
      fetchStaffMembers();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      showModal('error', 'Error', 'Failed to delete staff member');
    }
  };

  const uploadPhoto = async (file, staffId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${staffId}_${Date.now()}.${fileExt}`;
    const filePath = `staff_photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('staff_photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('staff_photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (submitting) return;
    
    if (!formData.name || !formData.position || !formData.hierarchy) {
      return showModal('error', 'Validation Error', 'Please fill in all required fields');
    }

    setSubmitting(true);
    try {
      let photoUrl = null;
      
      if (photoFile) {
        const tempId = editingStaff?.id || Date.now();
        photoUrl = await uploadPhoto(photoFile, tempId);
      }

      const hierarchyOrder = hierarchyOptions.indexOf(formData.hierarchy);

      const staffData = {
        name: formData.name,
        position: formData.position,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        hierarchy: formData.hierarchy,
        hierarchy_order: hierarchyOrder,
        photo_url: photoUrl || editingStaff?.photo_url
      };

      if (editingStaff) {
        const { error } = await supabase
          .from('staff_members')
          .update(staffData)
          .eq('id', editingStaff.id);

        if (error) throw error;
        showModal('success', 'Success', 'Staff member updated successfully');
      } else {
        const { error } = await supabase
          .from('staff_members')
          .insert([staffData]);

        if (error) throw error;
        showModal('success', 'Success', 'Staff member added successfully');
      }

      setShowAddModal(false);
      fetchStaffMembers();
    } catch (error) {
      console.error('Error saving staff member:', error);
      showModal('error', 'Error', 'Failed to save staff member');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (event) => {
    if (event.target.files.length > 0) {
      setPhotoFile(event.target.files[0]);
    }
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const groupStaffByHierarchy = () => {
    const groups = {
      'MSWDO WELFARE OFFICER': [],
      'SOCIAL WELFARE OFFICER III': [],
      'SOCIAL WELFARE ASSISTANT': [],
      'CHILD DEVT TEACHER 2': [],
      'SUPPORT STAFF': [],
      'ADMINISTRATIVE STAFF': []
    };

    staffMembers.forEach(staff => {
      if (['MUNICIPAL LINK', 'LGU LINK'].includes(staff.hierarchy)) {
        groups['SUPPORT STAFF'].push(staff);
      } else if (['ADMINISTRATIVE AIDE', 'PWD FOCAL PERSON'].includes(staff.hierarchy)) {
        groups['ADMINISTRATIVE STAFF'].push(staff);
      } else if (groups[staff.hierarchy]) {
        groups[staff.hierarchy].push(staff);
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 text-xl font-semibold">Loading Staff Directory...</p>
        </div>
      </div>
    );
  }

  const staffGroups = groupStaffByHierarchy();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-12 px-4">
      <Modal isOpen={modal.isOpen} onClose={closeModal} type={modal.type} title={modal.title} message={modal.message} />

      <div className="max-w-7xl mx-auto">
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
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6">
              <IoPersonOutline size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Our Staff Directory
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Meet our dedicated team of professionals committed to serving our community
            </p>
          </div>

                     {/* Add Staff Button */}
           <div className="flex justify-center mb-12">
             <button
               onClick={handleAddStaff}
               className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center"
             >
               <IoPersonOutline className="mr-2" size={20} />
               Add Staff Member
             </button>
           </div>

          {/* Staff Directory */}
          <div className="space-y-12">
            {Object.entries(staffGroups).map(([groupName, staffList]) => {
              if (staffList.length === 0) return null;
              
              return (
                <div key={groupName} className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-indigo-200 pb-2">
                    {groupName}
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                         {staffList.map((staff) => (
                       <StaffCard
                         key={staff.id}
                         staff={staff}
                         onEdit={handleEditStaff}
                         onDelete={handleDeleteStaff}
                         isAdmin={true}
                       />
                     ))}
                  </div>
                </div>
              );
            })}
          </div>

                     {staffMembers.length === 0 && (
             <div className="text-center py-12">
               <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <IoPersonOutline size={48} className="text-indigo-400" />
               </div>
               <h3 className="text-xl font-semibold text-gray-800 mb-2">No Staff Members Yet</h3>
               <p className="text-gray-600 mb-6">
                 Start building your staff directory by adding team members.
               </p>
               <button
                 onClick={handleAddStaff}
                 className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
               >
                 Add First Staff Member
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
          <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <IoClose size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Position *</label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                      placeholder="Enter position"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Hierarchy Level *</label>
                    <select
                      name="hierarchy"
                      value={formData.hierarchy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                    >
                      <option value="">Select hierarchy level</option>
                      {hierarchyOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Location/Office</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                      placeholder="Enter location or office"
                    />
                  </div>
                </div>

                <FileUpload
                  label="Staff Photo"
                  file={photoFile}
                  onFileChange={handlePhotoChange}
                  icon={IoImageOutline}
                />

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center text-white ${
                      submitting 
                        ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        {editingStaff ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingStaff ? 'Update Staff' : 'Add Staff'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
