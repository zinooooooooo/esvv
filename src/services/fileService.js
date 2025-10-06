// File utility functions
export const fileService = {
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file type from filename
  getFileType: (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const typeMap = {
      pdf: 'pdf',
      docx: 'word',
      doc: 'word',
      xlsx: 'excel',
      xls: 'excel',
      pptx: 'powerpoint',
      ppt: 'powerpoint',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      mp4: 'video',
      avi: 'video',
      mov: 'video',
      txt: 'text',
      md: 'text',
      js: 'code',
      html: 'code',
      css: 'code'
    };
    return typeMap[ext] || 'other';
  },

  // Validate file upload
  validateFile: (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/quicktime'
    ];

    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported');
    }

    return true;
  },

  // Download file
  downloadFile: (fileUrl, fileName) => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Preview file (for supported types)
  previewFile: (fileUrl, fileType) => {
    const previewableTypes = ['pdf', 'image'];
    if (previewableTypes.includes(fileType)) {
      window.open(fileUrl, '_blank');
    } else {
      // For non-previewable files, trigger download
      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
};
