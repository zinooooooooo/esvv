import { supabase } from '../supabase';

// Document Management API
export const documentService = {
  // Get all documents
  getDocuments: async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Get documents by folder
  getDocumentsByFolder: async (folderId) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents by folder:', error);
      throw error;
    }
  },

  // Get starred documents
  getStarredDocuments: async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('starred', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching starred documents:', error);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (file, folderId = 'general') => {
    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Create document record in database
      const documentData = {
        name: file.name,
        original_name: file.name,
        file_path: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: getFileType(file.name),
        mime_type: file.type,
        folder_id: folderId,
        starred: false
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  // Update document
  updateDocument: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (id) => {
    try {
      // Get document to delete file from storage
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete file from storage
      if (document.file_path) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([document.file_path]);

        if (storageError) console.error('Error deleting file from storage:', storageError);
      }


      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },


  toggleStar: async (id) => {
    try {
      const { data: currentDoc, error: fetchError } = await supabase
        .from('documents')
        .select('starred')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('documents')
        .update({ starred: !currentDoc.starred })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  },

  // Search documents
  searchDocuments: async (query) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }
};

// Utility function to get file type
const getFileType = (filename) => {
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
};
