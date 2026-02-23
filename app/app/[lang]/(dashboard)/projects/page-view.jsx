"use client";

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Icon } from "@iconify/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getProjects, archiveProject, getArchivedProjects, updateProject, restoreProject, deleteProject } from "@/config/functions/project"
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useSession } from 'next-auth/react';
import DesignChecklistModal from './[id]/DesignChecklistModal';

// Import Date Picker components
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Category styling with vibrant colors and icons
const CATEGORY_CONFIG = {
  'Web Development': {
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    text: 'text-blue-700',
    icon: 'lucide:code-2',
    border: 'border-blue-200'
  },
  'Mobile App Development': {
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    text: 'text-purple-700',
    icon: 'lucide:smartphone',
    border: 'border-purple-200'
  },
  'E-commerce Development': {
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    text: 'text-green-700',
    icon: 'lucide:shopping-cart',
    border: 'border-green-200'
  },
  'UI/UX Design': {
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-gradient-to-br from-pink-50 to-rose-50',
    text: 'text-pink-700',
    icon: 'lucide:palette',
    border: 'border-pink-200'
  },
  'Digital Marketing': {
    color: 'from-orange-500 to-amber-500',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    text: 'text-orange-700',
    icon: 'lucide:megaphone',
    border: 'border-orange-200'
  },
  'SEO Services': {
    color: 'from-teal-500 to-cyan-500',
    bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    text: 'text-teal-700',
    icon: 'lucide:trending-up',
    border: 'border-teal-200'
  },
  'Social Media Marketing': {
    color: 'from-red-500 to-pink-500',
    bg: 'bg-gradient-to-br from-red-50 to-pink-50',
    text: 'text-red-700',
    icon: 'lucide:share-2',
    border: 'border-red-200'
  },
  'Branding': {
    color: 'from-yellow-500 to-orange-500',
    bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    text: 'text-yellow-700',
    icon: 'lucide:sparkles',
    border: 'border-yellow-200'
  },
  'Content Creation': {
    color: 'from-indigo-500 to-purple-500',
    bg: 'bg-gradient-to-br from-indigo-50 to-purple-50',
    text: 'text-indigo-700',
    icon: 'lucide:pen-tool',
    border: 'border-indigo-200'
  },
  'Video Production': {
    color: 'from-cyan-500 to-blue-500',
    bg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
    text: 'text-cyan-700',
    icon: 'lucide:video',
    border: 'border-cyan-200'
  },
  'Custom Software': {
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
    text: 'text-violet-700',
    icon: 'lucide:cpu',
    border: 'border-violet-200'
  },
  'Cyber Security': {
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    text: 'text-amber-700',
    icon: 'lucide:shield-check',
    border: 'border-amber-200'
  },
  'IT Consulting': {
    color: 'from-lime-500 to-green-500',
    bg: 'bg-gradient-to-br from-lime-50 to-green-50',
    text: 'text-lime-700',
    icon: 'lucide:lightbulb',
    border: 'border-lime-200'
  },
  'Other': {
    color: 'from-gray-500 to-slate-500',
    bg: 'bg-gradient-to-br from-gray-50 to-slate-50',
    text: 'text-gray-700',
    icon: 'lucide:folder',
    border: 'border-gray-200'
  }
};

const STATUS_MAP = {
  'planning': 'Planning',
  'active': 'Active',
  'on-hold': 'On Hold',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
  'archived': 'Archived'
};

const PRIORITY_MAP = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
  'standard': 'Standard'
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'completed': return 'primary'
    case 'planning': return 'secondary'
    case 'cancelled': return 'destructive'
    case 'on-hold': return 'warning'
    case 'archived': return 'default'
    default: return 'default'
  }
};

