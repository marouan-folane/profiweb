import React, { useState, useEffect } from 'react';
import {
  getSiteAccess,
  createOrUpdateSiteAccess
} from '@/config/functions/access';
import {
  getProjectChecklist,
  createOrUpdateItem,
} from '@/config/functions/checklist';
import { getProject } from '@/config/functions/project';
import { validateITSetupChecklist } from '@/config/functions/project';
import { toast } from "sonner";
import { useSession } from 'next-auth/react';
import { Icon } from '@iconify/react';

// ── IT Department Technical Setup Checklist (same as CheckboxesTab) ──
const technicalSetupSections = [
  {
    id: 'input_verification',
    title: "Input Verification",
    items: [
      { id: 'validated_form', label: 'Validated global information form received', checked: false },
      { id: 'template_confirmed', label: 'Selected website template confirmed', checked: false },
      { id: 'domain_reviewed', label: 'Domain information reviewed', checked: false },
      { id: 'hosting_reviewed', label: 'Hosting information reviewed', checked: false },
    ]
  },
  {
    id: 'domain_hosting',
    title: "Domain & Hosting Setup",
    items: [
      { id: 'hosting_access', label: 'Hosting access received and tested', checked: false },
      { id: 'domain_connected', label: 'Domain connected to hosting (if applicable)', checked: false },
    ]
  },
  {
    id: 'template_cms',
    title: "Template & CMS Setup",
    items: [
      { id: 'cms_installed', label: 'CMS installed', checked: false },
      { id: 'stack_installed', label: 'Correct stack installed (matches chosen template)', checked: false },
    ]
  },
  {
    id: 'technical_checks',
    title: "Technical Checks",
    items: [
      { id: 'website_loads', label: 'Website loads correctly', checked: false },
      { id: 'pages_work', label: 'Pages and template structure work properly', checked: false },
      { id: 'no_errors', label: 'No technical errors detected', checked: false },
      { id: 'cache_checked', label: 'Cache checked and issues resolved (if any)', checked: false },
      { id: 'plugins_disabled', label: 'Conflicting or unnecessary plugins disabled', checked: false },
    ]
  },
  {
    id: 'access_management',
    title: "Access Management",
    items: [
      { id: 'access_integration', label: 'Back-office access created for Integration Department', checked: false },
      { id: 'access_design', label: 'Back-office access created for Design Department', checked: false },
      { id: 'access_tested', label: 'All accesses tested and confirmed working', checked: false },
    ]
  },
  {
    id: 'handoff',
    title: "Handoff",
    items: [
      { id: 'technically_ready', label: 'Website technically ready for integration', checked: false },
      { id: 'credentials_integration', label: 'Access credentials delivered to Integration Department', checked: false },
      { id: 'credentials_design', label: 'Access credentials delivered to Design Department', checked: false },
    ]
  }
];

// ── Integration Department checklist sections (Shared with FoldersTab) ──
const integrationChecklistSections = [
  {
    id: 'integration_validation',
    title: "Integration Validation",
    items: [
      { id: 'json_integrated', label: 'Structured content correctly integrated', checked: false },
      { id: 'design_match', label: 'Design matches template and requirements', checked: false },
      { id: 'interactivity', label: 'Interactive elements tested (forms, buttons)', checked: false },
      { id: 'mobile_responsive', label: 'Mobile responsiveness verified', checked: false },
      { id: 'seo_final', label: 'Final SEO checks completed', checked: false },
    ]
  }
];

