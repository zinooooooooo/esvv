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
  IoImageOutline,
  IoSearchOutline,
  IoFilterOutline,
  IoAddOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoEyeOutline,
  IoDownloadOutline
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

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHierarchy, setFilterHierarchy] = useState('');
  const [selectedStaff, setSelectedStaff] = useState([]);
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
  }, []);

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

  const handleBulkDelete = async () => {
    if (selectedStaff.length === 0) {
      showModal('error', 'No Selection', 'Please select staff members to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStaff.length} staff member(s)?`)) return;

    try {
      const { error } = await supabase
        .from('staff_members')
        .delete()
        .in('id', selectedStaff);

      if (error) throw error;
      
      showModal('success', 'Success', `${selectedStaff.length} staff member(s) deleted successfully`);
      setSelectedStaff([]);
      fetchStaffMembers();
    } catch (error) {
      console.error('Error deleting staff members:', error);
      showModal('error', 'Error', 'Failed to delete staff members');
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
    if (!formData.name || !formData.position || !formData.hierarchy) {
      return showModal('error', 'Validation Error', 'Please fill in all required fields');
    }

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

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStaff(filteredStaff.map(staff => staff.id));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleSelectStaff = (staffId, checked) => {
    if (checked) {
      setSelectedStaff([...selectedStaff, staffId]);
    } else {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterHierarchy || staff.hierarchy === filterHierarchy;
    return matchesSearch && matchesFilter;
  });

  const exportStaffData = () => {
    const csvContent = [
      ['Name', 'Position', 'Hierarchy', 'Phone', 'Email', 'Location'],
      ...filteredStaff.map(staff => [
        staff.name,
        staff.position,
        staff.hierarchy,
        staff.phone || '',
        staff.email || '',
        staff.location || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_directory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-400 animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-700 text-xl font-semibold">Loading Staff Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-24 pb-12 px-4">
      <Modal isOpen={modal.isOpen} onClose={closeModal} type={modal.type} title={modal.title} message={modal.message} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate("/AdminDashboard")}
            className="flex items-center text-gray-600 hover:text-indigo-600 transition-all duration-300 group bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl"
          >
            <IoArrowBack size={24} className="mr-3 group-hover:-translate-x-2 transition-transform duration-300" />
            <span className="text-lg font-semibold">Back to Dashboard</span>
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
              Staff Management
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Manage your staff directory with advanced tools and features
            </p>
          </div>

          {/* Controls */}
          <div className="mb-8 space-y-6">
            {/* Search and Filter */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <IoSearchOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                <input
                  type="text"
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                />
              </div>
              
              <div className="relative">
                <IoFilterOutline className="absolute left-4 top-4 text-indigo-500" size={20} />
                <select
                  value={filterHierarchy}
                  onChange={(e) => setFilterHierarchy(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all duration-300"
                >
                  <option value="">All Hierarchy Levels</option>
                  {hierarchyOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAddStaff}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center"
                >
                  <IoAddOutline className="mr-2" size={20} />
                  Add Staff
                </button>
                <button
                  onClick={exportStaffData}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                  title="Export to CSV"
                >
                  <IoDownloadOutline size={20} />
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedStaff.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-800 font-semibold">
                    {selectedStaff.length} staff member(s) selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <IoTrashOutline className="mr-2" size={16} />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Staff Table */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStaff.length === filteredStaff.length && filteredStaff.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Photo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hierarchy</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(staff.id)}
                          onChange={(e) => handleSelectStaff(staff.id, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        {staff.photo_url ? (
                          <img
                            src={staff.photo_url}
                            alt={staff.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center border-2 border-indigo-100">
                            <IoPersonOutline size={20} className="text-white" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{staff.name}</div>
                          <div className="text-sm text-gray-500">{staff.location || 'No location'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">{staff.position}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                          {staff.hierarchy}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {staff.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <IoCallOutline className="mr-2" size={14} />
                              {staff.phone}
                            </div>
                          )}
                          {staff.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <IoMailOutline className="mr-2" size={14} />
                              {staff.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditStaff(staff)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <IoPencilOutline size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(staff.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <IoTrashOutline size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <IoPersonOutline size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterHierarchy 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by adding your first staff member.'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-2xl">
              <div className="text-2xl font-bold">{staffMembers.length}</div>
              <div className="text-indigo-100">Total Staff</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl">
              <div className="text-2xl font-bold">{filteredStaff.length}</div>
              <div className="text-green-100">Filtered Results</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-2xl">
              <div className="text-2xl font-bold">{selectedStaff.length}</div>
              <div className="text-blue-100">Selected</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-2xl">
              <div className="text-2xl font-bold">{hierarchyOptions.length}</div>
              <div className="text-orange-100">Hierarchy Levels</div>
            </div>
          </div>
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
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                  >
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
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

export default StaffManagement;