const getProjectPhase = (project) => {
  // Logic based on workflow status
  if (project.infoStatus !== 'completed') {
    return { label: "Waiting for Content", color: "text-amber-600 bg-amber-50 border-amber-200" };
  }
  if (project.itStatus === 'pending') {
    return { label: "Ready for IT Setup", color: "text-blue-600 bg-blue-50 border-blue-200" };
  }
  if (project.itStatus === 'setup_validated' && project.contentStatus === 'pending') {
    return { label: "Ready for Content Validation", color: "text-purple-600 bg-purple-50 border-purple-200" };
  }
  if (project.itStatus === 'setup_validated' && project.contentStatus === 'checklist_validated') {
    return { label: "Ready for Content Submission", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
  }
  if (project.itStatus === 'setup_validated' && project.contentStatus === 'completed') {
    return { label: "Ready for Integration", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
  }
  if (project.itStatus === 'integration_completed') {
    return { label: "Integration Done", color: "text-green-600 bg-green-50 border-green-200" };
  }
  return { label: "Active Phase", color: "text-slate-600 bg-slate-50 border-slate-200" };
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'critical': return 'destructive'
    case 'high': return 'warning'
    case 'medium': return 'info'
    case 'standard': return 'secondary'
    case 'low': return 'success'
    default: return 'default'
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
};

const formatDateTime = (date) => {
  if (!date) return 'Select date & time';
  return format(date, "PPP 'at' hh:mm a");
};

const formatCurrency = (amount, currency = 'MAD') => {
  if (!amount) return `0 ${currency}`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'EUR' ? 'EUR' : 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('MAD', 'MAD ');
};

const CategoryBadge = ({ category }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'];

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm",
      config.bg, config.border,
      "dark:bg-slate-900/60 dark:border-white/10 dark:hover:border-white/20"
    )}>
      <Icon icon={config.icon} className={cn("w-4 h-4", config.text, "dark:brightness-110")} />
      <span className={cn("text-xs font-semibold", config.text, "dark:brightness-110")}>
        {category}
      </span>
    </div>
  );
};

// Generate hours (1-12)
const hours = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1;
  return hour.toString().padStart(2, '0');
});

// Generate minutes (00, 15, 30, 45)
const minutes = ['00', '15', '30', '45'];

