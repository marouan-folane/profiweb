import React, { useState, useEffect } from 'react';
import {
  getSiteAccess,
  createOrUpdateSiteAccess
} from '@/config/functions/access';
import { toast } from "sonner";
import { useSession } from 'next-auth/react';

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

  // Load existing data
  useEffect(() => {
    if (projectId) {
      fetchSiteAccess();
    }
  }, [projectId]);

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
      </div>

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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

        {/* Form Actions - Only show for d.it users */}
        {canEdit ? (
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Clear All
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-primary-dark focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Access Info'
              )}
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
    </div>
  );
};

export default AccessesTab;