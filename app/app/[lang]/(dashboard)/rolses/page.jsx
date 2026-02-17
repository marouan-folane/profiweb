"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Shield, 
  Users, 
  Building, 
  Check,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Page = () => {
  // States
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    permissions: []
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [expandedRoleId, setExpandedRoleId] = useState(null);
  
  // Available departments
  const departments = [
    { value: 'integration', label: 'Integration', color: 'bg-blue-100 text-blue-800' },
    { value: 'design', label: 'Design', color: 'bg-purple-100 text-purple-800' },
    { value: 'it', label: 'IT', color: 'bg-green-100 text-green-800' },
    { value: 'informations', label: 'Informations', color: 'bg-amber-100 text-amber-800' },
    { value: '', label: 'Global', color: 'bg-gray-100 text-gray-800' }
  ];
  
  // Available permissions (in real app, fetch from API)
  const availablePermissions = [
    // User Management
    { id: 'users.create', name: 'Create Users', category: 'User Management', description: 'Create new users' },
    { id: 'users.read', name: 'View Users', category: 'User Management', description: 'View user profiles and lists' },
    { id: 'users.update', name: 'Update Users', category: 'User Management', description: 'Update user information' },
    { id: 'users.delete', name: 'Delete Users', category: 'User Management', description: 'Delete users' },
    
    // Role Management
    { id: 'roles.create', name: 'Create Roles', category: 'Role Management', description: 'Create new roles' },
    { id: 'roles.read', name: 'View Roles', category: 'Role Management', description: 'View roles and permissions' },
    { id: 'roles.update', name: 'Update Roles', category: 'Role Management', description: 'Update role information' },
    { id: 'roles.delete', name: 'Delete Roles', category: 'Role Management', description: 'Delete roles' },
    
    // Content Management
    { id: 'content.create', name: 'Create Content', category: 'Content', description: 'Create new content' },
    { id: 'content.read', name: 'View Content', category: 'Content', description: 'View content' },
    { id: 'content.update', name: 'Update Content', category: 'Content', description: 'Update content' },
    { id: 'content.delete', name: 'Delete Content', category: 'Content', description: 'Delete content' },
    
    // Department Specific
    { id: 'dept.integration', name: 'Access Integration Dept', category: 'Department Access', description: 'Access integration department' },
    { id: 'dept.design', name: 'Access Design Dept', category: 'Department Access', description: 'Access design department' },
    { id: 'dept.it', name: 'Access IT Dept', category: 'Department Access', description: 'Access IT department' },
    { id: 'dept.informations', name: 'Access Informations Dept', category: 'Department Access', description: 'Access informations department' },
    
    // System
    { id: 'system.settings', name: 'System Settings', category: 'System', description: 'Modify system settings' },
    { id: 'reports.view', name: 'View Reports', category: 'Reports', description: 'View system reports' },
    { id: 'reports.generate', name: 'Generate Reports', category: 'Reports', description: 'Generate new reports' }
  ];
  
  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {});
  
  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data.data.roles);
      setError('');
    } catch (err) {
      setError('Failed to fetch roles. Please try again.');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize
  useEffect(() => {
    fetchRoles();
  }, []);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle permission toggle
  const togglePermission = (permissionId) => {
    setFormData(prev => {
      if (prev.permissions.includes(permissionId)) {
        return {
          ...prev,
          permissions: prev.permissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permissionId]
        };
      }
    });
  };
  
  // Select all permissions in a category
  const selectAllInCategory = (category) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    setFormData(prev => {
      const newPermissions = [...prev.permissions];
      categoryPermissions.forEach(permId => {
        if (!newPermissions.includes(permId)) {
          newPermissions.push(permId);
        }
      });
      return { ...prev, permissions: newPermissions };
    });
  };
  
  // Clear all permissions in a category
  const clearAllInCategory = (category) => {
    const categoryPermissions = groupedPermissions[category].map(p => p.id);
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(id => !categoryPermissions.includes(id))
    }));
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      department: '',
      permissions: []
    });
    setEditingRole(null);
    setShowCreateForm(false);
  };
  
  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingRole 
        ? `/api/v1/roles/${editingRole._id}`
        : '/api/v1/roles';
      
      const method = editingRole ? 'patch' : 'post';
      
      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(response.data.message || 'Role saved successfully!');
      resetForm();
      fetchRoles();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save role. Please try again.');
    }
  };
  
  // Delete role
  const handleDeleteRole = async (roleId) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Role deleted successfully!');
      fetchRoles();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete role.');
    }
  };
  
  // Edit role
  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      department: role.department || '',
      permissions: role.permissions || []
    });
    setShowCreateForm(true);
  };
  
  // View role details
  const handleViewRole = (role) => {
    setViewingRole(role);
  };
  
  // Close view modal
  const closeViewModal = () => {
    setViewingRole(null);
  };
  
  // Toggle role expansion
  const toggleRoleExpansion = (roleId) => {
    setExpandedRoleId(expandedRoleId === roleId ? null : roleId);
  };
  
  // Filter roles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || 
                             !role.department || 
                             role.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });
  
  // Get department badge color
  const getDepartmentColor = (department) => {
    const dept = departments.find(d => d.value === department);
    return dept ? dept.color : 'bg-gray-100 text-gray-800';
  };
  
  // Get department label
  const getDepartmentLabel = (department) => {
    const dept = departments.find(d => d.value === department);
    return dept ? dept.label : 'Global';
  };
  
  // Get role icon based on level
  const getRoleIcon = (level) => {
    if (level >= 100) return <Shield className="h-5 w-5 text-red-500" />;
    if (level >= 50) return <Shield className="h-5 w-5 text-blue-500" />;
    return <Users className="h-5 w-5 text-green-500" />;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600 mt-2">Create and manage user roles with specific permissions</p>
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create New Role
            </button>
          </div>
          
          {/* Success/Error Messages */}
          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search roles by name, description, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="w-full md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">All Departments</option>
                  <option value="">Global Roles</option>
                  <option value="integration">Integration</option>
                  <option value="design">Design</option>
                  <option value="it">IT</option>
                  <option value="informations">Informations</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[70vh]">
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., IT Manager"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Department
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Global (All Departments)</option>
                          <option value="integration">Integration</option>
                          <option value="design">Design</option>
                          <option value="it">IT</option>
                          <option value="informations">Informations</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe the role's purpose and responsibilities..."
                      />
                    </div>
                  </div>
                  
                  {/* Permissions Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                      <div className="text-sm text-gray-600">
                        {formData.permissions.length} permission(s) selected
                      </div>
                    </div>
                    
                    {/* Permission Categories */}
                    <div className="space-y-4">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                            <span className="font-medium text-gray-900">{category}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => selectAllInCategory(category)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Select All
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                type="button"
                                onClick={() => clearAllInCategory(category)}
                                className="text-sm text-gray-600 hover:text-gray-800"
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                  formData.permissions.includes(permission.id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => togglePermission(permission.id)}
                              >
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {permission.name}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {permission.description}
                                  </div>
                                </div>
                                
                                {formData.permissions.includes(permission.id) && (
                                  <Check className="h-5 w-5 text-blue-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Form Actions */}
                <div className="border-t p-6 bg-gray-50">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="h-5 w-5" />
                      {editingRole ? 'Update Role' : 'Create Role'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Roles List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-b">
            <div className="p-4 border-r">
              <div className="text-sm text-gray-600">Total Roles</div>
              <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
            </div>
            <div className="p-4 border-r">
              <div className="text-sm text-gray-600">System Roles</div>
              <div className="text-2xl font-bold text-gray-900">
                {roles.filter(r => r.isSystemRole).length}
              </div>
            </div>
            <div className="p-4 border-r">
              <div className="text-sm text-gray-600">Custom Roles</div>
              <div className="text-2xl font-bold text-gray-900">
                {roles.filter(r => !r.isSystemRole).length}
              </div>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-600">Active Roles</div>
              <div className="text-2xl font-bold text-gray-900">
                {roles.filter(r => r.isActive).length}
              </div>
            </div>
          </div>
          
          {/* Roles Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        {roles.length === 0 ? 'No roles found. Create your first role!' : 'No roles match your filters.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <React.Fragment key={role._id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getRoleIcon(role.level)}
                            <div>
                              <div className="font-medium text-gray-900">{role.name}</div>
                              <div className="text-sm text-gray-500">{role.code}</div>
                              {role.description && (
                                <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDepartmentColor(role.department)}`}>
                            <Building className="h-3 w-3 mr-1" />
                            {getDepartmentLabel(role.department)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {role.permissions?.length || 0} permission(s)
                            </span>
                            <button
                              onClick={() => toggleRoleExpansion(role._id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {expandedRoleId === role._id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${role.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-sm ${role.isActive ? 'text-green-700' : 'text-red-700'}`}>
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {role.isSystemRole && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                System
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewRole(role)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            {!role.isSystemRole && (
                              <>
                                <button
                                  onClick={() => handleEditRole(role)}
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Edit Role"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteRole(role._id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Role"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Permissions View */}
                      {expandedRoleId === role._id && (
                        <tr>
                          <td colSpan="5" className="bg-gray-50 px-6 py-4">
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900">Role Permissions</h4>
                              <div className="flex flex-wrap gap-2">
                                {role.permissions?.length > 0 ? (
                                  role.permissions.map((perm, index) => {
                                    const permission = availablePermissions.find(p => p.id === perm) || 
                                                     { name: perm, description: 'Custom permission' };
                                    return (
                                      <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                                      >
                                        <Check className="h-3 w-3 text-green-500" />
                                        <span className="font-medium">{permission.name}</span>
                                        {permission.description && (
                                          <span className="text-gray-600 ml-2">{permission.description}</span>
                                        )}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-500">No permissions assigned</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* View Role Modal */}
      {viewingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{viewingRole.name}</h2>
                <p className="text-gray-600 mt-1">{viewingRole.code}</p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDepartmentColor(viewingRole.department)}`}>
                    {getDepartmentLabel(viewingRole.department)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${viewingRole.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{viewingRole.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
              
              {viewingRole.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <p className="text-gray-900">{viewingRole.description}</p>
                </div>
              )}
              
              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                  <span className="text-sm text-gray-600">
                    {viewingRole.permissions?.length || 0} permission(s)
                  </span>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => {
                    const categoryPermissions = viewingRole.permissions?.filter(perm => 
                      permissions.some(p => p.id === perm)
                    ) || [];
                    
                    if (categoryPermissions.length === 0) return null;
                    
                    return (
                      <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3">
                          <span className="font-medium text-gray-900">{category}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({categoryPermissions.length} permissions)
                          </span>
                        </div>
                        
                        <div className="p-4">
                          <div className="space-y-2">
                            {categoryPermissions.map((permId, index) => {
                              const permission = permissions.find(p => p.id === permId);
                              if (!permission) return null;
                              
                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {permission.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {permission.description}
                                    </div>
                                  </div>
                                  <Check className="h-5 w-5 text-green-500" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!viewingRole.permissions || viewingRole.permissions.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No permissions assigned to this role
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t p-6">
              <button
                onClick={closeViewModal}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;