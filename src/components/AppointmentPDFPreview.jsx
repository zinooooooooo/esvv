import React, { useMemo, useState } from 'react';
import { generateAppointmentPDF } from '../services/pdfService';
import { supabase } from '../supabase';

const AppointmentPDFPreview = ({ appointment, onClose, onDownload }) => {
  const [form, setForm] = useState({
    first_name: appointment.first_name || '',
    middle_name: appointment.middle_name || '',
    last_name: appointment.last_name || '',
    gender: appointment.gender || '',
    barangay: appointment.barangay || '',
    phone: appointment.phone || '',
    id_type: appointment.id_type || '',
    id_number: appointment.id_number || '',
    appointee: appointment.appointee || '',
    service: appointment.service || '',
    appointment_date: appointment.appointment_date || '',
    appointment_time: (appointment.appointment_time || '').toString().slice(0, 5) || '',
    appointment_notes: appointment.appointment_notes || ''
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const fullName = useMemo(() => `${form.first_name || ''} ${form.middle_name || ''} ${form.last_name || ''}`.replace(/\s+/g, ' ').trim(), [form.first_name, form.middle_name, form.last_name]);
  const appointmentDate = useMemo(() => (
    form.appointment_date
      ? new Date(form.appointment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Not scheduled'
  ), [form.appointment_date]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSaveError('');
    setSaveSuccess('');
  };

  const handleDownload = () => {
    try {
      const merged = { ...appointment, ...form };
      const doc = generateAppointmentPDF(merged);
      const fileName = `appointment_${appointment.id}_${merged.first_name}_${merged.last_name}.pdf`;
      doc.save(fileName);
      onDownload && onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const table = appointment.table_source;
      if (!table) throw new Error('Missing table source for this appointment.');

      const updatePayload = {
        first_name: form.first_name,
        middle_name: form.middle_name,
        last_name: form.last_name,
        gender: form.gender,
        barangay: form.barangay,
        phone: form.phone,
        id_type: form.id_type,
        id_number: form.id_number,
        appointee: form.appointee,
        service: form.service,
        appointment_date: form.appointment_date || null,
        appointment_time: form.appointment_time || null,
        appointment_notes: form.appointment_notes || null
      };

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', appointment.id);

      if (error) throw error;
      setSaveSuccess('Changes saved successfully.');
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-[10002] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Appointment Form Preview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Preview Content */}
        <div className="p-4">
          <div className="bg-white border border-gray-300 p-6 max-w-2xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Appointment Form - {fullName}
              </h1>
              <div className="flex justify-between text-sm text-gray-600">
                <div className="text-left">
                  <p className="font-semibold">DSWD</p>
                  <p className="font-bold text-lg">SAN VICENTE MUNICIPAL HALL</p>
                  <p className="text-sm">San Vicente, Ilocos Sur</p>
                  <p className="text-sm">esvmswdo@gmail.com</p>
                </div>
                <div className="text-right">
                  <p>Date: {appointmentDate}</p>
                  <p>Appointee: {fullName}</p>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="mb-4">
              <div className="bg-gray-100 px-4 py-2 border border-gray-300 mb-3">
                <h3 className="font-bold text-gray-900">Personal Information</h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">First Name</label>
                    <input value={form.first_name} onChange={handleChange('first_name')} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Middle Name</label>
                    <input value={form.middle_name} onChange={handleChange('middle_name')} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Last Name</label>
                    <input value={form.last_name} onChange={handleChange('last_name')} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Gender</label>
                    <input value={form.gender} onChange={handleChange('gender')} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Barangay</label>
                    <input value={form.barangay} onChange={handleChange('barangay')} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cellphone Number</label>
                  <input value={form.phone} onChange={handleChange('phone')} className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm" />
                </div>
              </div>
            </div>

            {/* Service Appointed Section */}
            <div className="mb-4">
              <div className="bg-gray-100 px-4 py-2 border border-gray-300 mb-3">
                <h3 className="font-bold text-gray-900">Service Appointed</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sector</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {appointment.service_type || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Appointee</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {form.appointee || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Service</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {form.service || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Date of Appointment</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {appointmentDate}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Time</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {form.appointment_time || 'Not scheduled'}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700 min-h-[60px]">
                  {form.appointment_notes || 'No notes provided'}
                </div>
              </div>
            </div>

            {/* ID Information Section */}
            <div className="mb-4">
              <div className="bg-gray-100 px-4 py-2 border border-gray-300 mb-3">
                <h3 className="font-bold text-gray-900">ID Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Type of ID</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {form.id_type || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">ID Number</label>
                  <div className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm bg-gray-50 text-gray-700">
                    {form.id_number || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="mb-3">
              <p className="text-sm">
                <span className="font-bold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  appointment.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  appointment.status === 'declined' ? 'bg-red-100 text-red-800' :
                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status || 'Pending'}
                </span>
              </p>
              {form.appointment_notes && (
                <p className="text-sm mt-1">
                  <span className="font-medium">Notes:</span> {form.appointment_notes}
                </p>
              )}
            </div>

            {/* Page Number */}
            <div className="text-right text-sm text-gray-500 mt-4">
              Page 1/1
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-lg">
          {saveError && (
            <div className="mb-3 text-sm text-red-600">{saveError}</div>
          )}
          {saveSuccess && (
            <div className="mb-3 text-sm text-green-700">{saveSuccess}</div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 border ${saving ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600'}`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPDFPreview;