const AccessesTab = ({ projectId }) => {
  const { data: session } = useSession();
  const userRole = session?.user?.role; // Get the user's role

  // Check if user can edit (only d.it role)
  const canEdit = userRole === "d.it";

  useEffect(() => {
    if (session) {
      console.log("===========> User Role:", session.user.role);
      console.log("===========> Can Edit:", userRole === "d.it");
    }
  }, [session, userRole]);

  const [formData, setFormData] = useState({
    hosting: {
      service: '',
      email: '',
      password: '',
      username: '',
      controlPanelUrl: ''
    },
    wordpress: {
      adminEmail: '',
      adminPassword: '',
      adminUsername: 'admin',
      loginUrl: ''
    },
    domain: {
      name: '',
      registrar: '',
      expiryDate: '',
      dnsNameservers: []
    },
    notes: '',
    ftp: {
      host: '',
      port: 21,
      username: '',
      password: '',
      protocol: 'ftp'
    },
    database: {
      host: '',
      name: '',
      username: '',
      password: '',
      port: 3306
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState({
    hosting: false,
    wordpress: false,
    ftp: false,
    database: false
  });

  // ── IT Setup Validation State ──────────────────────────────────
  const [itStatus, setItStatus] = useState('pending');
  const [contentStatus, setContentStatus] = useState('pending');
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistSections, setChecklistSections] = useState(technicalSetupSections);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [isSavingChecklistItem, setIsSavingChecklistItem] = useState(false);
  const [isConfirmingChecklist, setIsConfirmingChecklist] = useState(false);

  // ── Integration Modal State ──────────────────────────────────────
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [integrationSections, setIntegrationSections] = useState(integrationChecklistSections);
  const [isConfirmingIntegration, setIsConfirmingIntegration] = useState(false);

  const allIntegrationChecked = integrationSections.every(s => s.items.every(i => i.checked));
  const checkedIntegrationCount = integrationSections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0);
  const totalIntegrationCount = integrationSections.reduce((acc, s) => acc + s.items.length, 0);

  // Checklist computed values
  const allItemsChecked = checklistSections.every(s => s.items.every(i => i.checked));
  const checkedCount = checklistSections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0);
  const totalCount = checklistSections.reduce((acc, s) => acc + s.items.length, 0);

  // Load existing data
  useEffect(() => {
    if (projectId) {
      fetchSiteAccess();
      loadProjectStatus();
    }
  }, [projectId]);

  const loadProjectStatus = async () => {
    try {
      const response = await getProject(projectId);
      if (response.status === 'success') {
        setItStatus(response.data.project.itStatus || 'pending');
        setContentStatus(response.data.project.contentStatus || 'pending');
      }
    } catch (error) {
      console.error('Error loading project status:', error);
    }
  };

  const fetchSiteAccess = async () => {
    try {
      setLoading(true);
      const response = await getSiteAccess(projectId);
      if (response.data) {
        // Merge existing data with default structure
        setFormData(prev => ({
          ...prev,
          hosting: { ...prev.hosting, ...response.data.hosting },
          wordpress: { ...prev.wordpress, ...response.data.wordpress },
          domain: { ...prev.domain, ...response.data.domain },
          notes: response.data.notes || '',
          ftp: { ...prev.ftp, ...response.data.ftp },
          database: { ...prev.database, ...response.data.database }
        }));
      }
    } catch (error) {
      console.error('Error fetching site access:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, section = null, field = null) => {
    if (!canEdit) {
      // If user doesn't have edit permission, don't allow changes
      toast.error("You don't have permission to edit access information");
      return;
    }

    const { name, value } = e.target;

    if (section && field) {
      // For nested objects (hosting.service, wordpress.adminEmail, etc.)
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      // For top-level fields (notes)
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ── Checklist Modal Helpers ─────────────────────────────────────
  const openITChecklistModal = async () => {
    setIsChecklistModalOpen(true);
    setIsLoadingChecklist(true);
    try {
      const response = await getProjectChecklist(projectId);
      if (response.status === 'success') {
        const savedSections = response.data.sections;
        const merged = technicalSetupSections.map(section => {
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
      console.error('Error loading IT checklist:', err);
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

  const handleConfirmChecklist = async () => {
    if (!allItemsChecked) return;
    try {
      setIsConfirmingChecklist(true);
      const res = await validateITSetupChecklist(projectId);
      if (res.status !== 'success') {
        toast.error(res.message || 'Failed to validate IT setup checklist');
        return;
      }
      toast.success('Setup validated! IT checklist is now locked.');
      setItStatus('setup_validated');
      setIsChecklistModalOpen(false);
    } catch (error) {
      console.error('Error confirming IT checklist:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsConfirmingChecklist(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check permission
    if (!canEdit) {
      toast.error("You don't have permission to update access information");
      return;
    }

    // Validation
    const newErrors = {};

    if (!formData.hosting.service?.trim()) {
      newErrors.hostingService = 'Hosting service is required';
    }

    if (!formData.hosting.email?.trim()) {
      newErrors.hostingEmail = 'Hosting email is required';
    }

    if (!formData.hosting.password?.trim()) {
      newErrors.hostingPassword = 'Hosting password is required';
    }

    if (!formData.wordpress.adminEmail?.trim()) {
      newErrors.wordpressEmail = 'WordPress admin email is required';
    }

    if (!formData.wordpress.adminPassword?.trim()) {
      newErrors.wordpressPassword = 'WordPress admin password is required';
    }

    if (!formData.domain.name?.trim()) {
      newErrors.domainName = 'Domain name is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setSaving(true);

        // Remove empty optional fields before sending
        const dataToSend = {
          hosting: formData.hosting,
          wordpress: formData.wordpress,
          domain: formData.domain,
          notes: formData.notes
        };

        // Add optional fields only if they have values
        if (formData.ftp.host || formData.ftp.username) {
          dataToSend.ftp = formData.ftp;
        }

        if (formData.database.host || formData.database.name) {
          dataToSend.database = formData.database;
        }

        const response = await createOrUpdateSiteAccess(projectId, dataToSend);
        toast.success(response.message || 'Access information saved successfully!');
      } catch (error) {
        console.error('Error saving site access:', error);
        toast.error(error.response?.data?.message || 'Error saving access information');
      } finally {
        setSaving(false);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    if (!canEdit) {
      toast.error("You don't have permission to view passwords");
      return;
    }
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleClear = () => {
    if (!canEdit) {
      toast.error("You don't have permission to clear fields");
      return;
    }

    setFormData({
      hosting: { service: '', email: '', password: '', username: '', controlPanelUrl: '' },
      wordpress: { adminEmail: '', adminPassword: '', adminUsername: 'admin', loginUrl: '' },
      domain: { name: '', registrar: '', expiryDate: '', dnsNameservers: [] },
      notes: '',
      ftp: { host: '', port: 21, username: '', password: '', protocol: 'ftp' },
      database: { host: '', name: '', username: '', password: '', port: 3306 }
    });
    setErrors({});
  };

  // ── Save + Validate Setup (merged single action) ─────────────────────
  const handleSaveAndValidate = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to update access information");
      return;
    }

    // Validation
    const newErrors = {};
    if (!formData.hosting.service?.trim()) newErrors.hostingService = 'Hosting service is required';
    if (!formData.hosting.email?.trim()) newErrors.hostingEmail = 'Hosting email is required';
    if (!formData.hosting.password?.trim()) newErrors.hostingPassword = 'Hosting password is required';
    if (!formData.wordpress.adminEmail?.trim()) newErrors.wordpressEmail = 'WordPress admin email is required';
    if (!formData.wordpress.adminPassword?.trim()) newErrors.wordpressPassword = 'WordPress admin password is required';
    if (!formData.domain.name?.trim()) newErrors.domainName = 'Domain name is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields before validating.');
      return;
    }

    try {
      setSaving(true);
      const dataToSend = {
        hosting: formData.hosting,
        wordpress: formData.wordpress,
        domain: formData.domain,
        notes: formData.notes
      };
      if (formData.ftp.host || formData.ftp.username) dataToSend.ftp = formData.ftp;
      if (formData.database.host || formData.database.name) dataToSend.database = formData.database;

      await createOrUpdateSiteAccess(projectId, dataToSend);
      toast.success('Access info saved! Opening setup checklist...');
      // Open the checklist modal to confirm & lock the phase
      await openITChecklistModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving access information');
    } finally {
      setSaving(false);
    }
  };

  const toggleIntegrationItem = (itemId) => {
    setIntegrationSections(prev => prev.map(section => ({
      ...section,
      items: section.items.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    })));
  };

  const handleConfirmIntegration = async () => {
    setIsConfirmingIntegration(true);
    try {
      const { completeITIntegration } = await import("@/config/functions/project");
      const res = await completeITIntegration(projectId);
      if (res.status === 'success') {
        toast.success("Integration finalized and project completed!");
        setItStatus('integration_completed');
        setIsIntegrationModalOpen(false);
      } else {
        toast.error(res.message || "Failed to finalize integration");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsConfirmingIntegration(false);
    }
  };

  // Helper function to mask passwords for non-d.it users
  const maskPassword = (password) => {
    if (!password) return '';
    if (canEdit) return password;
    return '••••••••';
  };

  if (loading && !formData.hosting.service) {
    return (
      <div className="w-full px-4 sm:px-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading access information...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-4 sm:px-6">
        {/* Header with permission indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">IT Access Information</h2>
              <p className="text-sm text-gray-600">
                {canEdit
                  ? "Manage essential access details for WordPress site setup"
                  : "View essential access details for WordPress site setup"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${canEdit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {canEdit ? 'Edit Mode' : 'View Mode'}
              </span>
              {!canEdit && (
                <span className="text-xs text-gray-500">
                  Only IT Department can edit
                </span>
              )}
            </div>
          </div>

          {/* Phase 1: Setup Banner (Pending) — merged Save + Validate button */}
          {userRole === 'd.it' && itStatus === 'pending' && (
            <div className="mt-4 bg-white border border-blue-100 rounded-[32px] p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Icon icon="lucide:clipboard-list" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Phase 1: Technical Setup</h3>
                  <p className="text-gray-400 text-sm">Fill in the access details above, then click the button to save and validate the setup.</p>
                </div>
              </div>
              <button
                onClick={handleSaveAndValidate}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon icon="lucide:save" className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save & Complete Setup'}
              </button>
            </div>
          )}

          {/* Setup Validated Status (Success mode) */}
          {itStatus === 'setup_validated' && (
            <div className="mt-4 bg-white border border-green-50 rounded-[32px] p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 text-green-600">
                <Icon icon="lucide:check" className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">Setup Validated ✅</h3>
                <p className="text-gray-400 text-xs">
                  IT setup checklist completed and locked. Phase 1 is finished.
                </p>
              </div>
            </div>
          )}

          {/* Phase 2: Final Integration Banner — only shown when Content is also completed */}
          {userRole === 'd.it' && itStatus === 'setup_validated' && contentStatus === 'completed' && (
            <div className="mt-8 bg-white border border-indigo-50 rounded-[32px] p-6 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                  <Icon icon="lucide:check-square" className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Phase 2: Final Integration</h3>
                  <p className="text-gray-400 text-sm">Complete the final integration checklist to finish the project.</p>
                </div>
              </div>
              <button
                onClick={() => setIsIntegrationModalOpen(true)}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Icon icon="lucide:check-circle" className="w-4 h-4" />
                Finalize Integration
              </button>
            </div>
          )}

          {/* Waiting for Content — shown when IT Setup done but Content not yet completed */}
          {userRole === 'd.it' && itStatus === 'setup_validated' && contentStatus !== 'completed' && (
            <div className="mt-8 bg-white border border-amber-100 rounded-[32px] p-6 flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 flex-shrink-0">
                <Icon icon="lucide:clock" className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Waiting for Content Department</h3>
                <p className="text-gray-400 text-sm">Phase 2 — Final Integration will be available once the Content department completes their work.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Dashboard Simplified View (Phase 2 & Completion) ───────────────── */}
        {itStatus !== 'pending' ? (
          <div className="space-y-6">
            {userRole === 'd.c' && itStatus === 'setup_validated' && contentStatus === 'completed' && (
              <div className="bg-white border border-green-100 rounded-[32px] p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <Icon icon="lucide:check" className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ready for Final Integration</h2>
                    <p className="text-gray-400 text-sm">Content is ready. Complete the final validation to finish the project.</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsIntegrationModalOpen(true)}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <Icon icon="lucide:check-square" className="w-4 h-4" />
                  Complete Integration Checklist
                </button>
              </div>
            )}

            {/* Quick Access Info (Read Only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-gray-100 rounded-3xl">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Site Domain</h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Icon icon="lucide:globe" className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">{formData.domain.name || 'N/A'}</span>
                </div>
              </div>
              <div className="p-6 bg-white border border-gray-100 rounded-3xl">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">WP Admin Access</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <Icon icon="lucide:user" className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">{formData.wordpress.adminUsername}</span>
                  </div>
                  <a
                    href={formData.wordpress.loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-gray-300 hover:text-gray-600 transition-colors"
                  >
                    <Icon icon="lucide:external-link" className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Hosting Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Hosting Service</h3>
                  <span className="text-xs text-red-500 font-medium">Required</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Hosting Provider
                    </label>
                    <input
                      type="text"
                      value={formData.hosting.service || ''}
                      onChange={(e) => handleChange(e, 'hosting', 'service')}
                      placeholder="SiteGround, Bluehost, etc."
                      className={`block w-full px-3 py-1.5 text-sm border ${errors.hostingService ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      readOnly={!canEdit}
                      disabled={!canEdit}
                    />
                    {errors.hostingService && (
                      <p className="text-red-500 text-xs mt-1">{errors.hostingService}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Login Email
                    </label>
                    <input
                      type="email"
                      value={formData.hosting.email || ''}
                      onChange={(e) => handleChange(e, 'hosting', 'email')}
                      placeholder="email@example.com"
                      className={`block w-full px-3 py-1.5 text-sm border ${errors.hostingEmail ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      readOnly={!canEdit}
                      disabled={!canEdit}
                    />
                    {errors.hostingEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.hostingEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.hosting && canEdit ? "text" : "password"}
                        value={maskPassword(formData.hosting.password)}
                        onChange={(e) => handleChange(e, 'hosting', 'password')}
                        placeholder={canEdit ? "Hosting password" : "••••••••"}
                        className={`block w-full px-3 py-1.5 pr-9 text-sm border ${errors.hostingPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        readOnly={!canEdit}
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('hosting')}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.hosting ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    {errors.hostingPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.hostingPassword}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* WordPress Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">WordPress Admin</h3>
                  <span className="text-xs text-red-500 font-medium">Required</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      value={formData.wordpress.adminEmail || ''}
                      onChange={(e) => handleChange(e, 'wordpress', 'adminEmail')}
                      placeholder="admin@example.com"
                      className={`block w-full px-3 py-1.5 text-sm border ${errors.wordpressEmail ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      readOnly={!canEdit}
                      disabled={!canEdit}
                    />
                    {errors.wordpressEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.wordpressEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Admin Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.wordpress && canEdit ? "text" : "password"}
                        value={maskPassword(formData.wordpress.adminPassword)}
                        onChange={(e) => handleChange(e, 'wordpress', 'adminPassword')}
                        placeholder={canEdit ? "WordPress password" : "••••••••"}
                        className={`block w-full px-3 py-1.5 pr-9 text-sm border ${errors.wordpressPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        readOnly={!canEdit}
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('wordpress')}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showPassword.wordpress ? (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    {errors.wordpressPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.wordpressPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">Website Domain</h3>
                <span className="text-xs text-red-500 font-medium">Required</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={formData.domain.name || ''}
                  onChange={(e) => handleChange(e, 'domain', 'name')}
                  placeholder="example.com"
                  className={`block w-full px-3 py-1.5 text-sm border ${errors.domainName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  readOnly={!canEdit}
                  disabled={!canEdit}
                />
                {errors.domainName && (
                  <p className="text-red-500 text-xs mt-1">{errors.domainName}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Additional Notes</h3>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Special instructions or notes (optional)
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={handleChange}
                  name="notes"
                  rows="2"
                  placeholder="Any special requirements, server details, or important notes..."
                  className={`block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  readOnly={!canEdit}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* Form Actions - Only Clear is available; Save+Validate is handled by the Phase 1 banner button */}
            {canEdit ? (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                      This information is view-only. Only the IT Department (d.it) can edit access details.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}


        {/* Success state for completed integration */}
        {itStatus === 'integration_completed' && (
          <div className="mt-8 text-center p-8 bg-white border border-gray-100 rounded-[32px]">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4 border border-green-100">
              <Icon icon="lucide:check-check" className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Integration Done!</h3>
            <p className="text-gray-400 text-sm">The technical setup and integration have been fully finalized.</p>
          </div>
        )}
      </div>

      {/* ── IT Setup Checklist Modal ────────────────────────────────── */}
      {isChecklistModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-blue-100">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-blue-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                  <Icon icon="lucide:clipboard-check" className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">IT Setup Checklist</h2>
                  <p className="text-sm text-blue-600">Validate all items to confirm Phase 1 setup</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${allItemsChecked ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
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
                  <Icon icon="lucide:loader-2" className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                checklistSections.map(section => {
                  const sectionChecked = section.items.filter(i => i.checked).length;
                  const sectionTotal = section.items.length;
                  const allSection = sectionChecked === sectionTotal;
                  return (
                    <div key={section.id} className={`border rounded-xl overflow-hidden transition-all ${allSection ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${allSection ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
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
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className={`text-sm select-none ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>
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
                  ? '✅ All items checked — ready to confirm setup'
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
                  Confirm & Validate Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Integration Checklist Modal (Phase 2) ───────────────────────── */}
      {isIntegrationModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border border-green-100 animate-in fade-in zoom-in duration-200">

            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 bg-green-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                    <Icon icon="lucide:check-square" className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-green-900 tracking-tight">Final Integration Checklist</h2>
                    <p className="text-green-700/80 font-medium">Verify execution before project completion</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsIntegrationModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-all text-green-900/40 hover:text-green-900"
                >
                  <Icon icon="lucide:x" className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              {integrationSections.map(section => (
                <div key={section.id} className="space-y-4">
                  {section.items.map(item => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer group ${item.checked
                        ? 'bg-green-50 border-green-200 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-green-200 hover:bg-green-50/30'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 bg-white group-hover:border-green-400'
                        }`}>
                        {item.checked && <Icon icon="lucide:check" className="w-4 h-4 text-white" />}
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={item.checked}
                          onChange={() => toggleIntegrationItem(item.id)}
                        />
                      </div>
                      <span className={`text-lg font-bold transition-all ${item.checked ? 'text-green-900' : 'text-gray-600'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-2 w-32 rounded-full bg-gray-200 overflow-hidden`}>
                  <div
                    className="h-full bg-green-600 transition-all duration-500"
                    style={{
                      width: `${(checkedIntegrationCount / totalIntegrationCount) * 100}%`
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                  {checkedIntegrationCount} OF {totalIntegrationCount}
                </span>
              </div>

              <div className="flex gap-6 items-center">
                <button
                  onClick={() => setIsIntegrationModalOpen(false)}
                  className="text-gray-500 font-bold hover:text-gray-900 transition-colors uppercase tracking-widest text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIntegration}
                  disabled={!allIntegrationChecked || isConfirmingIntegration}
                  className={`px-10 py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 flex items-center gap-3 ${allIntegrationChecked && !isConfirmingIntegration
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                    : 'bg-gray-300 cursor-not-allowed shadow-none'
                    }`}
                >
                  {isConfirmingIntegration && <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />}
                  Confirm Project Completion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessesTab;