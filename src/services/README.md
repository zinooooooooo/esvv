# API Services Documentation

This directory contains all the API services for the document management system.

## Structure

```
services/
├── index.js              # Main export file
├── documentService.js    # Document CRUD operations
├── folderService.js      # Folder management operations
├── fileService.js        # File utility functions
└── README.md            # This documentation
```

## Services Overview

### 1. Document Service (`documentService.js`)
Handles all document-related operations:
- `getDocuments()` - Fetch all documents
- `getDocumentsByFolder(folderId)` - Get documents in a specific folder
- `getStarredDocuments()` - Get starred documents
- `uploadDocument(file, folderId)` - Upload a new document
- `updateDocument(id, updates)` - Update document metadata
- `deleteDocument(id)` - Delete document and file
- `toggleStar(id)` - Toggle star status
- `searchDocuments(query)` - Search documents by name

### 2. Folder Service (`folderService.js`)
Handles folder management operations:
- `getFolders()` - Fetch all folders (creates defaults if none exist)
- `createFolder(name)` - Create a new folder
- `updateFolder(id, name)` - Update folder name
- `deleteFolder(id)` - Delete folder and move documents to General
- `getFolderWithCount(folderId)` - Get document count for a folder

### 3. File Service (`fileService.js`)
Utility functions for file operations:
- `formatFileSize(bytes)` - Format bytes to human-readable size
- `getFileType(filename)` - Determine file type from extension
- `validateFile(file)` - Validate file size and type
- `downloadFile(fileUrl, fileName)` - Download file
- `previewFile(fileUrl, fileType)` - Preview or download file

## Usage Example

```javascript
import { documentService, folderService, fileService } from '../services';

// Upload a document
const uploadDocument = async (file) => {
  try {
    // Validate file
    fileService.validateFile(file);
    
    // Upload to folder
    const document = await documentService.uploadDocument(file, 'general');
    
    // Format size for display
    const sizeFormatted = fileService.formatFileSize(file.size);
    
    return { ...document, sizeFormatted };
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Get documents with folder counts
const loadData = async () => {
  const [folders, documents] = await Promise.all([
    folderService.getFolders(),
    documentService.getDocuments()
  ]);
  
  // Add counts to folders
  const foldersWithCounts = await Promise.all(
    folders.map(async (folder) => ({
      ...folder,
      count: await folderService.getFolderWithCount(folder.id)
    }))
  );
  
  return { folders: foldersWithCounts, documents };
};
```

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  folder_id UUID REFERENCES folders(id),
  starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Folders Table
```sql
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  editable BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Supabase Storage

Files are stored in Supabase Storage bucket named `documents` with the following structure:
- File naming: `{timestamp}_{original_filename}`
- Public URLs are generated for direct access
- File deletion removes both storage file and database record

## Error Handling

All services include proper error handling:
- Database errors are logged and re-thrown
- File validation errors include descriptive messages
- Storage errors are handled gracefully
- Network errors are caught and logged

## Migration from LocalStorage

The current implementation uses localStorage. To migrate to this API structure:

1. Replace the `api` object in `DocuManagement.jsx` with service imports
2. Update all function calls to use the new service methods
3. Handle the async nature of the new API calls
4. Update error handling to use the new error format
