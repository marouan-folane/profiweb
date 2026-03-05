"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { createProject, getClients } from "@/config/functions/project";
import { createNewClient } from "@/config/functions/client";
import { CATEGORIES, PRIORITIES, STATUS_OPTIONS, CURRENCIES } from "@/data/index";

const NewProjectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState([]);
  const [apiError, setApiError] = useState('');
  const [open, setOpen] = useState(false);

  // Client creation state
  const [showClientForm, setShowClientForm] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientErrors, setClientErrors] = useState([]);
  const [clientApiError, setClientApiError] = useState('');
  const [clientSuccess, setClientSuccess] = useState('');

  // Client form state
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    notes: '',
    status: 'lead',
    source: 'other',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contactPerson: {
      name: '',
      position: '',
      email: '',
      phone: ''
    }
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    clientId: '',
    category: '',
    subcategory: '',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    budget: '',
    currency: 'MAD',
    priority: '',
    status: 'planning',
    isPublic: true,
  });

  // Clear errors when form data changes
  useEffect(() => {
    if (errors.length > 0 || apiError) {
      setErrors([]);
      setApiError('');
    }
  }, [formData, tags]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setClientsLoading(true);
    try {
      const response = await getClients({ limit: 1000 });

      if (response && response.status === 'success' && response.data) {
        if (Array.isArray(response.data)) {
          setClients(response.data);
        } else if (response.data.clients && Array.isArray(response.data.clients)) {
          setClients(response.data.clients);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setClients(response.data.data);
        } else {
          console.warn('Unexpected clients data structure:', response.data);
          setClients([]);
        }
      } else {
        console.warn('Failed to fetch clients:', response);
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setApiError('Failed to load clients. Please try again.');
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags(prev => [...prev, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Client form handlers
  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientSelectChange = (name, value) => {
    setClientFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientAddressChange = (field, value) => {
    setClientFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleClientContactChange = (field, value) => {
    setClientFormData(prev => ({
      ...prev,
      contactPerson: {
        ...prev.contactPerson,
        [field]: value
      }
    }));
  };

  const validateClientForm = () => {
    const validationErrors = [];

    if (!clientFormData.name.trim()) validationErrors.push('Name is required');
    if (!clientFormData.email.trim()) validationErrors.push('Email is required');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (clientFormData.email && !emailRegex.test(clientFormData.email)) {
      validationErrors.push('Please enter a valid email address');
    }

    return validationErrors;
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setClientApiError('');
    setClientSuccess('');

    const validationErrors = validateClientForm();
    if (validationErrors.length > 0) {
      setClientErrors(validationErrors);
      return;
    }

    setCreatingClient(true);
    setClientErrors([]);

    try {
      // Prepare client data
      const clientData = {
        name: clientFormData.name,
        email: clientFormData.email,
        phone: clientFormData.phone || '',
        company: clientFormData.company || '',
        industry: clientFormData.industry || 'Other',
        address: {
          street: clientFormData.address.street || '',
          city: clientFormData.address.city || '',
          state: clientFormData.address.state || '',
          country: clientFormData.address.country || 'Morocco',
          postalCode: clientFormData.address.postalCode || ''
        },
        contactPerson: {
          name: clientFormData.contactPerson.name || clientFormData.name,
          position: clientFormData.contactPerson.position || 'Contact',
          email: clientFormData.contactPerson.email || clientFormData.email,
          phone: clientFormData.contactPerson.phone || clientFormData.phone || ''
        },
        notes: clientFormData.notes || '',
        status: clientFormData.status,
        source: clientFormData.source
      };

      console.log('Creating client:', clientData);

      // Call the createNewClient API
      const response = await createNewClient(clientData);

      if (response && response.status === 'success') {
        setClientSuccess('Client created successfully!');

        // Reset form
        setClientFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          industry: '',
          notes: '',
          status: 'lead',
          source: 'other',
          address: {
            street: '',
            city: '',
            state: '',
            country: 'Morocco',
            postalCode: ''
          },
          contactPerson: {
            name: '',
            position: '',
            email: '',
            phone: ''
          }
        });

        // Refresh clients list
        await fetchClients();

        // Auto-select the newly created client
        if (response.data && response.data.client) {
          setFormData(prev => ({
            ...prev,
            clientId: response.data.client._id
          }));
        }

        // Hide form after 1.5 seconds
        setTimeout(() => {
          setShowClientForm(false);
          setClientSuccess('');
        }, 1500);
      } else {
        // Handle API errors
        const errorMessage = response?.message || response?.error || 'Failed to create client';
        setClientApiError(errorMessage);
        console.error('Client API Error:', response);
      }

    } catch (error) {
      console.error('Error creating client:', error);
      setClientApiError(error.message || 'Failed to create client. Please try again.');
    } finally {
      setCreatingClient(false);
    }
  };

  const validateForm = () => {
    const validationErrors = [];

    if (!formData.title.trim()) validationErrors.push('Title is required');
    if (!formData.description.trim()) validationErrors.push('Description is required');
    if (!formData.clientId) validationErrors.push('Client is required');
    if (!formData.category) validationErrors.push('Category is required');
    if (!formData.startDate) validationErrors.push('Start date is required');
    if (!formData.endDate) validationErrors.push('End date is required');
    if (!formData.budget || parseFloat(formData.budget) <= 0) validationErrors.push('Valid budget is required');

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) validationErrors.push('End date must be after start date');
    }

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      // Prepare data for API
      const projectData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        clientId: formData.clientId,
        category: formData.category,
        subcategory: formData.subcategory,
        tags: tags,
        status: formData.status,
        priority: formData.priority || "standard",
        startDate: formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : null,
        endDate: formData.endDate ? format(new Date(formData.endDate), 'yyyy-MM-dd') : null,
        budget: parseFloat(formData.budget),
        currency: formData.currency,
        isPublic: formData.isPublic,
        cost: {
          estimated: parseFloat(formData.budget),
          actual: 0,
          expenses: []
        },
        progress: 0,
        isActive: true
      };

      console.log('Submitting project:', projectData);

      // Call the createProject API
      const response = await createProject(projectData);

      if (response && response.status === 'success') {
        // Redirect to projects list
        setTimeout(() => {
          router.push('/projects');
        }, 500);
      } else {
        // Handle API errors
        const errorMessage = response?.message || 'Failed to create project';
        setApiError(errorMessage);
        console.error('API Error:', response);
      }

    } catch (error) {
      console.error('Error creating project:', error);
      setApiError(error.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Calculate required fields count
  const requiredFields = [
    formData.title,
    formData.description,
    formData.clientId,
    formData.category,
    formData.startDate,
    formData.endDate,
    formData.budget
  ].filter(Boolean).length;

  return (
    <div className="p-6">
      {/* Error Alert Section */}
      {(errors.length > 0 || apiError) && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <Card className={`border ${apiError ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${apiError ? 'bg-red-100' : 'bg-amber-100'}`}>
                  <Icon
                    icon={apiError ? "heroicons:exclamation-triangle" : "heroicons:exclamation-circle"}
                    className={`w-5 h-5 ${apiError ? 'text-red-600' : 'text-amber-600'}`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${apiError ? 'text-red-800' : 'text-amber-800'} mb-1`}>
                    {apiError ? 'Submission Error' : 'Validation Errors'}
                  </h3>

                  {apiError ? (
                    <div className="text-sm text-red-700">
                      <p>{apiError}</p>
                      <p className="text-xs mt-1 opacity-75">
                        Please check your data and try again.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-700">
                        Please fix the following errors before submitting:
                      </p>
                      <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index} className="ml-2">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setErrors([]);
                        setApiError('');
                      }}
                      className={`gap-1 ${apiError ? 'text-red-700 hover:bg-red-100' : 'text-amber-700 hover:bg-amber-100'}`}
                    >
                      <Icon icon="heroicons:x-mark" className="w-4 h-4" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clients Loading Error */}
      {clients.length === 0 && !clientsLoading && !apiError && (
        <div className="mb-6">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100">
                  <Icon icon="heroicons:user-group" className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 mb-1">No Clients Found</h3>
                  <p className="text-sm text-amber-700">
                    You need to add clients before creating projects.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-default-900 mb-2">Create New Project</h1>
          <p className="text-default-600">Fill in the details to create a new project</p>
        </div>

        <div className="flex items-center gap-3">
          {/* CREATE NEW CLIENT BUTTON - Always visible at the top */}
          <Button
            variant="outline"
            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
            onClick={() => setShowClientForm(true)}
            disabled={loading}
          >
            <Icon icon="heroicons:user-plus" className="w-4 h-4" />
            Create New Client
          </Button>

          <Button variant="outline" onClick={handleCancel} className="gap-2" disabled={loading}>
            <Icon icon="heroicons:x-mark" className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="gap-2"
            disabled={loading || clients.length === 0}
          >
            {loading ? (
              <>
                <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="heroicons:check" className="w-4 h-4" />
                Save Project
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Client Creation Modal */}
      <Dialog open={showClientForm} onOpenChange={setShowClientForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-800">
              <Icon icon="heroicons:user-plus" className="w-5 h-5" />
              Create New Client
            </DialogTitle>
            <DialogDescription>
              Enter the details for the new client. Required fields are marked with *.
            </DialogDescription>
          </DialogHeader>

          {/* Client Form Errors */}
          {(clientErrors.length > 0 || clientApiError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1 text-sm">
                    {clientApiError ? 'Creation Error' : 'Validation Errors'}
                  </h3>
                  {clientApiError ? (
                    <div className="text-xs text-red-700">
                      <p>{clientApiError}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <ul className="text-xs text-red-700 list-disc list-inside">
                        {clientErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Client Success Message */}
          {clientSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Icon icon="heroicons:check-circle" className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1 text-sm">Success!</h3>
                  <p className="text-xs text-green-700">{clientSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateClient} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-xs font-medium">Full Name *</Label>
                <Input
                  id="clientName"
                  name="name"
                  value={clientFormData.name}
                  onChange={handleClientInputChange}
                  placeholder="John Doe"
                  disabled={creatingClient}
                  className={clientErrors.includes('Name is required') ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail" className="text-xs font-medium">Email Address *</Label>
                <Input
                  id="clientEmail"
                  name="email"
                  type="email"
                  value={clientFormData.email}
                  onChange={handleClientInputChange}
                  placeholder="john@example.com"
                  disabled={creatingClient}
                  className={clientErrors.includes('Email is required') || clientErrors.includes('Please enter a valid email address') ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="text-xs font-medium">Phone Number</Label>
                <Input
                  id="clientPhone"
                  type="number"
                  name="phone"
                  value={clientFormData.phone}
                  onChange={handleClientInputChange}
                  placeholder="+212 600-000000"
                  disabled={creatingClient}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientCompany" className="text-xs font-medium">Company</Label>
                <Input
                  id="clientCompany"
                  name="company"
                  value={clientFormData.company}
                  onChange={handleClientInputChange}
                  placeholder="Company Name"
                  disabled={creatingClient}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientIndustry" className="text-xs font-medium">Industry</Label>
                <Input
                  id="clientIndustry"
                  name="industry"
                  value={clientFormData.industry}
                  onChange={handleClientInputChange}
                  placeholder="e.g., Technology, Retail, etc."
                  disabled={creatingClient}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientNotes" className="text-xs font-medium">Notes</Label>
                <Textarea
                  id="clientNotes"
                  name="notes"
                  value={clientFormData.notes}
                  onChange={handleClientInputChange}
                  placeholder="Additional notes about the client..."
                  rows={3}
                  disabled={creatingClient}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClientForm(false)}
                disabled={creatingClient}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creatingClient}
                className="gap-2"
              >
                {creatingClient ? (
                  <>
                    <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon icon="heroicons:user-plus" className="w-4 h-4" />
                    Create Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="heroicons:information-circle" className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter project title"
                  required
                  disabled={loading}
                  className={errors.includes('Title is required') ? 'border-red-300' : ''}
                />
                {errors.includes('Title is required') && (
                  <p className="text-xs text-red-600">This field is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description (max 200 characters)"
                  rows={2}
                  maxLength={200}
                  disabled={loading}
                />
                <p className="text-xs text-default-500">
                  {formData.shortDescription.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the project in detail"
                  rows={4}
                  required
                  disabled={loading}
                  className={errors.includes('Description is required') ? 'border-red-300' : ''}
                />
                {errors.includes('Description is required') && (
                  <p className="text-xs text-red-600">This field is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="Add tags (press Enter)"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    >
                      <Icon icon="heroicons:plus" className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          disabled={loading}
                        >
                          <Icon icon="heroicons:x-mark" className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client & Category Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="heroicons:building-office" className="w-5 h-5" />
                Client & Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="clientId">Client *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs h-8"
                  onClick={() => setShowClientForm(true)}
                  disabled={loading}
                >
                  <Icon icon="heroicons:user-plus" className="w-3 h-3" />
                  Add New Client
                </Button>
              </div>

                <div className="space-y-2">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                          "w-full justify-between font-normal",
                          !formData.clientId && "text-muted-foreground",
                          errors.includes('Client is required') ? "border-red-300" : ""
                        )}
                        disabled={loading || clientsLoading}
                      >
                        {formData.clientId
                          ? clients.find((client) => client._id === formData.clientId)?.name
                          : clientsLoading ? "Loading clients..." : "Select a client"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search clients..." />
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {clients.map((client) => (
                              <CommandItem
                                key={client._id}
                                value={client.name}
                                onSelect={() => {
                                  handleSelectChange('clientId', client._id);
                                  setOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.clientId === client._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{client.name}</span>
                                  {client.company && (
                                    <span className="text-xs text-muted-foreground">{client.company}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.includes('Client is required') && (
                    <p className="text-xs text-red-600">Please select a client</p>
                  )}
                  {clientsLoading && (
                    <p className="text-xs text-blue-600">Loading clients...</p>
                  )}
                  {!clientsLoading && clients.length === 0 && (
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      <Icon icon="heroicons:exclamation-circle" className="w-3 h-3" />
                      No clients found. Click "Create New Client" to add one.
                    </div>
                  )}
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className={errors.includes('Category is required') ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.includes('Category is required') && (
                    <p className="text-xs text-red-600">Please select a category</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                  <Input
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    placeholder="e.g., React, Shopify, etc."
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="heroicons:calendar" className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground",
                          errors.includes('Start date is required') ? "border-red-300" : ""
                        )}
                        disabled={loading}
                      >
                        <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(new Date(formData.startDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => handleDateChange('startDate', date)}
                        initialFocus
                        disabled={loading}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.includes('Start date is required') && (
                    <p className="text-xs text-red-600">Please select a start date</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground",
                          errors.includes('End date is required') ? "border-red-300" : ""
                        )}
                        disabled={loading}
                      >
                        <Icon icon="heroicons:calendar" className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(new Date(formData.endDate), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => handleDateChange('endDate', date)}
                        initialFocus
                        disabled={loading}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.includes('End date is required') && (
                    <p className="text-xs text-red-600">Please select an end date</p>
                  )}
                  {errors.includes('End date must be after start date') && (
                    <p className="text-xs text-red-600">End date must be after start date</p>
                  )}
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-default-50 p-3 rounded-lg">
                  <p className="text-sm text-default-700">
                    Project Duration: {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="heroicons:banknotes" className="w-5 h-5" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget *</Label>
                <div className="flex gap-2">
                  <div className="w-24">
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleSelectChange('currency', value)}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className={errors.includes('Valid budget is required') ? 'border-red-300' : ''}
                  />
                </div>
                {errors.includes('Valid budget is required') && (
                  <p className="text-xs text-red-600">Please enter a valid budget amount</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange('priority', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Form Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="heroicons:clipboard-document-check" className="w-5 h-5" />
                Form Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Required Fields:</span>
                  <span className={`font-medium ${requiredFields === 7 ? 'text-green-600' : 'text-amber-600'}`}>
                    {requiredFields}/7
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Tags Added:</span>
                  <span className="font-medium">{tags.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Status:</span>
                  <Badge variant={formData.status === 'planning' ? 'secondary' : 'default'}>
                    {STATUS_OPTIONS.find(s => s.value === formData.status)?.label || 'Planning'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Priority:</span>
                  <Badge variant="outline">
                    {PRIORITIES.find(p => p.value === formData.priority)?.label || 'Standard'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Clients Available:</span>
                  <span className="font-medium">{clients.length}</span>
                </div>
              </div>

              <Separator />

              <div className="text-sm space-y-1">
                <p className="font-medium">Note:</p>
                <ul className="list-disc list-inside text-default-600 space-y-1">
                  <li>All fields marked with * are required</li>
                  <li>Click "Create New Client" to add clients on the fly</li>
                  <li>Project can be edited after creation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-default-200 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-default-600">
            Creating new project: <span className="font-medium">{formData.title || 'Untitled Project'}</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              onClick={() => setShowClientForm(true)}
              disabled={loading}
            >
              <Icon icon="heroicons:user-plus" className="w-4 h-4" />
              New Client
            </Button>

            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="gap-2"
              disabled={loading || clients.length === 0}
            >
              {loading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="heroicons:check" className="w-4 h-4" />
                  Save Project
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;