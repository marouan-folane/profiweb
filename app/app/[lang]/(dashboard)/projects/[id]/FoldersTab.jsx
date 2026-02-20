"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolders, getFilesByFolder, createFolder, deleteFolder } from "@/config/functions/folder";
import { getProject, completeContentWorkflow, validateContentChecklist } from "@/config/functions/project";
import {
  getProjectChecklist,
  createOrUpdateItem,
} from "@/config/functions/checklist";
import { uploadFiles } from "@/config/functions/upload";
import { deleteFile } from "@/config/functions/file";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { api } from "@/config/axios.config";

// ── Content Department checklist sections ──────────────────────────
const contentDepartmentSections = [
  {
    id: 'content_planning',
    title: "Content Planning & Strategy",
    items: [
      { id: 'content_strategy', label: 'Content strategy document created', checked: false },
      { id: 'target_audience', label: 'Target audience defined and documented', checked: false },
      { id: 'content_calendar', label: 'Content calendar prepared', checked: false },
      { id: 'seo_keywords', label: 'SEO keywords researched and selected', checked: false },
    ]
  },
  {
    id: 'homepage_content',
    title: "Homepage Content",
    items: [
      { id: 'hero_section', label: 'Hero section copy written', checked: false },
      { id: 'value_proposition', label: 'Value proposition clearly defined', checked: false },
      { id: 'services_overview', label: 'Services/products overview content', checked: false },
      { id: 'about_section', label: 'About us section content', checked: false },
      { id: 'cta_sections', label: 'Call-to-action sections written', checked: false },
    ]
  },
  {
    id: 'page_content',
    title: "Page Content Creation",
    items: [
      { id: 'about_page', label: 'About page content complete', checked: false },
      { id: 'services_pages', label: 'Services/products pages content', checked: false },
      { id: 'contact_page', label: 'Contact page with forms and details', checked: false },
      { id: 'blog_posts', label: 'Initial blog posts (3-5 articles)', checked: false },
      { id: 'faq_section', label: 'FAQ section content', checked: false },
    ]
  },
  {
    id: 'seo_content',
    title: "SEO Content Optimization",
    items: [
      { id: 'meta_titles', label: 'Meta titles written for all pages', checked: false },
      { id: 'meta_descriptions', label: 'Meta descriptions optimized', checked: false },
      { id: 'header_tags', label: 'H1, H2, H3 tags properly used', checked: false },
      { id: 'image_alt_tags', label: 'Image alt text written', checked: false },
      { id: 'internal_linking', label: 'Internal linking strategy implemented', checked: false },
    ]
  },
  {
    id: 'content_quality',
    title: "Content Quality Assurance",
    items: [
      { id: 'proofreading', label: 'All content proofread for errors', checked: false },
      { id: 'brand_voice', label: 'Consistent brand voice maintained', checked: false },
      { id: 'readability', label: 'Readability score checked and optimized', checked: false },
      { id: 'legal_compliance', label: 'Legal compliance (GDPR, terms, privacy)', checked: false },
    ]
  }
];

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

  // Content Submission State
  const [project, setProject] = useState(null);
  const [contentJson, setContentJson] = useState('');
  const [contentText, setContentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPreviewTextModalOpen, setIsPreviewTextModalOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Checklist Modal State
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistSections, setChecklistSections] = useState(contentDepartmentSections);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [isSavingChecklistItem, setIsSavingChecklistItem] = useState(false);
  const [isConfirmingChecklist, setIsConfirmingChecklist] = useState(false);

  const userRole = session?.user?.role?.toLowerCase();
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

  // Load project data
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoadingProject(true);
      const response = await getProject(projectId);
      if (response.status === 'success') {
        const proj = response.data.project;
        setProject(proj);
        if (proj.contentJson) {
          setContentJson(JSON.stringify(proj.contentJson, null, 2));
        }
        // Prefer draft over final content if draft exists
        if (proj.contentDraftText) {
          setContentText(proj.contentDraftText);
        } else if (proj.contentText) {
          setContentText(proj.contentText);
        }
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setIsLoadingProject(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (userRole !== 'd.c' || !contentText || project?.isContentReady || project?.contentStatus === 'completed') return;

    // Don't save if it's identical to what we already have
    if (contentText === project?.contentDraftText || contentText === project?.contentText) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [contentText, userRole, project]);

  const saveDraft = async () => {
    try {
      setIsSavingDraft(true);
      await api.patch(`/projects/${projectId}/save-content-draft`, {
        contentDraftText: contentText
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      toast.error('Please upload a valid JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        setContentJson(JSON.stringify(json, null, 2));
        toast.success('JSON file uploaded and validated');
      } catch (error) {
        toast.error('Invalid JSON format in file');
      }
    };
    reader.readAsText(file);
  };

  const handleFormatText = () => {
    if (!contentText.trim()) return;

    const formatted = contentText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .join('\n\n');

    setContentText(formatted);
    toast.success('Text formatted successfully');
  };

  // Opens the checklist modal after validating both fields are present
  const handleSubmitContent = () => {
    if (!contentJson || !contentText.trim()) {
      toast.error('Both JSON and Text content are required');
      return;
    }
    openChecklistModal();
  };

  // Internal function that actually POSTs the content (called from checklist confirm)
  const doSubmitContent = async () => {
    const response = await api.patch(`/projects/${projectId}/submit-content`, {
      contentJson: JSON.parse(contentJson),
      contentText: contentText
    });
    if (response.data.status === 'success') {
      setProject(response.data.data.project);
    } else {
      throw new Error(response.data.message || 'Failed to submit content');
    }
  };

  // ── Checklist Modal helpers ────────────────────────────────────
  const openChecklistModal = async () => {
    setIsChecklistModalOpen(true);
    setIsLoadingChecklist(true);
    try {
      const response = await getProjectChecklist(projectId);
      if (response.status === 'success') {
        const savedSections = response.data.sections;
        const merged = contentDepartmentSections.map(section => {
          const saved = savedSections.find(s => s.id === section.id);
          if (!saved) return section;
          return {
            ...section,
            items: section.items.map(item => {
              const savedItem = saved.items.find(si => si.id === item.id);
              return savedItem ? { ...item, checked: savedItem.checked } : item;
            })
          };
        });
        setChecklistSections(merged);
      }
    } catch (err) {
      console.error('Error loading checklist:', err);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  const toggleChecklistItem = async (itemId) => {
    const updated = checklistSections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.id !== itemId) return item;
        const updatedItem = { ...item, checked: !item.checked, sectionId: section.id };
        // Fire-and-forget persist
        setIsSavingChecklistItem(true);
        createOrUpdateItem(projectId, {
          itemId: updatedItem.id,
          label: updatedItem.label,
          checked: updatedItem.checked,
          isCustom: false,
          sectionId: section.id
        }).finally(() => setIsSavingChecklistItem(false));
        return updatedItem;
      })
    }));
    setChecklistSections(updated);
  };

  const allItemsChecked = checklistSections.every(s => s.items.every(i => i.checked));

  const checkedCount = checklistSections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0);
  const totalCount = checklistSections.reduce((acc, s) => acc + s.items.length, 0);

  const handleConfirmChecklist = async () => {
    if (!allItemsChecked) return;
    try {
      setIsConfirmingChecklist(true);
      // 1. Mark checklist as validated (no PDF)
      const validateRes = await validateContentChecklist(projectId);
      if (validateRes.status !== 'success') {
        toast.error(validateRes.message || 'Failed to validate checklist');
        return;
      }
      // 2. Submit content JSON + text
      await doSubmitContent();
      toast.success('Content saved & checklist validated!');
      setIsChecklistModalOpen(false);
      // Reload project data
      loadProject();
    } catch (error) {
      console.error('Error confirming checklist:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsConfirmingChecklist(false);
    }
  };

  const handleCompleteWorkflow = async () => {
    if (!window.confirm("Are you sure you want to mark the Content Department workflow as complete? This will finalize the phase and you won't be able to modify content anymore.")) return;

    try {
      setIsCompleting(true);
      const response = await completeContentWorkflow(projectId);
      if (response.status === 'success') {
        toast.success("Content Department workflow marked as complete!");
        setProject(response.data.project);
        // Refresh folders to show any new PDFs generated during workflow
        queryClient.invalidateQueries(['folders', projectId]);
      } else {
        toast.error(response.message || "Failed to complete workflow");
      }
    } catch (error) {
      console.error("Error completing content workflow:", error);
      toast.error("An error occurred during workflow completion");
    } finally {
      setIsCompleting(false);
    }
  };

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
    <>
      <div className="space-y-6">
        {/* Integration Department Restriction Message */}
        {userRole === 'd.in' && !project?.isContentReady && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center mb-6">
            <Icon icon="lucide:clock" className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-amber-900 mb-2">Waiting for Structured Content</h3>
            <p className="text-amber-700 max-w-md mx-auto">
              The Integration Department cannot proceed until the Content Department has uploaded the structured JSON and formatted text content.
            </p>
          </div>
        )}

        {/* Content Submission UI for Content Department */}
        {userRole === 'd.c' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <Icon icon="lucide:file-up" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-indigo-900">Structured Content Submission</h3>
                <p className="text-indigo-700 text-sm">Upload JSON and paste formatted text for integration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* JSON Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-indigo-900">
                  1. Upload JSON File
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center gap-2 ${project?.isContentReady || project?.contentStatus === 'completed' ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-75' : contentJson ? 'border-green-300 bg-green-50 cursor-pointer' : 'border-indigo-200 bg-white hover:border-indigo-400 cursor-pointer'}`}
                  onClick={() => !project?.isContentReady && project?.contentStatus !== 'completed' && document.getElementById('json-submission-upload')?.click()}
                >
                  <Icon
                    icon={contentJson ? "lucide:check-circle" : "lucide:upload-cloud"}
                    className={`w-8 h-8 ${contentJson ? 'text-green-600' : 'text-indigo-400'}`}
                  />
                  <span className={`text-xs font-medium ${project?.isContentReady || project?.contentStatus === 'completed' ? 'text-gray-500' : contentJson ? 'text-green-700' : 'text-indigo-600'}`}>
                    {project?.contentStatus === 'completed' ? 'Content Finalized' : project?.isContentReady ? 'Submission Locked' : contentJson ? 'JSON Validated & Ready' : 'Drop JSON file or click to upload'}
                  </span>
                  <input
                    id="json-submission-upload"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleJsonUpload}
                  />
                </div>
                {contentJson && (
                  <div className="space-y-2">
                    <div className="bg-white border border-green-200 rounded-lg p-2 max-h-32 overflow-y-auto">
                      <pre className="text-[10px] text-gray-600 font-mono">
                        {contentJson.substring(0, 300)}{contentJson.length > 300 ? '...' : ''}
                      </pre>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
                      Preview Full JSON Content
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-indigo-900">2. Text Content</span>
                    {isSavingDraft ? (
                      <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                        <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    ) : lastSaved && (
                      <span className="text-[10px] text-green-500 flex items-center gap-1">
                        <Icon icon="lucide:check" className="w-3 h-3" />
                        Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {contentText.trim() && (
                      <button
                        type="button"
                        onClick={() => setIsPreviewTextModalOpen(true)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                      >
                        <Icon icon="lucide:eye" className="w-3.5 h-3.5" />
                        Preview Text
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        if (project?.isContentReady || project?.contentStatus === 'completed') return;
                        e.preventDefault();
                        e.stopPropagation();
                        handleFormatText();
                      }}
                      className={`text-xs px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${project?.isContentReady || project?.contentStatus === 'completed' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                      disabled={!contentText.trim() || project?.isContentReady || project?.contentStatus === 'completed'}
                    >
                      <Icon icon="lucide:wand-2" className="w-3 h-3" />
                      Auto-format
                    </button>
                  </div>
                </div>
                <textarea
                  value={contentText}
                  onChange={(e) => !project?.isContentReady && project?.contentStatus !== 'completed' && setContentText(e.target.value)}
                  readOnly={project?.isContentReady || project?.contentStatus === 'completed'}
                  placeholder={project?.contentStatus === 'completed' ? "Content workflow finalized." : project?.isContentReady ? "Content is locked." : "Paste your content here..."}
                  className={`w-full h-32 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all ${project?.isContentReady || project?.contentStatus === 'completed' ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-indigo-200'}`}
                />
                <p className="text-[10px] text-indigo-500 italic">
                  * High-quality formatting ensures faster integration.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-indigo-100 pt-6">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${project?.contentStatus === 'completed' ? 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.6)]' : project?.isContentReady ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  Status: <span className={project?.contentStatus === 'completed' ? 'text-green-700 font-bold' : project?.isContentReady ? 'text-green-700' : 'text-gray-500 font-bold'}>
                    {project?.contentStatus === 'completed' ? 'Workflow Completed ✅' : project?.isContentReady ? 'Content Submitted ✔' : 'Pending Submission'}
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmitContent}
                disabled={!contentJson || !contentText.trim() || project?.isContentReady || project?.contentStatus === 'completed'}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${!contentJson || !contentText.trim() || project?.isContentReady || project?.contentStatus === 'completed'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  }`}
              >
                {project?.contentStatus === 'completed' ? (
                  <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-green-500" />
                ) : project?.isContentReady ? (
                  <Icon icon="lucide:lock" className="w-4 h-4" />
                ) : (
                  <Icon icon="lucide:clipboard-check" className="w-4 h-4" />
                )}
                {project?.contentStatus === 'completed' ? 'Content Finalized' : project?.isContentReady ? 'Content Submitted' : 'Save Content'}
              </button>
            </div>

            {/* Workflow Completion Section */}
            <div className="mt-8 pt-6 border-t border-indigo-200">
              {project?.contentStatus === 'completed' ? (
                <div className="bg-green-600 rounded-xl p-4 flex items-center gap-4 text-white shadow-lg">
                  <div className="flex-1">
                    <h4 className="font-bold">All documents and content have been finalized.</h4>
                  </div>
                  <Icon icon="lucide:check-circle" className="w-8 h-8 opacity-50" />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-indigo-900">Final Milestone: Complete Phase</h4>
                    <p className="text-[11px] text-gray-500">
                      {project?.isContentReady
                        ? 'Content submitted. Click to mark the phase as complete.'
                        : 'Save content first to unlock this step.'}
                    </p>
                  </div>
                  <button
                    onClick={handleCompleteWorkflow}
                    disabled={!project?.isContentReady || isCompleting || project?.contentStatus === 'completed'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${project?.isContentReady && !isCompleting && project?.contentStatus !== 'completed'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                      }`}
                  >
                    {isCompleting ? (
                      <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon icon="lucide:target" className="w-4 h-4" />
                    )}
                    Mark Content Upload as Complete
                  </button>
                </div>
              )}
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

        {/* JSON Preview Modal */}
        {isPreviewModalOpen && contentJson && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-indigo-100">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                    <Icon icon="lucide:file-json" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-indigo-900">JSON Content Preview</h2>
                    <p className="text-sm text-indigo-600">Formatted and validated structured data</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="lucide:x" className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[#0f172a]">
                <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-2xl relative group min-h-full">
                  <div className="absolute top-4 left-4 flex gap-1.5 indicator">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contentJson);
                      toast.success('JSON copied to clipboard');
                    }}
                    className="absolute top-4 right-4 p-2 bg-slate-700 text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-600 hover:text-white"
                    title="Copy JSON"
                  >
                    <Icon icon="lucide:copy" className="w-4 h-4" />
                  </button>
                  <div className="p-10 pt-16">
                    <pre className="text-xs md:text-sm text-indigo-100 font-mono leading-relaxed whitespace-pre p-6 bg-[#0f172a] rounded-lg border border-slate-800 shadow-inner overflow-x-auto">
                      {contentJson}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="border-t p-4 flex justify-end bg-white">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  Done Previewing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text Preview Modal */}
        {isPreviewTextModalOpen && contentText && (
          <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-indigo-100">
              <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                    <Icon icon="lucide:file-text" className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-indigo-900">Text Content Preview</h2>
                    <p className="text-sm text-indigo-600">Final formatted text for the project</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewTextModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="lucide:x" className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="bg-white p-8 md:p-12 rounded-xl border border-gray-200 shadow-sm min-h-full">
                  <div className="prose prose-indigo max-w-none">
                    {contentText.split('\n\n').map((para, i) => (
                      <p key={i} className="text-gray-800 leading-relaxed mb-4 text-sm md:text-base">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t p-4 flex justify-end bg-white">
                <button
                  onClick={() => setIsPreviewTextModalOpen(false)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  Done Previewing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Checklist Validation Modal ──────────────────────────────────── */}
      {isChecklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-indigo-100">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-indigo-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
                  <Icon icon="lucide:clipboard-list" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">Content Checklist</h2>
                  <p className="text-sm text-indigo-600">Check all items to confirm before saving</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${allItemsChecked ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                  {checkedCount} / {totalCount}
                </span>
                <button
                  onClick={() => setIsChecklistModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="lucide:x" className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {isLoadingChecklist ? (
                <div className="flex justify-center items-center py-16">
                  <Icon icon="lucide:loader-2" className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : (
                checklistSections.map(section => {
                  const sectionChecked = section.items.filter(i => i.checked).length;
                  const sectionTotal = section.items.length;
                  const allSection = sectionChecked === sectionTotal;
                  return (
                    <div key={section.id} className={`border rounded-xl overflow-hidden transition-all ${allSection ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                      }`}>
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${allSection ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                        }`}>
                        <div className="flex items-center gap-2">
                          {allSection
                            ? <Icon icon="lucide:check-circle-2" className="w-4 h-4 text-green-600" />
                            : <Icon icon="lucide:circle" className="w-4 h-4 text-gray-400" />
                          }
                          <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
                        </div>
                        <span className="text-xs text-gray-500">{sectionChecked}/{sectionTotal}</span>
                      </div>
                      <div className="p-4 space-y-2">
                        {section.items.map(item => (
                          <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleChecklistItem(item.id)}
                              disabled={isSavingChecklistItem}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className={`text-sm select-none ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'
                              }`}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-5 flex items-center justify-between bg-white">
              <p className="text-xs text-gray-500">
                {allItemsChecked
                  ? '✅ All items checked — ready to confirm'
                  : `${totalCount - checkedCount} item${totalCount - checkedCount !== 1 ? 's' : ''} remaining`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsChecklistModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmChecklist}
                  disabled={!allItemsChecked || isConfirmingChecklist}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${allItemsChecked && !isConfirmingChecklist
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                >
                  {isConfirmingChecklist ? (
                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon icon="lucide:check-circle-2" className="w-4 h-4" />
                  )}
                  Confirm & Save Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FoldersTab;