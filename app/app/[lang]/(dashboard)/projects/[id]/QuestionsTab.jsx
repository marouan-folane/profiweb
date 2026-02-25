"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createOrUpdateQuestions, getQuestionsForProject, updateProject, getProject, completeInfoQuestionnaire } from "@/config/functions/project";
import { getFolders } from "@/config/functions/folder";
import { getAllTemplates } from "@/config/functions/template";
import toast from 'react-hot-toast';

// Import components
import PreliminaryInfo from "./components/PreliminaryInfo.jsx";
import BasicProjectInfo from "./components/BasicProjectInfo.jsx";
import ClientInfo from "./components/ClientInfo.jsx";
import ProjectDetails from "./components/ProjectDetails.jsx";
import BusinessInfo from "./components/BusinessInfo.jsx";
import CompanyLegalInfo from "./components/CompanyLegalInfo.jsx";
import WebsiteGoalsInfo from "./components/WebsiteGoalsInfo.jsx";
import MarketAnalysisInfo from "./components/MarketAnalysisInfo.jsx";
import WebsiteStructureInfo from "./components/WebsiteStructureInfo.jsx";
import DesignRequirementsInfo from "./components/DesignRequirementsInfo.jsx";
import RevenueStreamsInfo from "./components/RevenueStreamsInfo.jsx";
import SocialMediaStrategyInfo from "./components/SocialMediaStrategyInfo.jsx";
import TemplateSelection from "./components/TemplateSelection.jsx";
import CustomFields from "./components/CustomFields.jsx";
import SubmitSection from "./components/SubmitSection.jsx";
import AIWorkInstructions from "./components/AIWorkInstructions.jsx";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"

const QuestionsTab = ({ setFormSubmitted }) => {
  const params = useParams();
  const projectId = params.id;

  const router = useRouter();

  const { data: session } = useSession();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-save: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState('idle');
  const autoSaveTimerRef = useRef(null);

  const [newCustomField, setNewCustomField] = useState({
    questionKey: "",
    label: "",
    type: "text",
    placeholder: "",
    isRequired: false,
    section: "custom",
    sectionName: "Custom Fields",
    options: []
  });

  // Initialize with empty form structure using useMemo to prevent recreation
  const initialFormData = useMemo(() => ({
    // Preliminary Information
    caseWorkerName: "",
    caseWorkerLanguage: "",

    // Basic Information
    title: "",
    description: "",
    shortDescription: "",

    // Client Information
    client: {
      name: "",
      contactPerson: {
        name: "",
        email: "",
        phone: ""
      }
    },

    // Project Details
    category: "",
    tags: [],

    // Business Information (for website content)
    companyName: "",
    legalForm: "",
    businessAddress: "",
    companyTelephone: "",
    companyEmail: "",
    companyDescription: "",
    briefCompanyDescription: "",
    managingDirector: "",
    iceNumber: "",
    yearOfFoundation: "",
    servicesOffered: "",
    websitePurpose: "",
    targetCustomers: "",
    businessType: "",
    industry: "",
    uniqueSellingPoints: "",
    callToAction: "",

    // NEW FIELDS FROM DOCX
    websiteObjective: "",
    toneAndDemeanor: [],
    imagesAvailable: "no",
    logoAvailable: "Yes",
    corporateDesignAvailable: "Yes",
    highlightedService: "",
    lowPriorityServices: "",
    mandatoryHomepageContent: "",
    competitiveEnvironment: "",
    websiteLanguages: [],
    communicationLanguage: "German",
    outputLanguages: ["English", "German"],

    // Market Analysis
    likedCompetitors: "",
    marketSize: "",
    marketGrowthRate: "",
    marketShare: "",
    differentiationCompetitors: "",
    contentRestrictions: "",
    specialFeaturesCompared: "",

    // Website Structure & Content
    websitePages: [],

    // Revenue Streams
    revenueStreams: "",
    subscriptionModel: "",
    subscriptionFee: "",
    subscriptionDuration: "",
    subscriptionFrequency: "",

    // Social Media Strategy
    socialMediaStrategy: "",

    // Design Requirements
    logoAvailability: "",
    corporateDesignAvailability: "",
    imageAvailability: "",
    imageNotes: "",
    colorScheme: "",
    tonality: [],

    // Template
    selectedTemplateId: null,
    templateName: "",
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [templates, setTemplates] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [folders, setFolders] = useState("");

  // Required fields - ONLY THESE 5 FIELDS ARE REQUIRED
  const requiredFields = [
    'companyName',
    'businessAddress',
    'companyTelephone',
    'companyEmail',
    'servicesOffered'
  ];

  const queryClient = useQueryClient();

  // React Query for fetching templates
  const { data: templateRes } = useQuery({
    queryFn: () => getAllTemplates(),
    staleTime: 1000 * 60 * 5,
  });

  // React Query for fetching folders
  const { data: foldersRes } = useQuery({
    queryKey: ['folders'],
    queryFn: () => getFolders(),
    staleTime: 1000 * 60 * 5,
  });

  // React Query for fetching project data
  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });

  // React Query for fetching questions data
  const {
    data: questionsResponse,
    isLoading: isLoadingQuestions,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: ['questions', projectId],
    queryFn: () => getQuestionsForProject(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });

  // Update templates
  useEffect(() => {
    if (templateRes?.data?.templates) {
      setTemplates(templateRes.data.templates);
    }
  }, [templateRes]);

  // Update folders
  useEffect(() => {
    if (foldersRes?.data?.folders) {
      setFolders(foldersRes.data.folders);
    }
  }, [foldersRes]);

  // Enhanced function to populate form from questions
  const populateFormFromQuestions = useCallback((questions) => {
    if (!questions || questions.length === 0) return;

    // console.log("Populating form from questions:", questions);

    const updatedFormData = { ...initialFormData };
    const newCustomQuestions = [];

    questions.forEach(q => {
      if (q.isCustom) {
        const existingCustom = customQuestions.find(cq => cq.questionKey === q.questionKey);
        if (!existingCustom) {
          newCustomQuestions.push({
            questionKey: q.questionKey,
            label: q.question,
            type: q.type,
            placeholder: q.placeholder || "",
            isRequired: q.isRequired || false,
            section: q.section || 'custom',
            sectionName: q.sectionName || 'Custom Fields',
            options: q.options || [],
            answer: q.answer || "",
            isCustom: true
          });
        } else {
          // Update existing custom question with new answer
          const updatedCustomQuestions = customQuestions.map(cq =>
            cq.questionKey === q.questionKey ? { ...cq, answer: q.answer || "" } : cq
          );
          setCustomQuestions(updatedCustomQuestions);
        }
      } else {
        const keys = q.questionKey.split('.');
        const value = q.answer || "";

        if (keys.length === 1) {
          updatedFormData[keys[0]] = value;
        } else if (keys.length === 2) {
          if (!updatedFormData[keys[0]]) {
            updatedFormData[keys[0]] = {};
          }
          updatedFormData[keys[0]][keys[1]] = value;
        } else if (keys.length === 3) {
          if (!updatedFormData[keys[0]]) {
            updatedFormData[keys[0]] = {};
          }
          if (!updatedFormData[keys[0]][keys[1]]) {
            updatedFormData[keys[0]][keys[1]] = {};
          }
          updatedFormData[keys[0]][keys[1]][keys[2]] = value;
        }
      }
    });

    // Update custom questions if new ones found
    if (newCustomQuestions.length > 0) {
      setCustomQuestions(prev => {
        const merged = [...prev];
        newCustomQuestions.forEach(newQ => {
          if (!merged.find(q => q.questionKey === newQ.questionKey)) {
            merged.push(newQ);
          }
        });
        return merged;
      });
    }

    // Handle template selection
    const templateQuestion = questions.find(q => q.questionKey === 'selectedTemplateId');
    if (templateQuestion?.answer) {
      const templateId = templateQuestion.answer;
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setSelectedTemplate(templateId);
        updatedFormData.selectedTemplateId = templateId;
        updatedFormData.templateName = template.title;
      }
    }

    // Handle array fields
    const websitePagesQuestion = questions.find(q => q.questionKey === 'websitePages');
    if (websitePagesQuestion?.answer) {
      if (typeof websitePagesQuestion.answer === 'string') {
        updatedFormData.websitePages = websitePagesQuestion.answer.split(', ').filter(item => item.trim() !== '');
      } else if (Array.isArray(websitePagesQuestion.answer)) {
        updatedFormData.websitePages = websitePagesQuestion.answer;
      }
    }

    const websiteLanguagesQuestion = questions.find(q => q.questionKey === 'websiteLanguages');
    if (websiteLanguagesQuestion?.answer) {
      if (typeof websiteLanguagesQuestion.answer === 'string') {
        updatedFormData.websiteLanguages = websiteLanguagesQuestion.answer.split(', ').filter(item => item.trim() !== '');
      } else if (Array.isArray(websiteLanguagesQuestion.answer)) {
        updatedFormData.websiteLanguages = websiteLanguagesQuestion.answer;
      }
    }

    const outputLanguagesQuestion = questions.find(q => q.questionKey === 'outputLanguages');
    if (outputLanguagesQuestion?.answer) {
      if (typeof outputLanguagesQuestion.answer === 'string') {
        updatedFormData.outputLanguages = outputLanguagesQuestion.answer.split(', ').filter(item => item.trim() !== '');
      } else if (Array.isArray(outputLanguagesQuestion.answer)) {
        updatedFormData.outputLanguages = outputLanguagesQuestion.answer;
      }
    }

    const tonalityQuestion = questions.find(q => q.questionKey === 'tonality');
    if (tonalityQuestion?.answer) {
      if (typeof tonalityQuestion.answer === 'string') {
        updatedFormData.tonality = tonalityQuestion.answer.split(', ').filter(item => item.trim() !== '');
      } else if (Array.isArray(tonalityQuestion.answer)) {
        updatedFormData.tonality = tonalityQuestion.answer;
      }
    }

    const toneAndDemeanorQuestion = questions.find(q => q.questionKey === 'toneAndDemeanor');
    if (toneAndDemeanorQuestion?.answer) {
      if (typeof toneAndDemeanorQuestion.answer === 'string') {
        updatedFormData.toneAndDemeanor = toneAndDemeanorQuestion.answer.split(', ').filter(item => item.trim() !== '');
      } else if (Array.isArray(toneAndDemeanorQuestion.answer)) {
        updatedFormData.toneAndDemeanor = toneAndDemeanorQuestion.answer;
      }
    }

    // Handle tags if exists
    const tagsQuestion = questions.find(q => q.questionKey === 'tags');
    if (tagsQuestion?.answer) {
      if (typeof tagsQuestion.answer === 'string') {
        updatedFormData.tags = tagsQuestion.answer.split(', ').filter(item => item.trim() !== '');
      } else if (Array.isArray(tagsQuestion.answer)) {
        updatedFormData.tags = tagsQuestion.answer;
      }
    }

    setFormData(updatedFormData);
    setHasLoadedQuestions(true);
    // console.log("Form data populated from questions:", updatedFormData);
  }, [initialFormData, customQuestions, templates]);

  // Load questions data when it's available
  useEffect(() => {
    if (questionsResponse?.data?.questions && !hasLoadedQuestions) {
      // console.log("Questions loaded from API:", questionsResponse.data.questions);
      populateFormFromQuestions(questionsResponse.data.questions);
    }
  }, [questionsResponse, populateFormFromQuestions, hasLoadedQuestions]);

  const infoStatus = projectData?.data?.infoStatus || 'pending';
  const isInfoCompleted = infoStatus === 'completed';
  const userRole = session?.user?.role;
  const isSuperAdmin = userRole === 'superadmin';
  const isInfoDept = userRole === 'd.i';
  const isSalesDept = userRole === 'd.s';

  // HARD LOCK: once questionnaire is completed, everyone is locked out of editing
  // Filled fields become readonly, empty fields become disabled
  // This applies to ALL roles — d.i, d.s, superadmin — no exceptions
  const isLockedForEdit = isInfoCompleted;

  // Load project data
  useEffect(() => {
    if (projectData?.data && !isInitialized && !hasLoadedQuestions) {
      const data = projectData.data;
      // console.log("Loading project data:", data);

      const updatedFormData = { ...initialFormData };

      // Load basic project data
      if (data.title) updatedFormData.title = data.title;
      if (data.description) updatedFormData.description = data.description;
      if (data.shortDescription) updatedFormData.shortDescription = data.shortDescription;
      if (data.category) updatedFormData.category = data.category;
      if (data.tags) updatedFormData.tags = Array.isArray(data.tags) ? data.tags : [];

      // Load client data
      if (data.client) {
        updatedFormData.client = {
          name: data.client.name || "",
          contactPerson: {
            name: data.client.contactPerson?.name || "",
            email: data.client.contactPerson?.email || "",
            phone: data.client.contactPerson?.phone || ""
          }
        };
      }

      // Handle template
      if (data.selectedTemplateId) {
        const templateId = data.selectedTemplateId;
        const template = templates.find(t => t._id === templateId);
        if (template) {
          setSelectedTemplate(templateId);
          updatedFormData.selectedTemplateId = templateId;
          updatedFormData.templateName = template.title;
          updatedFormData.category = template.category || "WordPress Website";
        }
      }

      // Ensure arrays
      if (!Array.isArray(updatedFormData.tags)) updatedFormData.tags = [];
      if (!Array.isArray(updatedFormData.websiteLanguages)) updatedFormData.websiteLanguages = [];
      if (!Array.isArray(updatedFormData.websitePages)) updatedFormData.websitePages = [];
      if (!Array.isArray(updatedFormData.tonality)) updatedFormData.tonality = [];
      if (!Array.isArray(updatedFormData.toneAndDemeanor)) updatedFormData.toneAndDemeanor = [];
      if (!Array.isArray(updatedFormData.outputLanguages)) updatedFormData.outputLanguages = ["English", "German"];

      setFormData(updatedFormData);
      setIsInitialized(true);
      console.log("Form initialized from project data:", updatedFormData);
    }
  }, [projectData, isInitialized, templates, initialFormData, hasLoadedQuestions]);

  // Handler functions
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const keys = field.split('.');

      // Special handling for tonality field to preserve array structure
      if (field === "tonality") {
        return {
          ...prev,
          tonality: Array.isArray(value) ? value : [value]
        };
      }

      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value } };
      } else if (keys.length === 3) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: { ...prev[keys[0]][keys[1]], [keys[2]]: value }
          }
        };
      }
      return prev;
    });

    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t._id === templateId);
    if (template) {
      handleInputChange('category', template.category || "WordPress Website");
      handleInputChange('templateName', template.title);
    }
    handleInputChange('selectedTemplateId', templateId);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      const updatedTags = [...formData.tags, newTag.trim().toLowerCase()];
      setFormData(prev => ({ ...prev, tags: updatedTags }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: updatedTags }));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (questionsResponse?.data?.statistics?.completionPercentage) {
      return questionsResponse.data.statistics.completionPercentage;
    }

    const totalFields = requiredFields.length;
    const filledFields = requiredFields.filter(field => {
      const keys = field.split('.');
      let value;

      if (keys.length === 1) {
        value = formData[field];
      } else if (keys.length === 2) {
        value = formData[keys[0]]?.[keys[1]];
      } else if (keys.length === 3) {
        value = formData[keys[0]]?.[keys[1]]?.[keys[2]];
      }

      return value && value.toString().trim() !== "";
    }).length;

    return Math.round((filledFields / totalFields) * 100);
  };

  const getOverallCompletionPercentage = () => {
    const formCompletion = getCompletionPercentage();
    const templateBonus = selectedTemplate ? 10 : 0;
    const overallCompletion = Math.min(100, formCompletion * 0.9 + templateBonus);
    return Math.round(overallCompletion);
  };

  const areAllRequiredFieldsFilled = () => {
    if (questionsResponse?.data?.statistics?.required?.completionPercentage === 100) {
      return true;
    }

    return requiredFields.every(field => {
      const keys = field.split('.');
      let value;

      if (keys.length === 1) {
        value = formData[field];
      } else if (keys.length === 2) {
        value = formData[keys[0]]?.[keys[1]];
      } else if (keys.length === 3) {
        value = formData[keys[0]]?.[keys[1]]?.[keys[2]];
      }

      return value && value.toString().trim() !== "";
    });
  };

  // Mutation for updating project
  const updateProjectMutation = useMutation({
    mutationFn: (projectData) => updateProject(projectId, projectData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      if (setFormSubmitted) {
        setFormSubmitted(true);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update project. Please try again.");
    },
  });

  // Handle website language selection
  const handleLanguageToggle = (language) => {
    setFormData(prev => {
      const currentLanguages = [...prev.websiteLanguages];
      if (currentLanguages.includes(language)) {
        return {
          ...prev,
          websiteLanguages: currentLanguages.filter(lang => lang !== language)
        };
      } else {
        return {
          ...prev,
          websiteLanguages: [...currentLanguages, language]
        };
      }
    });
  };

  // Handle website pages selection
  const handleWebsitePagesToggle = (page) => {
    setFormData(prev => {
      const currentPages = [...prev.websitePages];
      if (currentPages.includes(page)) {
        return {
          ...prev,
          websitePages: currentPages.filter(p => p !== page)
        };
      } else {
        return {
          ...prev,
          websitePages: [...currentPages, page]
        };
      }
    });
  };

  // Handle tonality selection
  const handleTonalityToggle = (tone) => {
    setFormData(prev => {
      const currentTones = [...prev.tonality];

      // Filter out any empty strings or null values
      const cleanCurrentTones = currentTones.filter(t => t && t.trim() !== '');

      if (cleanCurrentTones.includes(tone)) {
        return {
          ...prev,
          tonality: cleanCurrentTones.filter(t => t !== tone)
        };
      } else {
        return {
          ...prev,
          tonality: [...cleanCurrentTones, tone]
        };
      }
    });
  };

  // Enhanced refresh function
  const handleRefreshQuestions = async () => {
    try {
      setIsRefreshing(true);
      // toast.loading("Refreshing questions data...");

      // Reset state to allow fresh loading
      setHasLoadedQuestions(false);
      setFormData(initialFormData);
      setCustomQuestions([]);
      setSelectedTemplate(null);
      setValidationErrors({});

      // Clear React Query cache for questions
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });

      // Fetch fresh data
      const [freshQuestions, freshProject] = await Promise.all([
        getQuestionsForProject(projectId),
        getProject(projectId)
      ]);

      // console.log("Fresh questions data:", freshQuestions);
      // console.log("Fresh project data:", freshProject);

      // Handle project data
      if (freshProject?.data) {
        const data = freshProject.data;
        const updatedFormData = { ...initialFormData };

        if (data.title) updatedFormData.title = data.title;
        if (data.description) updatedFormData.description = data.description;
        if (data.shortDescription) updatedFormData.shortDescription = data.shortDescription;
        if (data.category) updatedFormData.category = data.category;
        if (data.tags) updatedFormData.tags = Array.isArray(data.tags) ? data.tags : [];

        if (data.client) {
          updatedFormData.client = {
            name: data.client.name || "",
            contactPerson: {
              name: data.client.contactPerson?.name || "",
              email: data.client.contactPerson?.email || "",
              phone: data.client.contactPerson?.phone || ""
            }
          };
        }

        // Ensure arrays
        if (!Array.isArray(updatedFormData.tags)) updatedFormData.tags = [];
        if (!Array.isArray(updatedFormData.websiteLanguages)) updatedFormData.websiteLanguages = [];
        if (!Array.isArray(updatedFormData.websitePages)) updatedFormData.websitePages = [];
        if (!Array.isArray(updatedFormData.tonality)) updatedFormData.tonality = [];
        if (!Array.isArray(updatedFormData.toneAndDemeanor)) updatedFormData.toneAndDemeanor = [];
        if (!Array.isArray(updatedFormData.outputLanguages)) updatedFormData.outputLanguages = ["English", "German"];

        setFormData(updatedFormData);
      }

      // Handle questions data
      if (freshQuestions?.data?.questions) {
        populateFormFromQuestions(freshQuestions.data.questions);
      }

      toast.dismiss();
      // toast.success("Questions refreshed successfully!");

      // Update React Query cache with fresh data
      queryClient.setQueryData(['questions', projectId], freshQuestions);
      queryClient.setQueryData(['project', projectId], freshProject);

    } catch (error) {
      // console.error("Refresh error:", error);
      // toast.dismiss();
      // toast.error("Failed to refresh questions. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefreshQuestions();
  }, [projectId]);

  // Main submit function
  const handleSubmit = async (shouldRedirect = true) => {
    // HARD LOCK: client-side guard (backend also enforces this)
    if (infoStatus === 'completed') {
      toast.error('Questionnaire is locked and cannot be modified.');
      return;
    }

    // First validate the form and highlight errors
    const isValid = validateForm();

    if (!selectedTemplate) {
      toast.error("Please select a WordPress website template.");
      return;
    }

    if (!isValid) {
      toast.error("Please fill in all required fields.");
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    try {
      // Prepare project update data
      const template = templates.find(t => t._id === selectedTemplate);
      const templateTitle = template?.title || '';

      const projectUpdateData = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        client: formData.client,
        category: formData.category,
        tags: formData.tags,
        selectedTemplateId: selectedTemplate,
        templateName: templateTitle,
        projectType: "wordpress",
        questionsStatus: 'in-progress'
      };

      // Update project first
      await updateProjectMutation.mutateAsync(projectUpdateData);

      // Prepare ALL questions data
      const allQuestions = [];
      let orderCounter = 1;

      // Preliminary Information
      addQuestion(allQuestions, 'caseWorkerName', 'Case worker', 'text', formData.caseWorkerName, 'preliminary', 'Preliminary Information', orderCounter++, false);
      addQuestion(allQuestions, 'caseWorkerLanguage', 'Language of case worker', 'text', formData.caseWorkerLanguage, 'preliminary', 'Preliminary Information', orderCounter++, false);
      addQuestion(allQuestions, 'communicationLanguage', 'Communication language', 'select', formData.communicationLanguage, 'preliminary', 'Preliminary Information', orderCounter++, false);

      // Add other questions (the rest of the addQuestion logic remains the same, I'll keep the ones from the inner block)
      addQuestion(allQuestions, 'companyName', 'Company Name', 'text', formData.companyName, 'business', 'Business Information', orderCounter++, true);
      addQuestion(allQuestions, 'legalForm', 'Legal Form', 'text', formData.legalForm, 'business', 'Business Information', orderCounter++, false);
      addQuestion(allQuestions, 'businessAddress', 'Business Address', 'textarea', formData.businessAddress, 'business', 'Business Information', orderCounter++, true);
      addQuestion(allQuestions, 'companyTelephone', 'Company Telephone', 'tel', formData.companyTelephone, 'business', 'Business Information', orderCounter++, true);
      addQuestion(allQuestions, 'companyEmail', 'Company Email Address', 'email', formData.companyEmail, 'business', 'Business Information', orderCounter++, true);
      addQuestion(allQuestions, 'companyDescription', 'Detailed Company Description', 'textarea', formData.companyDescription, 'business', 'Business Information', orderCounter++, false);
      addQuestion(allQuestions, 'briefCompanyDescription', 'Brief Company Description', 'textarea', formData.briefCompanyDescription, 'business', 'Business Information', orderCounter++, false);
      addQuestion(allQuestions, 'managingDirector', 'Managing Director', 'text', formData.managingDirector, 'legal', 'Company Legal & Background', orderCounter++, false);
      addQuestion(allQuestions, 'iceNumber', 'ICE Number', 'text', formData.iceNumber, 'legal', 'Company Legal & Background', orderCounter++, false);
      addQuestion(allQuestions, 'yearOfFoundation', 'Year of Foundation', 'number', formData.yearOfFoundation, 'legal', 'Company Legal & Background', orderCounter++, false);
      addQuestion(allQuestions, 'industry', 'Industry', 'text', formData.industry, 'business', 'Business Information', orderCounter++, false);
      addQuestion(allQuestions, 'servicesOffered', 'Services Offered', 'textarea', formData.servicesOffered, 'business', 'Business Information', orderCounter++, true);
      addQuestion(allQuestions, 'uniqueSellingPoints', 'What Makes You Unique?', 'textarea', formData.uniqueSellingPoints, 'business', 'Business Information', orderCounter++, false);
      addQuestion(allQuestions, 'callToAction', 'Call to Action', 'textarea', formData.callToAction, 'business', 'Business Information', orderCounter++, false);

      // Website Goals
      addQuestion(allQuestions, 'websitePurpose', 'Website Goals', 'textarea', formData.websitePurpose, 'goals', 'Website Goals & Target Audience', orderCounter++, false);
      addQuestion(allQuestions, 'targetCustomers', 'Target Audience', 'textarea', formData.targetCustomers, 'goals', 'Website Goals & Target Audience', orderCounter++, false);
      addQuestion(allQuestions, 'businessType', 'Business Type', 'select', formData.businessType, 'goals', 'Website Goals & Target Audience', orderCounter++, false);
      addQuestion(allQuestions, 'websiteObjective', 'Website Objective', 'textarea', formData.websiteObjective, 'goals', 'Website Goals & Target Audience', orderCounter++, false);

      // Market Analysis
      addQuestion(allQuestions, 'likedCompetitors', 'Competitors You Like', 'textarea', formData.likedCompetitors, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'marketSize', 'Market Size', 'text', formData.marketSize, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'marketGrowthRate', 'Market Growth Rate', 'text', formData.marketGrowthRate, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'marketShare', 'Market Share', 'text', formData.marketShare, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'differentiationCompetitors', 'Competitors to Differentiate From', 'textarea', formData.differentiationCompetitors, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'competitiveEnvironment', 'Competitive environment', 'textarea', formData.competitiveEnvironment, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'specialFeaturesCompared', 'Special features', 'textarea', formData.specialFeaturesCompared, 'market', 'Market Analysis', orderCounter++, false);
      addQuestion(allQuestions, 'contentRestrictions', 'Content Restrictions', 'textarea', formData.contentRestrictions, 'market', 'Market Analysis', orderCounter++, false);

      // Website Structure
      addQuestion(allQuestions, 'websitePages', 'Required Website Pages', 'checkbox', formData.websitePages, 'structure', 'Website Structure & Pages', orderCounter++, false);
      addQuestion(allQuestions, 'highlightedService', 'Service to Highlight', 'text', formData.highlightedService, 'structure', 'Website Structure & Pages', orderCounter++, false);
      addQuestion(allQuestions, 'lowPriorityServices', 'Services Not to Feature', 'textarea', formData.lowPriorityServices, 'structure', 'Website Structure & Pages', orderCounter++, false);
      addQuestion(allQuestions, 'mandatoryHomepageContent', 'Mandatory Homepage Content', 'textarea', formData.mandatoryHomepageContent, 'structure', 'Website Structure & Pages', orderCounter++, false);
      addQuestion(allQuestions, 'websiteLanguages', 'Website Languages', 'checkbox', formData.websiteLanguages, 'structure', 'Website Structure & Pages', orderCounter++, false);
      addQuestion(allQuestions, 'outputLanguages', 'Output languages', 'checkbox', formData.outputLanguages, 'structure', 'Website Structure & Pages', orderCounter++, false);

      // Revenue Streams
      addQuestion(allQuestions, 'revenueStreams', 'Revenue Streams', 'text', formData.revenueStreams, 'revenue', 'Revenue Streams', orderCounter++, false);
      addQuestion(allQuestions, 'subscriptionModel', 'Subscription Model', 'text', formData.subscriptionModel, 'revenue', 'Revenue Streams', orderCounter++, false);
      addQuestion(allQuestions, 'subscriptionFee', 'Subscription Fee', 'text', formData.subscriptionFee, 'revenue', 'Revenue Streams', orderCounter++, false);
      addQuestion(allQuestions, 'subscriptionDuration', 'Subscription Duration', 'text', formData.subscriptionDuration, 'revenue', 'Revenue Streams', orderCounter++, false);
      addQuestion(allQuestions, 'subscriptionFrequency', 'Subscription Frequency', 'text', formData.subscriptionFrequency, 'revenue', 'Revenue Streams', orderCounter++, false);

      // Social Media Strategy
      addQuestion(allQuestions, 'socialMediaStrategy', 'Social Media Strategy', 'textarea', formData.socialMediaStrategy, 'social', 'Social Media Strategy', orderCounter++, false);

      // Design Requirements
      addQuestion(allQuestions, 'logoAvailability', 'Logo availability', 'select', formData.logoAvailability, 'design', 'Design Requirements', orderCounter++, false);
      addQuestion(allQuestions, 'corporateDesignAvailability', 'Corporate design', 'select', formData.corporateDesignAvailability, 'design', 'Design Requirements', orderCounter++, false);
      addQuestion(allQuestions, 'imageAvailability', 'Images for website', 'select', formData.imageAvailability, 'design', 'Design Requirements', orderCounter++, false);

      if (formData.imageAvailability !== "No - Please use stock images") {
        addQuestion(allQuestions, 'imageNotes', 'Image Preferences', 'textarea', formData.imageNotes, 'design', 'Design Requirements', orderCounter++, false);
      }

      addQuestion(allQuestions, 'colorScheme', 'Brand Colors', 'text', formData.colorScheme, 'design', 'Design Requirements', orderCounter++, false);
      addQuestion(allQuestions, 'tonality', 'Design Style & Tone', 'checkbox', formData.tonality, 'design', 'Design Requirements', orderCounter++, false);

      // Template selection
      addQuestion(allQuestions, 'selectedTemplateId', 'Selected Template', 'select', selectedTemplate, 'template', 'Template Selection', orderCounter++, false);

      // Add all custom questions
      customQuestions.forEach((customQ) => {
        allQuestions.push({
          questionKey: customQ.questionKey,
          question: customQ.label,
          type: customQ.type,
          answer: customQ.answer || '',
          section: customQ.section || 'custom',
          sectionName: customQ.sectionName || 'Custom Fields',
          order: orderCounter++,
          isRequired: customQ.isRequired || false,
          projectType: 'wordpress',
          options: customQ.options || [],
          placeholder: customQ.placeholder || '',
          isCustom: true
        });
      });

      // Prepare payload for backend
      const questionsPayload = {
        questions: allQuestions,
        projectType: 'wordpress'
      };

      // Call the API to save questions
      const response = await createOrUpdateQuestions(projectId, questionsPayload);

      if (response.status === "success") {
        toast.success(response.message);

        if (setFormSubmitted) {
          setFormSubmitted(true);
        }

        // Refresh data after successful submission
        handleRefreshQuestions();

        // Redirect if needed
        if (shouldRedirect && session?.user?.role !== "superadmin") {
          router.push("/projects");
        }
      } else {
        throw new Error(response.message || 'Failed to save questions');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || "Failed to save questions. Please try again.");
      throw error; // Re-throw so callers can handle it
    }
  };

  // ─── Auto-save: builds payload and saves silently with 800ms debounce ───
  useEffect(() => {
    // Guards: skip if form not ready or questionnaire is locked
    if (!isInitialized || !hasLoadedQuestions || isLockedForEdit) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');

        // Build payload inline (mirrors handleSubmit logic)
        const allQuestions = [];
        let order = 1;
        const addQ = (key, question, type, answer, section, sectionName, required, opts = []) => {
          let ans = answer;
          if ((type === 'checkbox' || type === 'multiselect') && Array.isArray(answer)) {
            ans = answer.filter(i => i && i.trim() !== '').join(', ');
          } else if (ans === null || ans === undefined) ans = '';
          allQuestions.push({
            questionKey: key, question, type, answer: ans || '', section,
            sectionName, order: order++, isRequired: required || false, projectType: 'wordpress',
            options: opts, isCustom: false
          });
        };

        const f = formData;
        addQ('caseWorkerName', 'Case worker', 'text', f.caseWorkerName, 'preliminary', 'Preliminary Information', false);
        addQ('caseWorkerLanguage', 'Language of case worker', 'text', f.caseWorkerLanguage, 'preliminary', 'Preliminary Information', false);
        addQ('communicationLanguage', 'Communication language', 'select', f.communicationLanguage, 'preliminary', 'Preliminary Information', false);
        addQ('companyName', 'Company Name', 'text', f.companyName, 'business', 'Business Information', true);
        addQ('legalForm', 'Legal Form', 'text', f.legalForm, 'business', 'Business Information', false);
        addQ('businessAddress', 'Business Address', 'textarea', f.businessAddress, 'business', 'Business Information', true);
        addQ('companyTelephone', 'Company Telephone', 'tel', f.companyTelephone, 'business', 'Business Information', true);
        addQ('companyEmail', 'Company Email Address', 'email', f.companyEmail, 'business', 'Business Information', true);
        addQ('companyDescription', 'Detailed Company Description', 'textarea', f.companyDescription, 'business', 'Business Information', false);
        addQ('briefCompanyDescription', 'Brief Company Description', 'textarea', f.briefCompanyDescription, 'business', 'Business Information', false);
        addQ('managingDirector', 'Managing Director', 'text', f.managingDirector, 'legal', 'Company Legal & Background', false);
        addQ('iceNumber', 'ICE Number', 'text', f.iceNumber, 'legal', 'Company Legal & Background', false);
        addQ('yearOfFoundation', 'Year of Foundation', 'number', f.yearOfFoundation, 'legal', 'Company Legal & Background', false);
        addQ('industry', 'Industry', 'text', f.industry, 'business', 'Business Information', false);
        addQ('servicesOffered', 'Services Offered', 'textarea', f.servicesOffered, 'business', 'Business Information', true);
        addQ('uniqueSellingPoints', 'What Makes You Unique?', 'textarea', f.uniqueSellingPoints, 'business', 'Business Information', false);
        addQ('callToAction', 'Call to Action', 'textarea', f.callToAction, 'business', 'Business Information', false);
        addQ('websitePurpose', 'Website Goals', 'textarea', f.websitePurpose, 'goals', 'Website Goals & Target Audience', false);
        addQ('targetCustomers', 'Target Audience', 'textarea', f.targetCustomers, 'goals', 'Website Goals & Target Audience', false);
        addQ('businessType', 'Business Type', 'select', f.businessType, 'goals', 'Website Goals & Target Audience', false);
        addQ('websiteObjective', 'Website Objective', 'textarea', f.websiteObjective, 'goals', 'Website Goals & Target Audience', false);
        addQ('likedCompetitors', 'Competitors You Like', 'textarea', f.likedCompetitors, 'market', 'Market Analysis', false);
        addQ('marketSize', 'Market Size', 'text', f.marketSize, 'market', 'Market Analysis', false);
        addQ('marketGrowthRate', 'Market Growth Rate', 'text', f.marketGrowthRate, 'market', 'Market Analysis', false);
        addQ('marketShare', 'Market Share', 'text', f.marketShare, 'market', 'Market Analysis', false);
        addQ('differentiationCompetitors', 'Competitors to Differentiate From', 'textarea', f.differentiationCompetitors, 'market', 'Market Analysis', false);
        addQ('competitiveEnvironment', 'Competitive environment', 'textarea', f.competitiveEnvironment, 'market', 'Market Analysis', false);
        addQ('specialFeaturesCompared', 'Special features', 'textarea', f.specialFeaturesCompared, 'market', 'Market Analysis', false);
        addQ('contentRestrictions', 'Content Restrictions', 'textarea', f.contentRestrictions, 'market', 'Market Analysis', false);
        addQ('websitePages', 'Required Website Pages', 'checkbox', f.websitePages, 'structure', 'Website Structure & Pages', false);
        addQ('highlightedService', 'Service to Highlight', 'text', f.highlightedService, 'structure', 'Website Structure & Pages', false);
        addQ('lowPriorityServices', 'Services Not to Feature', 'textarea', f.lowPriorityServices, 'structure', 'Website Structure & Pages', false);
        addQ('mandatoryHomepageContent', 'Mandatory Homepage Content', 'textarea', f.mandatoryHomepageContent, 'structure', 'Website Structure & Pages', false);
        addQ('websiteLanguages', 'Website Languages', 'checkbox', f.websiteLanguages, 'structure', 'Website Structure & Pages', false);
        addQ('outputLanguages', 'Output languages', 'checkbox', f.outputLanguages, 'structure', 'Website Structure & Pages', false);
        addQ('revenueStreams', 'Revenue Streams', 'text', f.revenueStreams, 'revenue', 'Revenue Streams', false);
        addQ('subscriptionModel', 'Subscription Model', 'text', f.subscriptionModel, 'revenue', 'Revenue Streams', false);
        addQ('subscriptionFee', 'Subscription Fee', 'text', f.subscriptionFee, 'revenue', 'Revenue Streams', false);
        addQ('subscriptionDuration', 'Subscription Duration', 'text', f.subscriptionDuration, 'revenue', 'Revenue Streams', false);
        addQ('subscriptionFrequency', 'Subscription Frequency', 'text', f.subscriptionFrequency, 'revenue', 'Revenue Streams', false);
        addQ('socialMediaStrategy', 'Social Media Strategy', 'textarea', f.socialMediaStrategy, 'social', 'Social Media Strategy', false);
        addQ('logoAvailability', 'Logo availability', 'select', f.logoAvailability, 'design', 'Design Requirements', false);
        addQ('corporateDesignAvailability', 'Corporate design', 'select', f.corporateDesignAvailability, 'design', 'Design Requirements', false);
        addQ('imageAvailability', 'Images for website', 'select', f.imageAvailability, 'design', 'Design Requirements', false);
        if (f.imageAvailability !== 'No - Please use stock images') {
          addQ('imageNotes', 'Image Preferences', 'textarea', f.imageNotes, 'design', 'Design Requirements', false);
        }
        addQ('colorScheme', 'Brand Colors', 'text', f.colorScheme, 'design', 'Design Requirements', false);
        addQ('tonality', 'Design Style & Tone', 'checkbox', f.tonality, 'design', 'Design Requirements', false);
        allQuestions.push({
          questionKey: 'selectedTemplateId', question: 'Selected Template', type: 'select',
          answer: selectedTemplate || '', section: 'template', sectionName: 'Template Selection',
          order: order++, isRequired: false, projectType: 'wordpress', options: [], isCustom: false
        });
        customQuestions.forEach(cq => {
          allQuestions.push({
            questionKey: cq.questionKey, question: cq.label, type: cq.type,
            answer: cq.answer || '', section: cq.section || 'custom', sectionName: cq.sectionName || 'Custom Fields',
            order: order++, isRequired: cq.isRequired || false, projectType: 'wordpress',
            options: cq.options || [], placeholder: cq.placeholder || '', isCustom: true
          });
        });

        await createOrUpdateQuestions(projectId, { questions: allQuestions, projectType: 'wordpress' });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 4000);
      }
    }, 800); // 800ms debounce

    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, customQuestions, selectedTemplate, isInitialized, hasLoadedQuestions, isLockedForEdit, projectId]);

  // Helper function to add a question to the array
  const addQuestion = (questionsArray, questionKey, question, type, answer, section, sectionName, order, isRequired, options = []) => {
    let processedAnswer = answer;

    // Handle array answers for checkbox/multiselect types
    if ((type === 'checkbox' || type === 'multiselect') && Array.isArray(answer)) {
      processedAnswer = answer.filter(item => item && item.trim() !== '').join(', ');
    } else if (answer === null || answer === undefined) {
      processedAnswer = '';
    }

    questionsArray.push({
      questionKey,
      question,
      type,
      answer: processedAnswer || '',
      section,
      sectionName,
      order,
      isRequired: isRequired || false,
      projectType: 'wordpress',
      options,
      isCustom: false
    });
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    requiredFields.forEach(field => {
      let value;
      const keys = field.split('.');

      if (keys.length === 1) {
        value = formData[field];
      } else if (keys.length === 2) {
        value = formData[keys[0]]?.[keys[1]];
      } else if (keys.length === 3) {
        value = formData[keys[0]]?.[keys[1]]?.[keys[2]];
      }

      if (!value || value.toString().trim() === "") {
        errors[field] = "This field is required";
        isValid = false;
      }
    });

    // Validate custom required fields
    customQuestions.forEach((q, index) => {
      if (q.isRequired && (!q.answer || q.answer.toString().trim() === "")) {
        errors[`custom_${index}`] = `${q.label} is required`;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // Loading state
  const isLoading = isLoadingProject || isLoadingQuestions || isRefreshing;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!projectData && !isLoading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Project</h3>
        <p className="text-red-700 mb-4">Failed to load project data. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Questionnaire</h2>
          <p className="text-gray-600">
            Fill out the project questionnaire
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Auto-save status pill */}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 select-none">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100 select-none">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100 select-none">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Save failed
            </span>
          )}

          <button
            onClick={handleRefreshQuestions}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
            disabled={isLoading}
          >
            {isRefreshing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Questions
              </>
            )}
          </button>

          {/* {questionsResponse?.data?.statistics && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {questionsResponse.data.statistics.answered || 0} / {questionsResponse.data.statistics.total || 0} answered
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${questionsResponse.data.statistics.completionPercentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {questionsResponse.data.statistics.completionPercentage || 0}%
              </span>
            </div>
          )} */}
        </div>
      </div>

      {/* Debug info - remove in production */}
      {/* <div className="bg-gray-50 p-4 rounded-lg text-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${hasLoadedQuestions ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span>Questions Loaded: {hasLoadedQuestions ? 'Yes' : 'No'}</span>
          </div>
          <div>Questions Count: {questionsResponse?.data?.questions?.length || 0}</div>
          <div>Template Selected: {selectedTemplate ? 'Yes' : 'No'}</div>
          <div>Form Initialized: {isInitialized ? 'Yes' : 'No'}</div>
        </div>
      </div> */}

      {/* Render all sections */}
      <PreliminaryInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      {/* <BasicProjectInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      /> */}

      {/* <ClientInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      /> */}

      <ProjectDetails
        formData={formData}
        handleInputChange={handleInputChange}
        newTag={newTag}
        setNewTag={setNewTag}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        handleTagKeyPress={handleTagKeyPress}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <BusinessInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <CompanyLegalInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <WebsiteGoalsInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <MarketAnalysisInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <WebsiteStructureInfo
        formData={formData}
        handleInputChange={handleInputChange}
        handleLanguageToggle={handleLanguageToggle}
        handleWebsitePagesToggle={handleWebsitePagesToggle}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <DesignRequirementsInfo
        formData={formData}
        handleInputChange={handleInputChange}
        handleTonalityToggle={handleTonalityToggle}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
        projectId={projectId}
      />

      <RevenueStreamsInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <SocialMediaStrategyInfo
        formData={formData}
        handleInputChange={handleInputChange}
        validationErrors={validationErrors}
        requiredFields={requiredFields}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <TemplateSelection
        templates={templates}
        selectedTemplate={selectedTemplate}
        handleTemplateSelect={handleTemplateSelect}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <CustomFields
        customQuestions={customQuestions}
        setCustomQuestions={setCustomQuestions}
        showAddCustomField={showAddCustomField}
        setShowAddCustomField={setShowAddCustomField}
        newCustomField={newCustomField}
        setNewCustomField={setNewCustomField}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <AIWorkInstructions
        formData={formData}
        handleInputChange={handleInputChange}
        disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
      />

      <SubmitSection
        formData={formData}
        selectedTemplate={selectedTemplate}
        customQuestions={customQuestions}
        requiredFields={requiredFields}
        getCompletionPercentage={getCompletionPercentage}
        getOverallCompletionPercentage={getOverallCompletionPercentage}
        areAllRequiredFieldsFilled={areAllRequiredFieldsFilled}
        handleSubmit={handleSubmit}
        updateProjectMutation={updateProjectMutation}
        isLoading={isLoading}
        infoStatus={infoStatus}
        isLockedForEdit={isLockedForEdit}
        isInfoDept={isInfoDept}
        isSuperAdmin={isSuperAdmin}
        projectId={projectId}
      />

    </div>
  );
};

export default QuestionsTab;