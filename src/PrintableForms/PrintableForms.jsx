import React, { useState } from 'react';
import { IoClose, IoEyeOutline, IoDownloadOutline } from 'react-icons/io5';
import mammoth from 'mammoth';

const PrintableFormsModal = ({ isOpen, onClose }) => {
  const [previewForm, setPreviewForm] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form definitions with titles and file paths
  const forms = [
    {
      id: 'application-form-iso',
      title: 'Application Form ISO',
      description: '',
      filePath: '/Application-Form-ISO.docx',
      fileName: 'Application-Form-ISO.docx',
      fileType: 'docx'
    },
    {
      id: 'consent-to-travel',
      title: 'Consent to Travel',
      description: '',
      filePath: '/Consent-to-Travel.docx',
      fileName: 'Consent-to-Travel.docx',
      fileType: 'docx'
    },
    {
      id: 'foster-parent-affidavit',
      title: 'Foster Parent Affidavit of Undertaking',
      description: '',
      filePath: '/Foster-Parent-Affidavit-of-Undertaking.docx',
      fileName: 'Foster-Parent-Affidavit-of-Undertaking.docx',
      fileType: 'docx'
    },
    {
      id: 'dafac-form',
      title: 'DAFAC FORM',
      description: '',
      filePath: '/DAFAC-FORM.pdf',
      fileName: 'DAFAC-FORM.pdf',
      fileType: 'pdf'
    }
  ];

  const handleDownload = async (form) => {
    try {
      // Fetch the file from public folder
      const response = await fetch(form.filePath);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = form.fileName;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handlePreview = async (form) => {
    setLoadingPreview(true);
    setPreviewForm(form);
    
    try {
      if (form.fileType === 'pdf') {
        // For PDF files, we'll use an iframe to display
        setPreviewContent('pdf');
        setLoadingPreview(false);
      } else {
        // Fetch the DOCX file
        const response = await fetch(form.filePath);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        const arrayBuffer = await response.arrayBuffer();
        
        // Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewContent(result.value);
        
        // Handle any warnings
        if (result.messages.length > 0) {
          console.warn('Conversion warnings:', result.messages);
        }
        setLoadingPreview(false);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      setPreviewContent('<p class="text-red-600">Failed to load preview. Please download the file to view it.</p>');
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewForm(null);
    setPreviewContent('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Printable Forms</h2>
            <p className="text-sm text-gray-600 mt-1">Download and print standard MSWDO forms.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {previewForm ? (
            // Preview Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{previewForm.title}</h3>
                <button
                  onClick={closePreview}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <IoClose size={18} />
                  <span>Close Preview</span>
                </button>
              </div>
              
              {loadingPreview ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : previewContent === 'pdf' ? (
                // PDF Preview using iframe
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[60vh]">
                  <iframe
                    src={previewForm.filePath}
                    className="w-full h-[60vh]"
                    title={previewForm.title}
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (
                // DOCX Preview (HTML content)
                <div className="bg-white border border-gray-200 rounded-lg p-8 overflow-auto max-h-[60vh]">
                  <div 
                    className="preview-content"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                    style={{
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.6',
                      color: '#374151',
                      fontSize: '14px'
                    }}
                  />
                  <style>{`
                    .preview-content p {
                      margin-bottom: 1rem;
                    }
                    .preview-content h1, .preview-content h2, .preview-content h3 {
                      font-weight: bold;
                      margin-top: 1.5rem;
                      margin-bottom: 1rem;
                    }
                    .preview-content h1 { font-size: 1.5rem; }
                    .preview-content h2 { font-size: 1.25rem; }
                    .preview-content h3 { font-size: 1.125rem; }
                    .preview-content table {
                      border-collapse: collapse;
                      width: 100%;
                      margin: 1rem 0;
                    }
                    .preview-content table td, .preview-content table th {
                      border: 1px solid #e5e7eb;
                      padding: 0.5rem;
                    }
                    .preview-content ul, .preview-content ol {
                      margin-left: 1.5rem;
                      margin-bottom: 1rem;
                    }
                  `}</style>
                </div>
              )}
            </div>
          ) : (
            // Forms List
            <div className="space-y-4">
              {forms.map((form) => (
                <div key={form.id} className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {form.title}
                      </h3>
                      {form.description && (
                        <p className="text-sm text-gray-600">
                          {form.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(form)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        title="Preview"
                      >
                        <IoEyeOutline size={18} />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handleDownload(form)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm hover:shadow-md"
                        title="Download"
                      >
                        <IoDownloadOutline size={18} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintableFormsModal;
