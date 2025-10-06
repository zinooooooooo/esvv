import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Upload,
  Folder,
  FileText,
  Trash2,
  Star,
  Download,
  Grid,
  List,
  Plus,
  Eye,
  Edit,
  Check,
  X,
  Menu,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { documentService, folderService, fileService } from '../services';

export default function FunctionalDocumentManager() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewModal, setPreviewModal] = useState({ show: false, document: null });
  const fileInputRef = useRef(null);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [foldersData, documentsData] = await Promise.all([
        folderService.getFolders(),
        documentService.getDocuments()
      ]);
      setFolders(foldersData);
      setDocuments(documentsData);
      
      // Set initial selected folder to "All Documents"
      const allDocumentsFolder = foldersData.find(f => f.name === 'All Documents');
      if (allDocumentsFolder) {
        setSelectedFolder(allDocumentsFolder.id);
      }
    } catch (error) {
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Get folder counts
  const getFolderCounts = () => {
    return folders.map(folder => {
      let count = 0;
      if (folder.name === 'All Documents') {
        count = documents.length;
      } else if (folder.name === 'Starred') {
        count = documents.filter(doc => doc.starred).length;
      } else {
        count = documents.filter(doc => doc.folder_id === folder.id).length;
      }
      return { ...folder, count };
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Get the selected folder name for comparison
    const selectedFolderName = folders.find(f => f.id === selectedFolder)?.name;
    
    const matchesFolder =
      selectedFolderName === 'All Documents' || 
      doc.folder_id === selectedFolder || 
      (selectedFolderName === 'Starred' && doc.starred);
    return matchesSearch && matchesFolder;
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showNotification('Please enter a folder name', 'error');
      return;
    }

    try {
      const newFolder = await folderService.createFolder(newFolderName);
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowNewFolderModal(false);
      showNotification('Folder created successfully', 'success');
    } catch (error) {
      showNotification('Error creating folder', 'error');
    }
  };

  const handleUpdateFolder = async (folderId, newName) => {
    if (!newName.trim()) {
      showNotification('Please enter a folder name', 'error');
      return;
    }

    try {
      await folderService.updateFolder(folderId, newName);
      setFolders(prev => prev.map(f => 
        f.id === folderId ? { ...f, name: newName.trim() } : f
      ));
      setEditingFolder(null);
      showNotification('Folder updated successfully', 'success');
    } catch (error) {
      showNotification('Error updating folder', 'error');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Are you sure you want to delete this folder and all its documents?')) {
      return;
    }

    try {
      await folderService.deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setDocuments(prev => prev.filter(doc => doc.folder_id !== folderId));
      
      if (selectedFolder === folderId) {
        // Find the "All Documents" folder to set as selected
        const allDocumentsFolder = folders.find(f => f.name === 'All Documents');
        if (allDocumentsFolder) {
          setSelectedFolder(allDocumentsFolder.id);
        }
      }
      
      showNotification('Folder deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting folder', 'error');
    }
  };

  const handleFileUpload = async (files, targetFolder = selectedFolder) => {
    // If targetFolder is the "All Documents" folder, use "General" folder instead
    const selectedFolderName = folders.find(f => f.id === targetFolder)?.name;
    if (selectedFolderName === 'All Documents') {
      const generalFolder = folders.find(f => f.name === 'General');
      if (generalFolder) {
        targetFolder = generalFolder.id;
      }
    }
    const fileList = Array.from(files);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadId = `upload_${Date.now()}_${i}`;
      
      try {
        setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }));
       
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[uploadId] || 0;
            if (currentProgress >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [uploadId]: currentProgress + 10 };
          });
        }, 100);

        const newDocument = await documentService.uploadDocument(file, targetFolder);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [uploadId]: 100 }));
        
        setDocuments(prev => [...prev, newDocument]);
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const updated = { ...prev };
            delete updated[uploadId];
            return updated;
          });
        }, 1000);
        
      } catch (error) {
        showNotification(`Error uploading ${file.name}`, 'error');
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[uploadId];
          return updated;
        });
      }
    }
    
    showNotification(`${fileList.length} file(s) uploaded successfully`, 'success');
  };

  const toggleStar = async (id) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    try {
      await documentService.updateDocument(id, { starred: !doc.starred });
      setDocuments(prev => prev.map(d => 
        d.id === id ? { ...d, starred: !d.starred } : d
      ));
    } catch (error) {
      showNotification('Error updating document', 'error');
    }
  };

  const deleteDocument = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      showNotification('Document deleted successfully', 'success');
    } catch (error) {
      showNotification('Error deleting document', 'error');
    }
  };

  const downloadFile = (doc) => {
    if (doc.file_url) {
      fileService.downloadFile(doc.file_url, doc.original_name);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const getFileIcon = (type) => {
    const className = 'text-white rounded-lg p-2 w-12 h-12 flex items-center justify-center text-xs font-bold shadow-md';
    const iconMap = {
      pdf: <div className={`bg-gradient-to-br from-red-500 to-red-600 ${className}`}>PDF</div>,
      word: <div className={`bg-gradient-to-br from-blue-500 to-blue-600 ${className}`}>DOC</div>,
      excel: <div className={`bg-gradient-to-br from-green-500 to-green-600 ${className}`}>XLS</div>,
      powerpoint: <div className={`bg-gradient-to-br from-orange-500 to-orange-600 ${className}`}>PPT</div>,
      image: <div className={`bg-gradient-to-br from-purple-500 to-purple-600 ${className}`}>IMG</div>,
      video: <div className={`bg-gradient-to-br from-pink-500 to-pink-600 ${className}`}>VID</div>,
      text: <div className={`bg-gradient-to-br from-indigo-500 to-indigo-600 ${className}`}>TXT</div>,
      code: <div className={`bg-gradient-to-br from-slate-500 to-slate-600 ${className}`}>CODE</div>,
    };
    return iconMap[type] || <div className={`bg-gradient-to-br from-gray-500 to-gray-600 ${className}`}>FILE</div>;
  };

  const handlePreview = (doc) => {
    setPreviewModal({ show: true, document: doc });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  const foldersWithCounts = getFolderCounts();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div data-testid="admin-document-sidebar" className={`bg-white shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-800">Manage Documents</h1>
            )}
           
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {foldersWithCounts.map(folder => (
              <div key={folder.id} className="group relative">
                <div
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    selectedFolder === folder.id
                      ? 'bg-blue-50 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {folder.name === 'All Documents' ? <FileText className="h-5 w-5" /> : 
                     folder.name === 'Starred' ? <Star className="h-5 w-5" /> : 
                     <Folder className="h-5 w-5" />}
                    {!sidebarCollapsed && (
                      <span className="font-medium">{folder.name}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                        {folder.count}
                      </span>
                      {folder.editable && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolder(folder.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder.id);
                            }}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {editingFolder === folder.id && !sidebarCollapsed && (
                  <div className="absolute inset-0 bg-white rounded-lg shadow-md border z-10 flex items-center p-2">
                    <input
                      type="text"
                      defaultValue={folder.name}
                      className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateFolder(folder.id, e.target.value);
                        } else if (e.key === 'Escape') {
                          setEditingFolder(null);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={(e) => {
                        handleUpdateFolder(folder.id, e.target.previousSibling.value);
                      }}
                      className="ml-1 p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setEditingFolder(null)}
                      className="ml-1 p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/AdminDashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
                             <div className="relative">
                 <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Search documents..."
                   className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
               </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
              >
                <Upload className="h-5 w-5" />
                <span>Upload File</span>
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main 
          className={`flex-1 overflow-y-auto p-6 ${isDragging ? 'bg-blue-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {foldersWithCounts.find(f => f.id === selectedFolder)?.name || 'Documents'}
            </h2>
            <div className="text-gray-500">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-medium text-gray-800 mb-3">Uploading files...</h3>
              {Object.entries(uploadProgress).map(([uploadId, progress]) => (
                <div key={uploadId} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Upload {uploadId.split('_')[2]}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Document Grid/List */}
          {filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FileText className="h-20 w-20 mb-4" />
              <p className="text-xl font-medium">No documents found</p>
              <p className="text-sm">Upload files or change your search criteria</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map(doc => (
                <div key={doc.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      {getFileIcon(doc.file_type)}
                      <button
                        onClick={() => toggleStar(doc.id)}
                        className={`p-2 rounded-full transition-colors ${
                          doc.starred ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${doc.starred ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {fileService.formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => downloadFile(doc)}
                        className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                                             <button 
                         onClick={() => handlePreview(doc)}
                         className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors" 
                         title="Preview"
                       >
                         <Eye className="h-4 w-4" />
                       </button>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Folder</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          {getFileIcon(doc.file_type)}
                          <div>
                            <div className="font-medium text-gray-800">{doc.name}</div>
                            <div className="text-sm text-gray-500">{doc.file_type.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {foldersWithCounts.find(f => f.id === doc.folder_id)?.name || 'General'}
                      </td>
                                              <td className="px-6 py-4 text-gray-600">{fileService.formatFileSize(doc.file_size)}</td>
                                              <td className="px-6 py-4 text-gray-600">
                          {new Date(doc.updated_at).toLocaleDateString()}
                        </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleStar(doc.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              doc.starred ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                            }`}
                          >
                            <Star className={`h-4 w-4 ${doc.starred ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            onClick={() => downloadFile(doc)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                                                     <button 
                             onClick={() => handlePreview(doc)}
                             className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                           >
                             <Eye className="h-4 w-4" />
                           </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Folder</h2>
            <input
              type="text"
              placeholder="Enter folder name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolderModal(false);
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-dashed border-blue-500">
            <div className="text-center">
              <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-blue-700">Drop files here to upload</p>
              <p className="text-sm text-gray-600 mt-2">Files will be added to the current folder</p>
            </div>
          </div>
        </div>
      )}

             {/* Preview Modal */}
       {previewModal.show && previewModal.document && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-gray-800">{previewModal.document.name}</h2>
               <button
                 onClick={() => setPreviewModal({ show: false, document: null })}
                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
             
             <div className="flex items-center space-x-4 mb-4 p-4 bg-gray-50 rounded-lg">
               {getFileIcon(previewModal.document.file_type)}
               <div>
                 <p className="text-sm text-gray-600">
                   <span className="font-medium">Size:</span> {fileService.formatFileSize(previewModal.document.file_size)}
                 </p>
                 <p className="text-sm text-gray-600">
                   <span className="font-medium">Type:</span> {previewModal.document.file_type.toUpperCase()}
                 </p>
                 <p className="text-sm text-gray-600">
                   <span className="font-medium">Created:</span> {new Date(previewModal.document.created_at).toLocaleDateString()}
                 </p>
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto">
               {previewModal.document.file_type === 'image' ? (
                 <div className="flex justify-center">
                   <img 
                     src={previewModal.document.file_url} 
                     alt={previewModal.document.name}
                     className="max-w-full max-h-96 object-contain rounded-lg"
                   />
                 </div>
               ) : previewModal.document.file_type === 'pdf' ? (
                 <div className="w-full h-96">
                   <iframe
                     src={previewModal.document.file_url}
                     className="w-full h-full border rounded-lg"
                     title={previewModal.document.name}
                   />
                 </div>
               ) : previewModal.document.file_type === 'text' ? (
                 <div className="bg-gray-50 p-4 rounded-lg">
                   <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                     {/* This would need to fetch the actual text content */}
                     <p className="text-gray-500 italic">Text preview not available for this file type.</p>
                   </pre>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                   <FileText className="h-16 w-16 mb-4" />
                   <p className="text-lg font-medium">Preview not available</p>
                   <p className="text-sm">This file type cannot be previewed in the browser</p>
                   <button
                     onClick={() => downloadFile(previewModal.document)}
                     className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                   >
                     <Download className="h-4 w-4" />
                     <span>Download to view</span>
                   </button>
                 </div>
               )}
             </div>
             
             <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
               <button
                 onClick={() => downloadFile(previewModal.document)}
                 className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
               >
                 <Download className="h-4 w-4" />
                 <span>Download</span>
               </button>
               <button
                 onClick={() => setPreviewModal({ show: false, document: null })}
                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Toast Notifications */}
       {notification && (
         <div className="fixed top-4 right-4 z-50">
           <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${
             notification.type === 'success' 
               ? 'bg-green-50 border-green-200 text-green-800' 
               : notification.type === 'error'
               ? 'bg-red-50 border-red-200 text-red-800'
               : 'bg-blue-50 border-blue-200 text-blue-800'
           }`}>
             {notification.type === 'success' ? (
               <CheckCircle className="h-5 w-5" />
             ) : notification.type === 'error' ? (
               <AlertCircle className="h-5 w-5" />
             ) : (
               <AlertCircle className="h-5 w-5" />
             )}
             <span className="font-medium">{notification.message}</span>
             <button
               onClick={() => setNotification(null)}
               className="ml-2 hover:bg-white/20 rounded p-1"
             >
               <X className="h-4 w-4" />
             </button>
           </div>
         </div>
       )}
     </div>
   );
 }