// ProjectCalendar component for individual project rows
const ProjectCalendar = ({ project, onDateSave }) => {
  const [selectedDate, setSelectedDate] = useState(project.endDate ? new Date(project.endDate) : undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  // Initialize time from existing date
  useEffect(() => {
    if (selectedDate) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();

      // Convert to 12-hour format
      let displayHour = hour % 12;
      if (displayHour === 0) displayHour = 12;
      setSelectedHour(displayHour.toString().padStart(2, '0'));

      setSelectedMinute(minute.toString().padStart(2, '0'));
      setSelectedPeriod(hour >= 12 ? 'PM' : 'AM');
    }
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSelect = async () => {
    if (!selectedDate) {
      toast.error('Please select a date first');
      return;
    }

    // Create a new date with selected time
    const newDate = new Date(selectedDate);
    let hour = parseInt(selectedHour);

    // Convert to 24-hour format
    if (selectedPeriod === 'PM' && hour < 12) {
      hour += 12;
    } else if (selectedPeriod === 'AM' && hour === 12) {
      hour = 0;
    }

    newDate.setHours(hour, parseInt(selectedMinute), 0, 0);
    setSelectedDate(newDate);

    // Call the save function
    if (onDateSave) {
      await onDateSave(project._id, newDate);
    }

    setShowCalendar(false);
    toast.success(`Date & time updated: ${formatDateTime(newDate)}`);
  };

  const handleClearDate = async () => {
    setSelectedDate(undefined);

    // Call the save function with null to clear the date
    if (onDateSave) {
      await onDateSave(project._id, null);
    }

    toast.info('Date cleared');
  };

  return (
    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal gap-2 text-sm border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800",
            !selectedDate && "text-slate-500"
          )}
          size="sm"
        >
          <Icon icon="lucide:calendar" className="w-4 h-4" />
          {selectedDate ? formatDateTime(selectedDate) : "Set date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md border"
          />

          {selectedDate && (
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-3">
                <div className="text-sm font-medium">Select Time:</div>
                <div className="flex items-center gap-2">
                  <Select value={selectedHour} onValueChange={setSelectedHour}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-slate-500">:</span>

                  <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearDate}
                    className="flex-1"
                  >
                    <Icon icon="lucide:x" className="w-3 h-3 mr-2" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleTimeSelect}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Icon icon="lucide:check" className="w-3 h-3 mr-2" />
                    Set Time
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ProjectsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    console.log("session?.user?.role ==> ", session?.user?.role);
  }, [session]);

  const [activeTab, setActiveTab] = useState('active');
  const [activeProjects, setActiveProjects] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Filters for active projects
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    category: '',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Filters for archived projects
  const [archivedFilters, setArchivedFilters] = useState({
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'archivedAt',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState('');

  // Archive confirmation states
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState(null);
  const [projectToArchiveTitle, setProjectToArchiveTitle] = useState('');
  const [projectToArchiveClient, setProjectToArchiveClient] = useState('');
  const [projectToArchiveBudget, setProjectToArchiveBudget] = useState('');

  // Restore confirmation states
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [projectToRestore, setProjectToRestore] = useState(null);
  const [projectToRestoreTitle, setProjectToRestoreTitle] = useState('');
  const [projectToRestoreClient, setProjectToRestoreClient] = useState('');

  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToDeleteTitle, setProjectToDeleteTitle] = useState('');
  const [projectToDeleteClient, setProjectToDeleteClient] = useState('');
  const [projectToDeleteBudget, setProjectToDeleteBudget] = useState('');

  // Design Modal State
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [selectedProjectForDesign, setSelectedProjectForDesign] = useState(null);

  const [countdown, setCountdown] = useState(5);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null);

  // Handle saving date for a project
  const handleSaveProjectDate = async (projectId, date) => {
    try {
      const response = await updateProject(projectId, {
        endDate: date ? date.toISOString() : null
      });

      if (response && response.status === 'success') {
        // Update the project in the appropriate list
        if (activeTab === 'active') {
          setActiveProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === projectId
                ? { ...project, endDate: date ? date.toISOString() : null }
                : project
            )
          );
        } else {
          setArchivedProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === projectId
                ? { ...project, endDate: date ? date.toISOString() : null }
                : project
            )
          );
        }
      } else {
        const errorMessage = response?.message || 'Failed to update date';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving date:', error);
      toast.error('An error occurred while saving the date');
    }
  };

  // Fetch projects based on active tab
  useEffect(() => {
    fetchActiveProjects();
    fetchArchivedProjects();
  }, [activeTab, activeFilters, archivedFilters]);

  const fetchActiveProjects = async () => {
    setLoading(true);
    try {
      const response = await getProjects(activeFilters);

      if (response && response.status === 'success' && response.data && response.data.projects) {
        setActiveProjects(response.data.projects);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.projects.length
        });
      } else {
        console.warn('API response structure unexpected or empty');
        setActiveProjects([]);
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalItems: 0
        });
      }
    } catch (error) {
      console.error('Error fetching active projects:', error);
      toast.error('Failed to fetch projects');
      setActiveProjects([]);
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedProjects = async () => {
    setLoading(true);
    try {
      const response = await getArchivedProjects(archivedFilters);

      if (response && response.status === 'success' && response.data && response.data.projects) {
        setArchivedProjects(response.data.projects);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.data.projects.length
        });
      } else {
        console.warn('API response structure unexpected or empty');
        setArchivedProjects([]);
        setPagination({
          currentPage: 1,
          totalPages: 0,
          totalItems: 0
        });
      }
    } catch (error) {
      console.error('Error fetching archived projects:', error);
      toast.error('Failed to fetch archived projects');
      setArchivedProjects([]);
      setPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActiveFilterChange = (key, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleArchivedFilterChange = (key, value) => {
    setArchivedFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleActivePageChange = (page) => {
    setActiveFilters(prev => ({ ...prev, page }));
  };

  const handleArchivedPageChange = (page) => {
    setArchivedFilters(prev => ({ ...prev, page }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    if (activeTab === 'active') {
      handleActiveFilterChange('search', value);
    } else {
      handleArchivedFilterChange('search', value);
    }
  };

  const handleOpenNoteDialog = (projectId, projectTitle, currentNote = '') => {
    setCurrentProjectId(projectId);
    setCurrentProjectTitle(projectTitle);
    setCurrentNote(currentNote || '');
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }

    try {
      const response = await updateProject(currentProjectId, {
        note: currentNote
      });

      if (response && response.status === 'success') {
        if (activeTab === 'active') {
          setActiveProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === currentProjectId
                ? { ...project, note: currentNote }
                : project
            )
          );
        } else {
          setArchivedProjects(prevProjects =>
            prevProjects.map(project =>
              project._id === currentProjectId
                ? { ...project, note: currentNote }
                : project
            )
          );
        }

        setNoteDialogOpen(false);
        setCurrentProjectId(null);
        setCurrentNote('');
        setCurrentProjectTitle('');
        toast.success('Note saved successfully');
      } else {
        const errorMessage = response?.message || 'Failed to save note';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('An error occurred while saving the note');
    }
  };

  // Open archive confirmation dialog
  const handleOpenArchiveDialog = (project) => {
    setProjectToArchive(project._id);
    setProjectToArchiveTitle(project.title);
    setProjectToArchiveClient(project.client?.name || 'Unknown Client');
    setProjectToArchiveBudget(formatCurrency(project.budget, project.currency));
    setArchiveDialogOpen(true);
  };

  // Open restore confirmation dialog
  const handleOpenRestoreDialog = (project) => {
    setProjectToRestore(project._id);
    setProjectToRestoreTitle(project.title);
    setProjectToRestoreClient(project.client?.name || 'Unknown Client');
    setRestoreDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (project) => {
    setProjectToDelete(project._id);
    setProjectToDeleteTitle(project.title);
    setProjectToDeleteClient(project.client?.name || 'Unknown Client');
    setProjectToDeleteBudget(formatCurrency(project.budget, project.currency));
    setCountdown(5);
    setCountdownActive(false);
    setDeleteDialogOpen(true);
  };

  // Start countdown for delete confirmation
  const startDeleteCountdown = () => {
    if (countdownActive) return;

    setCountdownActive(true);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownActive(false);
          // Automatically trigger delete when countdown reaches 0
          executeDeleteProject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownInterval(interval);
  };

  // Stop countdown
  const stopDeleteCountdown = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      setCountdownInterval(null);
    }
    setCountdownActive(false);
    setCountdown(5);
  };

  // Handle project archiving
  const handleArchiveProject = async () => {
    if (!projectToArchive) return;

    setDeleteLoading(true);
    try {
      const response = await archiveProject(projectToArchive);

      if (response && response.status === 'success') {
        // Remove project from active list
        setActiveProjects(prevProjects =>
          prevProjects.filter(project => project._id !== projectToArchive)
        );

        // Update pagination count
        setPagination(prev => ({
          ...prev,
          totalItems: prev.totalItems - 1
        }));

        toast.success('Project archived successfully');
      } else {
        const errorMessage = response?.message || 'Failed to archive project';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('An error occurred while archiving the project');
    } finally {
      setDeleteLoading(false);
      setArchiveDialogOpen(false);
      setProjectToArchive(null);
      setProjectToArchiveTitle('');
      setProjectToArchiveClient('');
      setProjectToArchiveBudget('');
    }
  };

  // Handle project restoration
  const handleRestoreProject = async () => {
    if (!projectToRestore) return;

    setRestoreLoading(true);
    try {
      const response = await restoreProject(projectToRestore, { status: 'planning' });

      if (response && response.status === 'success') {
        setArchivedProjects(prevProjects =>
          prevProjects.filter(project => project._id !== projectToRestore)
        );

        setPagination(prev => ({
          ...prev,
          totalItems: prev.totalItems - 1
        }));

        toast.success('Project restored successfully');
      } else {
        const errorMessage = response?.message || 'Failed to restore project';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error restoring project:', error);
      toast.error('An error occurred while restoring the project');
    } finally {
      setRestoreLoading(false);
      setRestoreDialogOpen(false);
      setProjectToRestore(null);
      setProjectToRestoreTitle('');
      setProjectToRestoreClient('');
    }
  };

  // Execute project deletion
  const executeDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await deleteProject(projectToDelete);

      if (response && response.status === 'success') {
        // Remove project from appropriate list based on active tab
        if (activeTab === 'active') {
          setActiveProjects(prevProjects =>
            prevProjects.filter(project => project._id !== projectToDelete)
          );
        } else {
          setArchivedProjects(prevProjects =>
            prevProjects.filter(project => project._id !== projectToDelete)
          );
        }

        // Update pagination count
        setPagination(prev => ({
          ...prev,
          totalItems: prev.totalItems - 1
        }));

        toast.success('Project deleted permanently');
      } else {
        const errorMessage = response?.message || 'Failed to delete project';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting the project');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      stopDeleteCountdown();
      setProjectToDelete(null);
      setProjectToDeleteTitle('');
      setProjectToDeleteClient('');
      setProjectToDeleteBudget('');
    }
  };

  // Handle delete project
  const handleDeleteProject = () => {
    if (!countdownActive) {
      startDeleteCountdown();
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // Get current projects based on active tab
  const rawProjects = activeTab === 'active' ? activeProjects : archivedProjects;
  const currentProjects = rawProjects.filter(project => {
    if (session?.user?.role !== 'd.it') return true;

    // For IT role, hide projects that are in intermediate content phases
    // (IT setup is done, but content department hasn't finished submission)
    const isSetupValidated = project.itStatus === 'setup_validated';
    const isContentInProgress = project.contentStatus === 'pending' || project.contentStatus === 'checklist_validated';

    if (isSetupValidated && isContentInProgress) return false;

    return true;
  });
  const currentFilters = activeTab === 'active' ? activeFilters : archivedFilters;
  const uniqueCategories = [...new Set(currentProjects.map(project => project.category).filter(Boolean))];
  const uniqueStatuses = [...new Set(currentProjects.map(project => project.status).filter(Boolean))];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentNote ? 'Edit Note' : 'Add Note'} - {currentProjectTitle}
            </DialogTitle>
            <DialogDescription>
              Add notes, reminders, or important details about this project
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Enter your note here..."
              className="min-h-[200px] resize-y text-sm"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveNote} className="gap-2">
              <Icon icon="heroicons:check" className="w-4 h-4" />
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent className="max-w-md border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
                <Icon icon="lucide:archive" className="w-8 h-8 text-white" />
              </div>

              <AlertDialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                Archive Project?
              </AlertDialogTitle>

              <AlertDialogDescription className="text-slate-600">
                This project will be moved to the archive. You can restore it anytime.
              </AlertDialogDescription>
            </div>

            {/* Project Details Card */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                    <Icon icon="lucide:folder" className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{projectToArchiveTitle}</h4>
                    <p className="text-sm text-slate-600">Project</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                    <p className="text-xs text-slate-500 mb-1">Client</p>
                    <p className="font-medium text-slate-900">{projectToArchiveClient}</p>
                  </div>

                  <div className="bg-white/50 p-3 rounded-lg border border-red-100">
                    <p className="text-xs text-slate-500 mb-1">Budget</p>
                    <p className="font-medium text-slate-900">{projectToArchiveBudget}</p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel
              disabled={deleteLoading}
              className="w-full sm:w-auto order-2 sm:order-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveProject}
              disabled={deleteLoading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {deleteLoading ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Icon icon="lucide:archive" className="w-4 h-4 mr-2" />
                  Archive Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="max-w-md border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg">
                <Icon icon="lucide:rotate-ccw" className="w-8 h-8 text-white" />
              </div>

              <AlertDialogTitle className="text-2xl font-bold text-slate-900 mb-2">
                Restore Project?
              </AlertDialogTitle>

              <AlertDialogDescription className="text-slate-600">
                This project will be restored and moved back to active projects.
              </AlertDialogDescription>
            </div>

            {/* Project Details Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <Icon icon="lucide:folder" className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{projectToRestoreTitle}</h4>
                    <p className="text-sm text-slate-600">Archived Project</p>
                  </div>
                </div>

                <div className="bg-white/50 p-3 rounded-lg border border-green-100">
                  <p className="text-xs text-slate-500 mb-1">Client</p>
                  <p className="font-medium text-slate-900">{projectToRestoreClient}</p>
                </div>
              </div>
            </div>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel
              disabled={restoreLoading}
              className="w-full sm:w-auto order-2 sm:order-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
            >
              <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreProject}
              disabled={restoreLoading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {restoreLoading ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Icon icon="lucide:rotate-ccw" className="w-4 h-4 mr-2" />
                  Restore Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog with Countdown */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          stopDeleteCountdown();
        }
        setDeleteDialogOpen(open);
      }}>
        <AlertDialogContent className="max-w-md border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mb-4 shadow-lg animate-pulse">
                <Icon icon="lucide:trash-2" className="w-10 h-10 text-white" />
              </div>

              <AlertDialogTitle className="text-2xl font-bold text-red-700 mb-2">
                ⚠️ DELETE PROJECT PERMANENTLY
              </AlertDialogTitle>

              <AlertDialogDescription className="text-red-600 font-semibold text-base">
                This action cannot be undone!
              </AlertDialogDescription>
            </div>

            {/* Warning Message */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:alert-triangle" className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800 mb-2">You are about to permanently delete:</p>
                  <ul className="text-sm text-red-700 space-y-1 ml-2">
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:file" className="w-4 h-4" />
                      <span className="font-semibold">{projectToDeleteTitle}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:user" className="w-4 h-4" />
                      Client: {projectToDeleteClient}
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon="lucide:dollar-sign" className="w-4 h-4" />
                      Budget: {projectToDeleteBudget}
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consequences */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800 mb-2">This will permanently delete:</p>
              <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
                <li>All project data and files</li>
                <li>All client communications</li>
                <li>All financial records</li>
                <li>All tasks and milestones</li>
                <li><span className="font-bold">This action cannot be reversed!</span></li>
              </ul>
            </div>

            {/* Countdown Timer */}
            {countdownActive && (
              <div className="bg-gradient-to-r from-red-100 to-orange-100 border border-red-300 rounded-xl p-4 mb-6 text-center">
                <div className="text-lg font-bold text-red-700 mb-2">
                  Deleting in {countdown} second{countdown !== 1 ? 's' : ''}
                </div>
                <div className="w-full bg-red-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-800 h-3 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  Click "Cancel" to stop the deletion
                </p>
              </div>
            )}
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel
              onClick={stopDeleteCountdown}
              disabled={deleteLoading}
              className="w-full sm:w-auto order-2 sm:order-1 border-slate-300 hover:bg-slate-100"
            >
              <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleteLoading || countdownActive}
              className={`w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r ${countdownActive ? 'from-gray-600 to-gray-700' : 'from-red-700 to-red-900'} text-white shadow-lg hover:shadow-xl transition-all duration-200`}
            >
              {deleteLoading ? (
                <>
                  <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : countdownActive ? (
                <>
                  <Icon icon="lucide:clock" className="w-4 h-4 mr-2" />
                  Countdown Active ({countdown}s)
                </>
              ) : (
                <>
                  <Icon icon="lucide:trash-2" className="w-4 h-4 mr-2" />
                  Confirm Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2">
            Projects
          </h1>
          <p className="text-slate-600">Manage and track all agency projects in one place</p>
        </div>

        <div className="flex items-center gap-3">
          {["superadmin", "d.s"].includes(session?.user?.role) && (
            <Button
              className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              onClick={() => router.push('/projects/new')}
            >
              <Icon icon="heroicons:plus" className="w-4 h-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Active/Archived Projects */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm"
          >
            <Icon icon="lucide:folder-open" className="w-4 h-4 mr-2" />
            Active Projects
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeProjects.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm"
          >
            <Icon icon="lucide:archive" className="w-4 h-4 mr-2" />
            Archived Projects
            <span className="ml-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {archivedProjects.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {/* Filters for Active Projects */}
          <Card className="mb-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="Search active projects..."
                    value={activeFilters.search}
                    onChange={handleSearch}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {/* Filters for Archived Projects */}
          <Card className="mb-6 border-slate-200 dark:border-slate-700 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Search archived projects..."
                    value={archivedFilters.search}
                    onChange={handleSearch}
                    className="border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <Select
                    value={archivedFilters.sortBy}
                    onValueChange={(value) => handleArchivedFilterChange('sortBy', value)}
                  >
                    <SelectTrigger className="border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="archivedAt">Date Archived</SelectItem>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="endDate">End Date</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-slate-200 dark:border-slate-700 hover:bg-white"
                    onClick={() => {
                      handleArchivedFilterChange('sortOrder', archivedFilters.sortOrder === 'desc' ? 'asc' : 'desc')
                    }}
                  >
                    <Icon
                      icon={archivedFilters.sortOrder === 'desc' ? 'lucide:arrow-down' : 'lucide:arrow-up'}
                      className="w-4 h-4"
                    />
                    {archivedFilters.sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Projects Table */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : currentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Icon
                icon={activeTab === 'active' ? "lucide:folder-open" : "lucide:archive"}
                className="w-16 h-16 text-slate-300 mb-4"
              />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                {activeTab === 'active' ? 'No active projects found' : 'No archived projects found'}
              </h3>
              <p className="text-slate-500 mb-4">
                {activeTab === 'active'
                  ? 'Get started by creating your first project'
                  : 'Archived projects will appear here'}
              </p>
              {activeTab === 'active' && (["superadmin", "d.s"].includes(session?.user?.role)) && (
                <Button
                  onClick={() => router.push('/projects/new')}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <Icon icon="heroicons:plus" className="w-4 h-4" />
                  Create New Project
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-white/5">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Project</th>
                      {session?.user?.role === "d.it" && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phase</th>
                      )}
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Category</th>
                      {session?.user?.role === "d.s" && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      )}
                      {session?.user?.role === "d.i" && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Info Status</th>
                      )}
                      {session?.user?.role === "d.c" && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Content Status</th>
                      )}
                      {(session?.user?.role === "d.d" || session?.user?.role === "superadmin") && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Design Status</th>
                      )}
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Budget</th>
                      <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {activeTab === 'active' ? 'Due Date' : 'Archived Date'}
                      </th>

                      {["superadmin"].includes(session?.user?.role) && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Notes
                        </th>
                      )}

                      {["superadmin", "d.i", "d.c", "d.d", "d.it", "d.in"].includes(session?.user?.role) && (
                        <th className="text-left py-4 px-6 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      )}

                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900/40 divide-y divide-slate-100 dark:divide-white/5">
                    {currentProjects.map((project) => (
                      <tr
                        key={project._id}
                        className={cn(
                          "transition-all duration-300 group border-b border-slate-100 dark:border-white/5",
                          "hover:bg-slate-50 dark:hover:bg-white/[0.02]",
                          activeTab === 'archived' && "opacity-80 hover:opacity-100"
                        )}
                      >
                        <td className="py-5 px-6">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                            {project.title}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                            {project.description?.substring(0, 100)}{project.description?.length > 100 ? '...' : ''}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {project.tags?.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                            {project.tags?.length > 3 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-500">
                                +{project.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>

                        {session?.user?.role === "d.it" && (
                          <td className="py-5 px-6">
                            <div className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                              getProjectPhase(project).color
                            )}>
                              {getProjectPhase(project).label}
                            </div>
                          </td>
                        )}

                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/20">
                              {project.client?.name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-200">
                                {project.client?.name || 'N/A'}
                              </div>
                              {project.client?.contactPerson?.name && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-500 font-medium">
                                  {project.client.contactPerson.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-5 px-6">
                          <CategoryBadge category={project.category} />
                        </td>

                        {session?.user?.role === "d.s" && (
                          <td className="py-5 px-6">
                            {project.completedDepartments?.includes("sales") ? (
                              <Badge color="success" variant="soft" className="dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:check-circle" className="w-3 h-3" />
                                  Completed
                                </span>
                              </Badge>
                            ) : (
                              <Badge color="destructive" variant="soft" className="dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:x-circle" className="w-3 h-3" />
                                  Pending
                                </span>
                              </Badge>
                            )}
                          </td>
                        )}

                        {session?.user?.role === "d.i" && (
                          <td className="py-5 px-6">
                            {project.infoStatus === 'completed' ? (
                              <Badge color="success" variant="soft" className="dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:check-circle" className="w-3 h-3" />
                                  Completed
                                </span>
                              </Badge>
                            ) : (
                              <Badge color="warning" variant="soft" className="dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:clock" className="w-3 h-3" />
                                  Pending
                                </span>
                              </Badge>
                            )}
                          </td>
                        )}

                        {session?.user?.role === "d.c" && (
                          <td className="py-5 px-6">
                            {project.contentStatus === 'completed' ? (
                              <Badge color="success" variant="soft" className="dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:check-circle" className="w-3 h-3" />
                                  Completed
                                </span>
                              </Badge>
                            ) : project.contentStatus === 'checklist_validated' ? (
                              <Badge color="warning" variant="soft" className="dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:list-checks" className="w-3 h-3" />
                                  Checklist Done
                                </span>
                              </Badge>
                            ) : (
                              <Badge color="warning" variant="soft" className="dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:clock" className="w-3 h-3" />
                                  Pending
                                </span>
                              </Badge>
                            )}
                          </td>
                        )}

                        {(session?.user?.role === "d.d" || session?.user?.role === "superadmin") && (
                          <td className="py-5 px-6">
                            {project.designStatus === 'completed' ? (
                              <Badge color="success" variant="soft" className="dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
                                <span className="inline-flex items-center gap-1">
                                  <Icon icon="lucide:check-circle" className="w-3 h-3" />
                                  Completed
                                </span>
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 text-[10px] font-bold uppercase tracking-wider border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800"
                                onClick={() => {
                                  setSelectedProjectForDesign(project);
                                  setIsDesignModalOpen(true);
                                }}
                              >
                                <Icon icon="lucide:palette" className="w-3 h-3" />
                                Confirm Work
                              </Button>
                            )}
                          </td>
                        )}

                        <td className="py-5 px-6">
                          <Badge
                            color={getPriorityColor(project.priority)}
                            variant="outline"
                            size="sm"
                            className="dark:bg-slate-900/40 dark:border-white/10 dark:text-slate-300 font-bold uppercase text-[10px] tracking-widest"
                          >
                            {PRIORITY_MAP[project.priority] || project.priority}
                          </Badge>
                        </td>

                        <td className="py-5 px-6">
                          <div className="text-sm font-black text-slate-900 dark:text-blue-400 tracking-tight">
                            {formatCurrency(project.budget, project.currency)}
                          </div>
                        </td>

                        <td className="py-5 px-6">
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {activeTab === 'active'
                                ? formatDate(project.endDate)
                                : formatDate(project.archivedAt || project.updatedAt)
                              }
                            </div>
                            {activeTab === 'active' && ["superadmin", "d.s"].includes(session?.user?.role) && (
                              <ProjectCalendar
                                project={project}
                                onDateSave={handleSaveProjectDate}
                              />
                            )}
                            {activeTab === 'active' && project.endDate && new Date(project.endDate) < new Date() && project.status !== 'completed' && (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-tighter mt-1">
                                <Icon icon="lucide:alert-circle" className="w-3 h-3" />
                                Overdue
                              </div>
                            )}
                          </div>
                        </td>

                        {["superadmin"].includes(session?.user?.role) && (
                          <td className="py-5 px-6">
                            {project.note ? (
                              <div
                                className="flex items-center gap-2 cursor-pointer group/note"
                                onClick={() => handleOpenNoteDialog(project._id, project.title, project.note)}
                              >
                                <Icon icon="lucide:sticky-note" className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[120px] group-hover/note:text-slate-900 dark:group-hover/note:text-slate-200">
                                  {project.note}
                                </span>
                              </div>
                            ) : (
                              <button
                                className="flex items-center gap-2 text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                onClick={() => handleOpenNoteDialog(project._id, project.title)}
                              >
                                <Icon icon="lucide:plus-circle" className="w-4 h-4" />
                                <span className="text-xs font-bold">Add note</span>
                              </button>
                            )}
                          </td>
                        )}


                        {["superadmin", "d.i", "d.c", "d.d", "d.it", "d.in"].includes(session?.user?.role) && (
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-1">
                              {activeTab === 'active' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                    onClick={() => router.push(`/projects/${project._id}`)}
                                    title="View Project"
                                  >
                                    <Icon icon="lucide:eye" className="w-4 h-4" />
                                  </Button>
                                  {["superadmin"].includes(session?.user?.role) && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                                        onClick={() => handleOpenArchiveDialog(project)}
                                        title="Archive Project"
                                      >
                                        <Icon icon="lucide:archive" className="w-4 h-4" />
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                        onClick={() => handleOpenDeleteDialog(project)}
                                        title="Delete Permanently"
                                      >
                                        <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                    onClick={() => router.push(`/projects/${project._id}/overview`)}
                                    title="View Project"
                                  >
                                    <Icon icon="lucide:eye" className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-500/10 dark:hover:text-green-400"
                                    onClick={() => handleOpenRestoreDialog(project)}
                                    title="Restore Project"
                                  >
                                    <Icon icon="lucide:rotate-ccw" className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                    onClick={() => handleOpenDeleteDialog(project)}
                                    title="Delete Permanently"
                                  >
                                    <Icon icon="lucide:trash-2" className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <div className="text-sm text-slate-600">
                    Showing {(currentFilters.page - 1) * currentFilters.limit + 1} to{' '}
                    {Math.min(currentFilters.page * currentFilters.limit, pagination.totalItems)} of{' '}
                    {pagination.totalItems} projects
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => activeTab === 'active' ? handleActivePageChange(currentFilters.page - 1) : handleArchivedPageChange(currentFilters.page - 1)}
                      disabled={currentFilters.page === 1}
                      className="border-slate-200 dark:border-slate-700"
                    >
                      <Icon icon="heroicons:chevron-left" className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => activeTab === 'active' ? handleActivePageChange(currentFilters.page + 1) : handleArchivedPageChange(currentFilters.page + 1)}
                      disabled={currentFilters.page === pagination.totalPages}
                      className="border-slate-200 dark:border-slate-700"
                    >
                      Next
                      <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <DesignChecklistModal
        isOpen={isDesignModalOpen}
        onClose={() => setIsDesignModalOpen(false)}
        onSuccess={fetchActiveProjects}
        projectId={selectedProjectForDesign?._id}
        projectTitle={selectedProjectForDesign?.title}
      />
    </div>
  )
}

export default ProjectsPage