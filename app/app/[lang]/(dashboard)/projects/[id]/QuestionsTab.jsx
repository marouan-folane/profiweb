"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  createOrUpdateQuestions,
  getQuestionsForProject,
  updateProject,
  getProject,
  completeInfoQuestionnaire,
  toggleQuestionVisibility,
  updateQuestionMeta,
} from "@/config/functions/project";
import { getFolders } from "@/config/functions/folder";
import { getAllTemplates } from "@/config/functions/template";
import { api } from "@/config/axios.config";
import toast from 'react-hot-toast';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Icon } from "@iconify/react";

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
import DynamicSection from "./components/DynamicSection.jsx";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"

const QuestionsTab = ({ setFormSubmitted }) => {
  // ─── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeDragItem, setActiveDragItem] = useState(null);
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
    contactName: "",
    whatsappNumber: "",

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

  const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    if (!path.includes('.')) return obj[path];
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // React Query for fetching templates
  const { data: templateRes } = useQuery({
    queryFn: () => getAllTemplates(),
    staleTime: 1000 * 60 * 5,
  });

  // React Query for fetching folders
  const { data: foldersRes } = useQuery({
    queryKey: ['folders', projectId],
    queryFn: () => getFolders(projectId),
    enabled: !!projectId && projectId !== 'undefined',
    staleTime: 1000 * 60 * 5,
  });

  // React Query for fetching project data
  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId && projectId !== 'undefined',
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
    enabled: !!projectId && projectId !== 'undefined',
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

  // ─── Dynamic sections state (from API, with visibility metadata) ───────────
  // Mirrors questionsResponse.data.sections but allows optimistic UI updates
  const [dynamicSections, setDynamicSections] = useState([]);

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
            isCustom: true,
            isVisible: q.isVisible !== false,
            isSectionVisible: q.isSectionVisible !== false,
            translations: q.translations || {},
          });
        } else {
          // Update existing custom question with new answer
          const updatedCustomQuestions = customQuestions.map(cq =>
            cq.questionKey === q.questionKey ? {
              ...cq,
              answer: q.answer || "",
              isVisible: q.isVisible !== false,
              isSectionVisible: q.isSectionVisible !== false,
              translations: q.translations || cq.translations || {}
            } : cq
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
    const templateQuestion = questions.find(q =>
      q.questionKey === 'selectedTemplateId' ||
      (q.question && q.question.toLowerCase().includes('selected template'))
    );

    if (templateQuestion?.answer) {
      const templateVal = templateQuestion.answer;
      const template = templates.find(t => t._id === templateVal || t.title === templateVal);

      if (template) {
        setSelectedTemplate(template._id);
        updatedFormData.selectedTemplateId = template._id;
        updatedFormData.templateName = template.title;
      } else if (templateVal && templateVal.match(/^[0-9a-fA-F]{24}$/)) {
        // If it's an ID but template list is pending, keep the ID as selected
        setSelectedTemplate(templateVal);
        updatedFormData.selectedTemplateId = templateVal;
      } else if (templateVal) {
        // If it's a title but template list is pending
        updatedFormData.templateName = templateVal;
      }
    }

    // ─── Fallback: Check project record ───
    if (!updatedFormData.templateName && projectData?.data?.project?.templateName) {
      updatedFormData.templateName = projectData.data.project.templateName;
    }
    if (!updatedFormData.selectedTemplateId && projectData?.data?.project?.selectedTemplate) {
      const tId = projectData.data.project.selectedTemplate;
      if (typeof tId === 'string' && tId.match(/^[0-9a-fA-F]{24}$/)) {
        updatedFormData.selectedTemplateId = tId;
        setSelectedTemplate(tId);
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

  // ── Fetch global question templates to fill in missing sections ──────────
  const { data: globalTemplatesRes } = useQuery({
    queryKey: ['question-templates-global'],
    queryFn: () => api.get('/question-templates').then(r => r.data),
    staleTime: 1000 * 60 * 10,
  });

  // Sync dynamic sections whenever questionsResponse OR global templates change
  useEffect(() => {
    if (questionsResponse?.data?.sections) {
      let sections = [...questionsResponse.data.sections];

      // 1. Ensure "Preliminary Information" section exists at the top
      let preliSection = sections.find(s => s.section === 'preliminary' || s.sectionName === 'Preliminary Information');
      if (!preliSection) {
        preliSection = {
          section: 'preliminary',
          sectionName: 'Preliminary Information',
          questions: []
        };
        sections.unshift(preliSection);
      }

      // 2. Ensure essential fields exist in Preliminary Information
      const essentialFields = [
        { questionKey: 'caseWorkerName', question: 'Case Worker', type: 'text' },
        { questionKey: 'caseWorkerLanguage', question: 'Language of Case Worker', type: 'text' },
        { questionKey: 'contactName', question: 'Contact Name', type: 'text' },
        { questionKey: 'whatsappNumber', question: 'Numéro WhatsApp', type: 'tel' }
      ];

      essentialFields.forEach(fieldDef => {
        const existing = preliSection.questions.find(q => q.questionKey === fieldDef.questionKey);
        if (!existing) {
          preliSection.questions.push({
            ...fieldDef,
            answer: formData[fieldDef.questionKey] || '',
            section: preliSection.section,
            sectionName: preliSection.sectionName,
            status: 'pending',
            isCustom: false,
            isVisible: true,
            isSectionVisible: true,
            order: 0,
            translations: {}
          });
        }
      });

      // 3. Update answers from current formData if they were just added
      preliSection.questions.forEach(q => {
        if (essentialFields.some(f => f.questionKey === q.questionKey)) {
          q.answer = formData[q.questionKey] || q.answer || '';
        }
      });

      // 4. ── Merge ALL global template sections that are missing from this project ──
      // This ensures every admin-defined section is visible even on older projects
      const globalTemplates = globalTemplatesRes?.data?.templates || [];
      if (globalTemplates.length > 0) {
        // Build a map of all global sections
        const globalSectionMap = new Map();
        globalTemplates.forEach(tpl => {
          const sid = tpl.section;
          if (!globalSectionMap.has(sid)) {
            globalSectionMap.set(sid, {
              section: sid,
              sectionName: tpl.sectionName || sid,
              questions: []
            });
          }
          globalSectionMap.get(sid).questions.push(tpl);
        });

        // Build set of question keys already in the project sections
        const existingKeys = new Set(sections.flatMap(s => s.questions.map(q => q.questionKey)));

        // For each global section, either add missing questions or add the whole section
        globalSectionMap.forEach((globalSec, sid) => {
          // Skip template/template_selection sections (handled separately)
          if (sid === 'template' || sid === 'template_selection') return;

          const existingSec = sections.find(s => s.section === sid);
          if (existingSec) {
            // Section exists — add any global questions not yet in the project
            globalSec.questions.forEach(gq => {
              if (!existingKeys.has(gq.questionKey)) {
                existingSec.questions.push({
                  questionKey: gq.questionKey,
                  question: gq.question,
                  type: gq.type || 'text',
                  placeholder: gq.placeholder || '',
                  options: gq.options || [],
                  isRequired: gq.isRequired || false,
                  isVisible: gq.isVisible !== false,
                  isSectionVisible: true,
                  section: sid,
                  sectionName: existingSec.sectionName,
                  answer: '',
                  isCustom: false,
                  status: 'pending',
                  translations: gq.translations || {},
                });
                existingKeys.add(gq.questionKey);
              }
            });
          } else {
            // Section entirely missing — add it with all its global questions
            const newSec = {
              section: sid,
              sectionName: globalSec.sectionName,
              questions: globalSec.questions.map(gq => ({
                questionKey: gq.questionKey,
                question: gq.question,
                type: gq.type || 'text',
                placeholder: gq.placeholder || '',
                options: gq.options || [],
                isRequired: gq.isRequired || false,
                isVisible: gq.isVisible !== false,
                isSectionVisible: true,
                section: sid,
                sectionName: globalSec.sectionName,
                answer: '',
                isCustom: false,
                status: 'pending',
                translations: gq.translations || {},
              }))
            };
            sections.push(newSec);
          }
        });
      }

      setDynamicSections(sections);
    } else if (isInitialized) {
      // ─── CRITICAL: Immediate visibility for Preliminary Info if API response is still pending ───
      const essentialFields = [
        { questionKey: 'caseWorkerName', question: 'Case Worker', type: 'text' },
        { questionKey: 'caseWorkerLanguage', question: 'Language of Case Worker', type: 'text' },
        { questionKey: 'contactName', question: 'Contact Name', type: 'text' },
        { questionKey: 'whatsappNumber', question: 'Numéro WhatsApp', type: 'tel' }
      ];

      const baselinePreliSection = {
        section: 'preliminary',
        sectionName: 'Preliminary Information',
        questions: essentialFields.map(f => ({
          ...f,
          answer: formData[f.questionKey] || '',
          section: 'preliminary',
          sectionName: 'Preliminary Information',
          status: 'pending',
          isCustom: false,
          isVisible: true,
          isSectionVisible: true,
          order: 0
        }))
      };
      setDynamicSections([baselinePreliSection]);
    }
  }, [questionsResponse, globalTemplatesRes, isInitialized, formData.caseWorkerName, formData.contactName, formData.whatsappNumber, formData.caseWorkerLanguage]);


  // Load questions data when it's available
  useEffect(() => {
    if (questionsResponse?.data?.questions && !hasLoadedQuestions) {
      // console.log("Questions loaded from API:", questionsResponse.data.questions);
      populateFormFromQuestions(questionsResponse.data.questions);
    }
  }, [questionsResponse, populateFormFromQuestions, hasLoadedQuestions]);

  const infoStatus = projectData?.data?.infoStatus || 'pending';
  const isInfoCompleted = infoStatus === 'completed';
  const userRole = session?.user?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = ['superadmin', 'admin', 'manager'].includes(userRole);
  const isInfoDept = userRole === 'd.i' || userRole === 'd.inf';
  const isSalesDept = userRole === 'd.s';

  // canSeeHidden: Roles that can see greyed-out "hidden" fields
  const canSeeHidden = isAdmin; // Restricted to admins only so other roles don't see them at all

  // HARD LOCK: once questionnaire is completed, everyone is locked out of editing
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

  // ─── Admin: Toggle visibility (section or question) ───────────────────────────
  const handleToggleVisibility = useCallback(async (payload) => {
    // payload: { section, isVisible } OR { questionKey, isVisible }
    const { section, questionKey, isVisible } = payload;

    // Optimistic UI update on dynamicSections
    setDynamicSections((prev) =>
      prev.map((sec) => {
        if (section && sec.section === section) {
          // Toggle all questions' isSectionVisible in this section
          return {
            ...sec,
            questions: sec.questions.map((q) => ({ ...q, isSectionVisible: isVisible })),
          };
        }
        if (questionKey) {
          return {
            ...sec,
            questions: sec.questions.map((q) =>
              q.questionKey === questionKey ? { ...q, isVisible } : q
            ),
          };
        }
        return sec;
      })
    );

    // Persist to backend
    try {
      await toggleQuestionVisibility(projectId, payload);
      toast.success('Visibility updated.');
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
    } catch (err) {
      toast.error('Failed to update visibility. Please try again.');
      // Revert: re-fetch from server
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
    }
  }, [projectId, queryClient]);

  // ─── Admin: Add a custom field to a specific section ──────────────────────
  const handleAddCustomField = useCallback((sectionId, newFieldDef) => {
    // 1. Add to customQuestions so auto-save picks it up
    setCustomQuestions((prev) => [
      ...prev,
      {
        questionKey: newFieldDef.questionKey,
        label: newFieldDef.question,
        type: newFieldDef.type,
        placeholder: newFieldDef.placeholder || '',
        isRequired: newFieldDef.isRequired || false,
        section: newFieldDef.section,
        sectionName: newFieldDef.sectionName,
        options: newFieldDef.options || [],
        answer: '',
        isCustom: true,
        translations: newFieldDef.translations || {},
      },
    ]);

    // 2. Optimistically add to the correct dynamicSection for immediate display
    setDynamicSections((prev) =>
      prev.map((sec) =>
        sec.section === sectionId
          ? { ...sec, questions: [...sec.questions, { ...newFieldDef, answer: '' }] }
          : sec
      )
    );

    toast.success(`Custom field “${newFieldDef.question}” added — will be saved automatically.`);
  }, []);

  // ─── Admin: Edit question metadata (label / placeholder / isRequired) ────────
  // patch = { label, placeholder, isRequired }
  const handleEditSave = useCallback(async (questionKey, patch) => {
    // 1. Optimistic update in dynamicSections so UI reflects change instantly
    setDynamicSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) =>
          q.questionKey === questionKey
            ? {
              ...q,
              ...(patch.label !== undefined && { question: patch.label }),
              ...(patch.placeholder !== undefined && { placeholder: patch.placeholder }),
              ...(patch.isRequired !== undefined && { isRequired: patch.isRequired }),
              ...(patch.translations !== undefined && { translations: patch.translations }),
            }
            : q
        ),
      }))
    );

    // 2. Persist to backend
    try {
      await updateQuestionMeta(projectId, questionKey, patch);
      toast.success(`Field updated.`);
    } catch (err) {
      toast.error('Failed to save field changes.');
      // Revert
      queryClient.invalidateQueries({ queryKey: ['questions', projectId] });
    }
  }, [projectId, queryClient]);

  // ─── Admin: Delete a field (Global sync) ──────────────────────────────────
  const handleDeleteField = useCallback(async (questionKey) => {
    if (!confirm(`Are you sure you want to delete this field? It will be removed from the GLOBAL registry and all projects.`)) {
      return;
    }

    // 1. Optimistic UI removal
    setDynamicSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        questions: sec.questions.filter((q) => q.questionKey !== questionKey),
      }))
    );

    // Also remove from customQuestions if present
    setCustomQuestions((prev) => prev.filter(q => q.questionKey !== questionKey));

    // 2. Persist to backend
    try {
      await api.delete(`/question-templates/${questionKey}`);
      toast.success("Field deleted globally.");
      // Refresh to ensure everything is in sync
      queryClient.invalidateQueries({ queryKey: ["questions", projectId] });
    } catch (err) {
      toast.error("Failed to delete field.");
      queryClient.invalidateQueries({ queryKey: ["questions", projectId] });
    }
  }, [projectId, queryClient]);

  // ─── Visibility Lookup Helper ──────────────────────────────────────────────
  const getVisibilityForKey = useCallback((key) => {
    if (!dynamicSections || dynamicSections.length === 0) {
      return { isVisible: true, isSectionVisible: true };
    }
    for (const sec of dynamicSections) {
      const q = sec.questions.find(item => item.questionKey === key);
      if (q) {
        return {
          isVisible: q.isVisible !== false,
          isSectionVisible: q.isSectionVisible !== false
        };
      }
    }
    return { isVisible: true, isSectionVisible: true };
  }, [dynamicSections]);

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
  const handleSubmit = async (shouldRedirect = true, skipValidation = false) => {
    // HARD LOCK: client-side guard (backend also enforces this)
    if (infoStatus === 'completed') {
      toast.error('Questionnaire is locked and cannot be modified.');
      return;
    }

    // First validate the form and highlight errors if NOT skipping validation
    if (!skipValidation) {
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

      // Prepare ALL questions data dynamically from current sections
      const allQuestions = [];
      let orderCounter = 1;

      dynamicSections.forEach(section => {
        section.questions.forEach(q => {
          // Get current answer from formData
          const value = getNestedValue(formData, q.questionKey);
          let processedAnswer = value;

          if ((q.type === 'checkbox' || q.type === 'multiselect') && Array.isArray(value)) {
            processedAnswer = value.filter(item => item && item.trim() !== '').join(', ');
          } else if (value === null || value === undefined) {
            processedAnswer = q.answer || '';
          }

          allQuestions.push({
            ...q,
            answer: processedAnswer,
            order: orderCounter++
          });
        });
      });

      // ─── Manually Add Preliminary Information Fields ───
      const preliminaryFields = [
        { key: 'caseWorkerName', label: 'Case Worker', type: 'text' },
        { key: 'caseWorkerLanguage', label: 'Language of Case Worker', type: 'text' },
        { key: 'contactName', label: 'Contact Name', type: 'text' },
        { key: 'whatsappNumber', label: 'Numéro WhatsApp', type: 'text' }
      ];

      preliminaryFields.forEach(field => {
        if (!allQuestions.find(q => q.questionKey === field.key)) {
          allQuestions.push({
            questionKey: field.key,
            question: field.label,
            type: field.type,
            answer: formData[field.key] || '',
            section: 'preliminary',
            sectionName: 'Preliminary Information',
            order: orderCounter++,
            isRequired: false,
            projectType: 'wordpress'
          });
        }
      });

      // Template selection tracking (if not already in sections)
      if (!allQuestions.find(q => q.questionKey === 'selectedTemplateId')) {
        allQuestions.push({
          questionKey: 'selectedTemplateId',
          question: 'Selected Template',
          type: 'select',
          answer: selectedTemplate || '',
          section: 'template',
          sectionName: 'Template Selection',
          order: orderCounter++,
          isRequired: false,
          projectType: 'wordpress',
          options: [],
          isCustom: false,
          isVisible: true,
          isSectionVisible: true
        });
      }

      // Prepare payload for backend
      const questionsPayload = {
        questions: allQuestions,
        projectType: 'wordpress',
        generatePDFs: !skipValidation
      };

      // Call the API to save questions
      const response = await createOrUpdateQuestions(projectId, questionsPayload);

      if (response.status === "success") {
        if (!skipValidation) {
          toast.success(response.message);
        } else {
          toast.success("Draft saved successfully");
        }

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

  const handleSaveDraft = async () => {
    try {
      await handleSubmit(false, true);
    } catch (error) {
      // Error already handled in handleSubmit
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

        // DYNAMIC PAYLOAD BUILDING
        const allQuestions = [];
        let orderCounter = 1;

        dynamicSections.forEach(section => {
          section.questions.forEach(q => {
            const value = getNestedValue(formData, q.questionKey);
            let processedAnswer = value;

            if ((q.type === 'checkbox' || q.type === 'multiselect') && Array.isArray(value)) {
              processedAnswer = value.filter(item => item && item.trim() !== '').join(', ');
            } else if (value === null || value === undefined) {
              processedAnswer = q.answer || '';
            }

            allQuestions.push({
              ...q,
              answer: processedAnswer,
              order: orderCounter++
            });
          });
        });

        // ─── Manually Add Preliminary Information Fields (Auto-save) ───
        const preliminaryFields = [
          { key: 'caseWorkerName', label: 'Case Worker', type: 'text' },
          { key: 'caseWorkerLanguage', label: 'Language of Case Worker', type: 'text' },
          { key: 'contactName', label: 'Contact Name', type: 'text' },
          { key: 'whatsappNumber', label: 'Numéro WhatsApp', type: 'text' }
        ];

        preliminaryFields.forEach(field => {
          if (!allQuestions.find(q => q.questionKey === field.key)) {
            allQuestions.push({
              questionKey: field.key,
              question: field.label,
              type: field.type,
              answer: formData[field.key] || '',
              section: 'preliminary',
              sectionName: 'Preliminary Information',
              order: orderCounter++,
              isRequired: false,
              projectType: 'wordpress'
            });
          }
        });

        if (!allQuestions.find(q => q.questionKey === 'selectedTemplateId')) {
          allQuestions.push({
            questionKey: 'selectedTemplateId',
            question: 'Selected Template',
            type: 'select',
            answer: selectedTemplate || '',
            section: 'template_selection',
            sectionName: 'Template Selection',
            order: orderCounter++,
            isRequired: false,
            projectType: 'wordpress',
            options: [],
            isCustom: false,
            isVisible: true,
            isSectionVisible: true
          });
        }

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
  }, [formData, customQuestions, dynamicSections, selectedTemplate, isInitialized, hasLoadedQuestions, isLockedForEdit, projectId, getVisibilityForKey]);

  // Helper function to add a question to the array
  const addQuestion = (questionsArray, questionKey, question, type, answer, section, sectionName, order, isRequired, options = [], isCustom = false) => {
    let processedAnswer = answer;

    // Handle array answers for checkbox/multiselect types
    if ((type === 'checkbox' || type === 'multiselect') && Array.isArray(answer)) {
      processedAnswer = answer.filter(item => item && item.trim() !== '').join(', ');
    } else if (answer === null || answer === undefined) {
      processedAnswer = '';
    }

    // Lookup current visibility from state
    const visibility = getVisibilityForKey(questionKey);

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
      isCustom: isCustom,
      isVisible: visibility.isVisible,
      isSectionVisible: visibility.isSectionVisible
    });
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Dynamic validation based on currently visible dynamic fields
    const activeRequiredFields = dynamicSections.flatMap(s =>
      s.questions.filter(q => q.isRequired && q.isVisible !== false && q.isSectionVisible !== false).map(q => q.questionKey)
    );

    activeRequiredFields.forEach(field => {
      let value = getNestedValue(formData, field);

      if (!value || value.toString().trim() === "") {
        errors[field] = "This field is required";
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading project questionnaire...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!projectData && !isLoading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 md:p-8 text-center max-w-lg mx-auto my-8">
        <div className="text-red-500 mb-4 flex justify-center">
          <Icon icon="lucide:alert-circle" className="w-12 h-12" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-red-900 mb-2">Error Loading Project</h3>
        <p className="text-red-700 mb-6">Failed to load project data. Please try again or contact support.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200 font-bold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Project Questionnaire</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
            {(formData.templateName || projectData?.data?.project?.templateName) && (
              <div className="text-indigo-600 font-bold italic text-xs md:text-sm flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg">
                <Icon icon="lucide:layout" className="w-3.5 h-3.5" />
                Template: {formData.templateName || projectData.data.project.templateName}
              </div>
            )}
            <p className="text-gray-500 text-xs md:text-sm">
              {(formData.templateName || projectData?.data?.project?.templateName) ? "Detailed configurations for the selected template" : "Fill out the project questionnaire to get started"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

          {/* Auto-save status pill */}
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 select-none">
              <Icon icon="lucide:loader-2" className="animate-spin h-3.5 w-3.5" />
              Saving Progress…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-600 border border-green-100 select-none">
              <Icon icon="lucide:check-circle" className="h-3.5 w-3.5" />
              Progress Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 select-none">
              <Icon icon="lucide:alert-circle" className="h-3.5 w-3.5" />
              Save failed
            </span>
          )}

          <button
            onClick={handleRefreshQuestions}
            className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 text-sm font-semibold w-full sm:w-auto"
            disabled={isLoading}
          >
            {isRefreshing ? (
              <>
                <Icon icon="lucide:loader-2" className="animate-spin h-4 w-4 text-gray-500" />
                Refreshing...
              </>
            ) : (
              <>
                <Icon icon="lucide:refresh-cw" className="w-4 h-4 text-gray-500" />
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

      {/* ── Main Questionnaire Content (Hidden for Sales) ─────────────────────────── */}
      {isSalesDept ? (
        <div className="bg-white rounded-2xl border border-blue-100 p-8 md:p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500 shadow-inner">
            <Icon icon="lucide:user-check" className="w-10 h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 tracking-tight">Project Successfully Created</h2>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed text-sm md:text-base">
            As a member of the Sales Department, you have successfully created this project.
            The detailed configuration questionnaire is now managed by the <span className="text-indigo-600 font-bold">Information Department</span>.
          </p>
        </div>
      ) : (
        <>
          {/* ── Dynamic / Static section rendering with drag-and-drop ────── */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => {
              // Find the dragged question across all sections
              let found = null;
              for (const sec of dynamicSections) {
                const q = sec.questions.find(q => q.questionKey === active.id);
                if (q) { found = q; break; }
              }
              setActiveDragItem(found);
            }}
            onDragEnd={({ active, over }) => {
              setActiveDragItem(null);
              if (!active || !over) return;

              const activeKey = active.id;
              const overId = over.id; // could be a questionKey OR a section-drop-<sectionId>

              // Find source section
              let sourceSectionId = null;
              let sourceQuestion = null;
              for (const sec of dynamicSections) {
                const q = sec.questions.find(q => q.questionKey === activeKey);
                if (q) { sourceSectionId = sec.section; sourceQuestion = q; break; }
              }
              if (!sourceSectionId || !sourceQuestion) return;

              // Determine target section
              let targetSectionId = null;
              if (String(overId).startsWith('section-drop-')) {
                // Dropped on the section droppable area
                targetSectionId = String(overId).replace('section-drop-', '');
              } else {
                // Dropped on another question — find which section it belongs to
                for (const sec of dynamicSections) {
                  if (sec.questions.find(q => q.questionKey === overId)) {
                    targetSectionId = sec.section;
                    break;
                  }
                }
              }
              if (!targetSectionId) return;

              setDynamicSections(prev => {
                let updated = prev.map(sec => ({ ...sec, questions: [...sec.questions] }));

                if (sourceSectionId === targetSectionId) {
                  // ── Reorder within same section ──
                  const secIdx = updated.findIndex(s => s.section === sourceSectionId);
                  if (secIdx === -1) return prev;
                  const qs = updated[secIdx].questions;
                  const oldIdx = qs.findIndex(q => q.questionKey === activeKey);
                  const newIdx = qs.findIndex(q => q.questionKey === overId);
                  if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev;
                  updated[secIdx].questions = arrayMove(qs, oldIdx, newIdx);
                } else {
                  // ── Move between sections ──
                  const srcIdx = updated.findIndex(s => s.section === sourceSectionId);
                  const tgtIdx = updated.findIndex(s => s.section === targetSectionId);
                  if (srcIdx === -1 || tgtIdx === -1) return prev;

                  // Remove from source
                  updated[srcIdx].questions = updated[srcIdx].questions.filter(
                    q => q.questionKey !== activeKey
                  );

                  // Update the question's section metadata
                  const movedQ = {
                    ...sourceQuestion,
                    section: updated[tgtIdx].section,
                    sectionName: updated[tgtIdx].sectionName,
                  };

                  // Insert into target: before the 'over' question if possible
                  const overQIdx = updated[tgtIdx].questions.findIndex(q => q.questionKey === overId);
                  if (overQIdx >= 0) {
                    updated[tgtIdx].questions.splice(overQIdx, 0, movedQ);
                  } else {
                    updated[tgtIdx].questions.push(movedQ);
                  }

                  toast.success(`Moved "${sourceQuestion.question}" → ${updated[tgtIdx].sectionName}`);
                }

                return updated;
              });
            }}
            onDragCancel={() => setActiveDragItem(null)}
          >
            {dynamicSections
              .filter(section => section.section !== 'template' && section.section !== 'template_selection')
              .map((section) => (
                <DynamicSection
                  key={section.section}
                  section={section}
                  formValues={formData}
                  onFieldChange={handleInputChange}
                  onToggleSection={
                    isAdmin
                      ? (sectionId, isVisible) =>
                        handleToggleVisibility({ section: sectionId, isVisible })
                      : undefined
                  }
                  onToggleField={
                    isAdmin
                      ? (questionKey, isVisible) =>
                        handleToggleVisibility({ questionKey, isVisible })
                      : undefined
                  }
                  onAddCustomField={isAdmin ? handleAddCustomField : undefined}
                  onEditSave={isAdmin ? handleEditSave : undefined}
                  onDelete={isAdmin ? handleDeleteField : undefined}
                  isAdmin={isAdmin}
                  canSeeHidden={canSeeHidden}
                  disabled={updateProjectMutation.isPending || isLoading || isLockedForEdit}
                  validationErrors={validationErrors}
                />
              ))}

            {/* ── DragOverlay: floating preview while dragging ── */}
            <DragOverlay>
              {activeDragItem ? (
                <div className="bg-white border-2 border-primary rounded-xl px-4 py-3 shadow-2xl opacity-95 max-w-sm">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:grip-vertical" className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-gray-800 truncate">{activeDragItem.question}</p>
                  </div>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5 ml-6">{activeDragItem.questionKey}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <TemplateSelection
            templates={templates}
            selectedTemplate={selectedTemplate}
            handleTemplateSelect={handleTemplateSelect}
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
            handleSaveDraft={handleSaveDraft}
            updateProjectMutation={updateProjectMutation}
            isLoading={isLoading}
            infoStatus={infoStatus}
            isLockedForEdit={isLockedForEdit}
            isInfoDept={isInfoDept}
            isSuperAdmin={isSuperAdmin}
            projectId={projectId}
          />
        </>
      )}
    </div>
  );
};

export default QuestionsTab;