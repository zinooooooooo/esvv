import { supabase } from '../supabase';

// Folder Management API
export const folderService = {
  // Get all folders
  getFolders: async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Add default folders if none exist
      if (!data || data.length === 0) {
        const defaultFolders = [
          { name: 'All Documents', is_default: true, editable: false },
          { name: 'Starred', is_default: true, editable: false },
          { name: 'General', is_default: true, editable: true }
        ];
        
        const { data: insertedFolders, error: insertError } = await supabase
          .from('folders')
          .insert(defaultFolders)
          .select();
        
        if (insertError) throw insertError;
        return insertedFolders;
      }
      
      // Ensure we have the default folders
      const hasAllDocuments = data.some(folder => folder.name === 'All Documents');
      const hasStarred = data.some(folder => folder.name === 'Starred');
      const hasGeneral = data.some(folder => folder.name === 'General');
      
      if (!hasAllDocuments || !hasStarred || !hasGeneral) {
        const missingFolders = [];
        if (!hasAllDocuments) missingFolders.push({ name: 'All Documents', is_default: true, editable: false });
        if (!hasStarred) missingFolders.push({ name: 'Starred', is_default: true, editable: false });
        if (!hasGeneral) missingFolders.push({ name: 'General', is_default: true, editable: true });
        
        const { data: insertedFolders, error: insertError } = await supabase
          .from('folders')
          .insert(missingFolders)
          .select();
        
        if (insertError) throw insertError;
        return [...data, ...insertedFolders];
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  },

  // Create new folder
  createFolder: async (name) => {
    try {
      // Validate input
      if (!name || !name.trim()) {
        throw new Error('Folder name is required');
      }

      const folderName = name.trim();
      
      // Check if folder already exists
      const { data: existingFolder, error: checkError } = await supabase
        .from('folders')
        .select('id')
        .eq('name', folderName)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw checkError;
      }

      if (existingFolder) {
        throw new Error('A folder with this name already exists');
      }

      const folderData = {
        name: folderName,
        editable: true,
        is_default: false
      };

      const { data, error } = await supabase
        .from('folders')
        .insert([folderData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating folder:', error);
        throw new Error(`Failed to create folder: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  // Update folder
  updateFolder: async (id, name) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .update({ 
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  // Delete folder
  deleteFolder: async (id) => {
    try {
      // Check if folder is default (should not be deleted)
      const { data: folder, error: fetchError } = await supabase
        .from('folders')
        .select('is_default')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (folder.is_default) {
        throw new Error('Cannot delete default folders');
      }

      // Move all documents in this folder to 'General' folder
      const { data: generalFolder, error: generalError } = await supabase
        .from('folders')
        .select('id')
        .eq('name', 'General')
        .single();

      if (generalError) throw generalError;

      // Update documents to move them to General folder
      const { error: updateError } = await supabase
        .from('documents')
        .update({ folder_id: generalFolder.id })
        .eq('folder_id', id);

      if (updateError) throw updateError;

      // Delete the folder
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },

  // Get folder with document count
  getFolderWithCount: async (folderId) => {
    try {
      let count = 0;
      
      if (folderId === 'all') {
        const { count: totalCount, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        count = totalCount || 0;
      } else if (folderId === 'starred') {
        const { count: starredCount, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('starred', true);
        
        if (error) throw error;
        count = starredCount || 0;
      } else {
        const { count: folderCount, error } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('folder_id', folderId);
        
        if (error) throw error;
        count = folderCount || 0;
      }

      return count;
    } catch (error) {
      console.error('Error getting folder count:', error);
      throw error;
    }
  }
};
