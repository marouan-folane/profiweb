"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getFilesByFolder, createFolder, deleteFolder } from "@/config/functions/folder";
import { uploadFiles } from "@/config/functions/upload";
import { deleteFile } from "@/config/functions/file";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";

const FoldersTab = ({ projectId }) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [allProjectFolders, setAllProjectFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState([]);

  // ALL users can upload files and manage folders
  const canUploadFiles = true; // Everyone can upload
  const canManageFolders = true; // Everyone can manage folders

  // Check if current folder is "Generated instructions pdf"
  const isGeneratedFolder = selectedFolder?.name?.toLowerCase() === "generated instructions pdf";

  // Fetch folders
  const {
    data: foldersRes,
    isLoading: isLoadingFolders,
    error: foldersError
  } = useQuery({
    queryKey: ['folders', projectId],
    queryFn: () => getFolders(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch files when folder is selected
  const {
    data: filesRes,
    isLoading: isLoadingFiles,
    isError: filesError,
    refetch: refetchFiles
  } = useQuery({
    queryKey: ['files', selectedFolder?.id],
    queryFn: () => getFilesByFolder(selectedFolder?.id),
    enabled: !!selectedFolder?.id && isModalOpen,
    staleTime: 1000 * 60 * 5,
  });

  // Create Folder Mutation
  const createFolderMutation = useMutation({
    mutationFn: (name) => createFolder({ name, projectId }),
    onSuccess: (res) => {
      if (res?.status === "success") {
        toast.success("Folder created successfully");
        setIsCreateModalOpen(false);
        setNewFolderName("");
        queryClient.invalidateQueries(['folders', projectId]);
      } else {
        toast.error(res?.message || "Failed to create folder");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create folder");
    }
  });

  // Upload Files Mutation
  const uploadMutation = useMutation({
    mutationFn: (files) => uploadFiles(files, projectId, selectedFolder.id),
    onSuccess: (data) => {
      if (data?.status === "success" || data?.files) {
        toast.success("Files uploaded successfully");
        setUploadingFiles([]);
        queryClient.invalidateQueries(['files', selectedFolder.id]);
        refetchFiles();
      } else {
        toast.error(data?.message || "Upload failed");
      }
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error?.response?.data?.message || error.message || 'Upload failed. Please try again.');
    }
  });

  // Delete File Mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId) => deleteFile(fileId),
    onSuccess: (res) => {
      if (res?.status === "success") {
        toast.success("File deleted successfully");
        queryClient.invalidateQueries(['files', selectedFolder?.id]);
        refetchFiles();
      } else {
        toast.error(res?.message || "Failed to delete file");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete file");
    }
  });

  // Delete Folder Mutation
  const deleteFolderMutation = useMutation({
    mutationFn: (id) => deleteFolder(id),
    onSuccess: (res) => {
      if (res?.status === "success") {
        toast.success("Folder deleted successfully");
        queryClient.invalidateQueries(['folders', projectId]);
      } else {
        toast.error(res?.message || "Failed to delete folder");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete folder");
    }
  });

  // Find ALL project folders from folders data
  useEffect(() => {
    if (foldersRes?.data?.folders) {
      setAllProjectFolders(foldersRes.data.folders);
    }
  }, [foldersRes]);

  // Update files list when filesRes changes
  useEffect(() => {
    if (!filesRes?.data) {
      setFilesList([]);
      return;
    }

    let files = [];

    if (filesRes.data.files && Array.isArray(filesRes.data.files)) {
      files = filesRes.data.files;
    } else if (filesRes.data.file) {
      if (Array.isArray(filesRes.data.file)) {
        files = filesRes.data.file;
      } else {
        files = [filesRes.data.file];
      }
    } else if (Array.isArray(filesRes.data)) {
      files = filesRes.data;
    }

    setFilesList(files);
  }, [filesRes]);

  // Handle Project folder click
  const handleFolderClick = (folder) => {
    setSelectedFolder({
      id: folder._id,
      name: folder.name || 'Untitled Folder'
    });
    setIsModalOpen(true);
  };

  // Handle Delete Folder
  const handleDeleteFolder = (e, folder) => {
    e.stopPropagation(); // Prevent opening the folder modal

    if (window.confirm(`Are you sure you want to delete "${folder.name}"? This will also delete all files inside.`)) {
      deleteFolderMutation.mutate(folder._id);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFolder(null);
    setFilesList([]);
    setUploadingFiles([]);
  };

  // Handle Create Folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }
    createFolderMutation.mutate(newFolderName);
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploadingFiles(selectedFiles);

    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };

  // Handle File Deletion
  const handleDeleteFile = (e, fileId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFileMutation.mutate(fileId);
    }
  };

  // Get file icon based on file type
  const getFileIcon = (file) => {
    const filename = file.filename || '';
    const type = file.mimetype || '';

    if (filename.includes('.pdf') || type.includes('pdf')) {
      return "vscode-icons:file-type-pdf2";
    } else if (filename.includes('.doc') || filename.includes('.docx') || type.includes('word')) {
      return "vscode-icons:file-type-word";
    } else if (filename.includes('.jpg') || filename.includes('.jpeg') || filename.includes('.png') || filename.includes('.gif') || type.includes('image')) {
      return "vscode-icons:file-type-image";
    } else if (filename.includes('.xls') || filename.includes('.xlsx') || type.includes('excel')) {
      return "vscode-icons:file-type-excel";
    } else if (filename.includes('.ppt') || filename.includes('.pptx') || type.includes('powerpoint')) {
      return "vscode-icons:file-type-powerpoint";
    } else if (filename.includes('.zip') || filename.includes('.rar') || type.includes('compressed')) {
      return "vscode-icons:file-type-zip";
    }
    return "vscode-icons:file-type-document";
  };

  // Format file size
  const formatFileSize = (size) => {
    if (!size || size === "0") return '0 Bytes';
    const bytes = typeof size === 'string' ? parseInt(size) : size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle file view - FIXED VERSION
  const handleViewFile = (file) => {
    console.log("File object:", file); // Debug log

    let fileUrl = '';

    // Check different possible URL sources
    if (file.url) {
      fileUrl = file.url;
    } else if (file.path) {
      // If path starts with http or https, use as is
      if (file.path.startsWith('http')) {
        fileUrl = file.path;
      }
      // If path starts with /uploads, prepend server URL
      else if (file.path.startsWith('/uploads')) {
        fileUrl = `${process.env.NEXT_PUBLIC_API_URL}${file.path}`;
      }
      // If path starts with uploads (no slash), add slash
      else if (file.path.startsWith('uploads')) {
        fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/${file.path}`;
      }
      // If path is like "pdfs/filename.pdf", add /uploads/ prefix
      else if (file.path.includes('/')) {
        fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.path}`;
      }
      // If path is just a filename, construct URL
      else {
        fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${file.path}`;
      }
    }

    console.log("Constructed URL:", fileUrl); // Debug log

    // Validate URL before opening
    if (!fileUrl) {
      alert('File URL not available');
      return;
    }

    // Check if URL is valid
    try {
      new URL(fileUrl); // This will throw if URL is invalid
      window.open(fileUrl, '_blank');
    } catch (error) {
      console.error('Invalid URL:', fileUrl);
    }
  };

  // Show loading state
  if (isLoadingFolders && projectId) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Loading Folders...</h3>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading project folders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Folder</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={createFolderMutation.isPending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createFolderMutation.isPending && <Icon icon="carbon:circle-dash" className="animate-spin" />}
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {isModalOpen && selectedFolder && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon icon="carbon:folder" className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedFolder.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {filesList.length} file{filesList.length !== 1 ? 's' : ''} in this folder
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {/* Show upload button for ALL users, but hide for Generated instructions folder */}
                {!isGeneratedFolder && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {uploadMutation.isPending ? (
                      <Icon icon="carbon:circle-dash" className="animate-spin" />
                    ) : (
                      <Icon icon="carbon:cloud-upload" />
                    )}
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload Files'}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingFiles ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading files...</p>
                </div>
              ) : filesError ? (
                <div className="text-center py-12">
                  <Icon icon="carbon:warning" className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Files</h3>
                  <p className="text-gray-500">Failed to load files from folder</p>
                </div>
              ) : filesList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="carbon:document-blank" className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Found</h3>
                  <p className="text-gray-500 mb-4">This folder is empty. Upload some files to get started.</p>
                  {/* Show upload suggestion for ALL users, but hide for Generated instructions folder */}
                  {!isGeneratedFolder && (
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="mt-2 text-blue-600 font-medium hover:underline"
                    >
                      Click here to upload
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filesList.map((file, index) => (
                      <div
                        key={file._id || index}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon icon={getFileIcon(file)} className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {file.originalName || file.filename || 'Untitled'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDate(file.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
                          <button
                            onClick={() => handleViewFile(file)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icon icon="carbon:view" />
                            View
                          </button>
                          {/* Show delete button for ALL users, but HIDE for Generated instructions folder */}
                          {!isGeneratedFolder && (
                            <button
                              onClick={(e) => handleDeleteFile(e, file._id)}
                              disabled={deleteFileMutation.isPending}
                              className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-100"
                              title="Delete file"
                            >
                              <Icon icon="carbon:trash-can" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {filesList.length} file{filesList.length !== 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => refetchFiles()}
                  disabled={isLoadingFiles}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Icon icon="carbon:renew" className={isLoadingFiles ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Folders Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Project Folders</h3>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {allProjectFolders.length} folder{allProjectFolders.length !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Show Add Folder button for ALL users */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon icon="carbon:folder-add" />
            Add Folder
          </button>
        </div>

        {allProjectFolders.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Icon icon="carbon:folder-add" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Folders Found</h3>
            <p className="text-gray-500 mb-4">This project doesn't have any folders yet. Create one to organize files.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Folder
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allProjectFolders.map((folder) => (
              <div
                key={folder._id}
                onClick={() => handleFolderClick(folder)}
                className="border border-gray-200 rounded-lg p-4 transition-all cursor-pointer group hover:border-blue-300 hover:shadow-lg hover:bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-900 truncate text-lg flex-1">
                        {folder.name || 'Untitled Folder'}
                      </h4>

                      {/* Show delete folder button for ALL users (except for generated instructions folder) */}
                      {folder.name?.toLowerCase() !== "generated instructions pdf" &&
                        (folder.user === session?.user?.id || folder.user?._id === session?.user?.id) && (
                          <button
                            onClick={(e) => handleDeleteFolder(e, folder)}
                            disabled={deleteFolderMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Delete folder"
                          >
                            {deleteFolderMutation.isPending ? (
                              <Icon icon="carbon:circle-dash" className="animate-spin w-5 h-5" />
                            ) : (
                              <Icon icon="carbon:trash-can" className="w-5 h-5" />
                            )}
                          </button>
                        )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Click to view files
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Icon icon="carbon:calendar" />
                      <span>{new Date(folder.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Icon
                      icon="carbon:chevron-right"
                      className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoldersTab;