// app/[lang]/(dashboard)/projects/[id]/overview/QuestionsTab.jsx
"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateProject } from "@/config/functions/project";
import { 
  getProjectQuestions, 
  initializeQuestions,
  updateAnswers,
  getQuestionsProgress 
} from "@/config/functions/questions";
import { useToast } from "@/components/ui/use-toast";
import QuestionRenderer from "@/components/questions/QuestionRenderer";
import TemplateSelector from "@/components/questions/TemplateSelector";

const QuestionsTab = ({ setFormSubmitted }) => {
  const params = useParams();
  const projectId = params.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for template selection
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [answers, setAnswers] = useState({});

  // Fetch questions
  const { 
    data: questionsData, 
    isLoading, 
    error,
    refetch: refetchQuestions 
  } = useQuery({
    queryKey: ['questions', projectId],
    queryFn: () => getProjectQuestions(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch progress
  const { 
    data: progressData,
    refetch: refetchProgress 
  } = useQuery({
    queryKey: ['questions-progress', projectId],
    queryFn: () => getQuestionsProgress(projectId),
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2,
  });

  // Initialize questions if not exists
  useEffect(() => {
    if (projectId && questionsData?.data?.sections?.length === 0 && !isLoading) {
      initializeQuestions(projectId)
        .then(() => {
          refetchQuestions();
          toast({
            title: "Questions Initialized",
            description: "WordPress questionnaire has been set up.",
            variant: "success",
          });
        })
        .catch(err => {
          toast({
            title: "Error",
            description: err.message || "Failed to initialize questions",
            variant: "destructive",
          });
        });
    }
  }, [projectId, questionsData, isLoading]);

  // Load answers into state when questions are loaded
  useEffect(() => {
    if (questionsData?.data?.allQuestions) {
      const initialAnswers = {};
      questionsData.data.allQuestions.forEach(q => {
        if (q.answer !== null && q.answer !== undefined) {
          initialAnswers[q.questionKey] = q.answer;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [questionsData]);

  // Update answer mutation
  const updateAnswerMutation = useMutation({
    mutationFn: ({ questionKey, answer }) => 
      updateAnswers(projectId, { [questionKey]: answer }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['questions', projectId]);
      queryClient.invalidateQueries(['questions-progress', projectId]);
      
      // Update local answers state
      setAnswers(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(data.data.updates || {}).map(u => [u.key, u.data?.answer])
        )
      }));
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save answer",
        variant: "destructive",
      });
    },
  });

  // Handle answer change
  const handleAnswerChange = (questionKey, value) => {
    // Update local state immediately for responsive UI
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));

    // Debounced API update
    clearTimeout(window.answerTimeout);
    window.answerTimeout = setTimeout(() => {
      updateAnswerMutation.mutate({ questionKey, answer: value });
    }, 1000);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    handleAnswerChange('selectedTemplateId', templateId);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate template selection
      if (!selectedTemplate) {
        toast({
          title: "Template Required",
          description: "Please select a WordPress template",
          variant: "destructive",
        });
        return;
      }

      // Validate all required questions
      const validation = progressData?.data?.validation;
      if (!validation?.isValid) {
        toast({
          title: "Incomplete Form",
          description: `Please complete all required fields. Missing: ${validation?.missing?.length} fields`,
          variant: "destructive",
        });
        return;
      }

      // Prepare final project data
      const submissionData = {
        ...answers,
        selectedTemplateId: selectedTemplate,
        projectType: "wordpress",
        questionsStatus: "completed",
        questionsCompletedAt: new Date().toISOString(),
        progress: {
          ...progressData?.data?.progress,
          overallCompletion: 100
        }
      };

      // Update project
      const response = await updateProject(projectId, submissionData);
      
      toast({
        title: "Success!",
        description: "Project questionnaire completed successfully.",
        variant: "success",
      });

      if (setFormSubmitted) {
        setFormSubmitted(true);
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Questionnaire</h3>
        <p className="text-red-700 mb-4">{error.message}</p>
        <button
          onClick={() => refetchQuestions()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const sections = questionsData?.data?.sections || [];
  const progress = progressData?.data?.progress || { percentage: 0 };
  const validation = progressData?.data?.validation || { isValid: false };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">WordPress Project Questionnaire</h3>
            <p className="text-sm text-gray-600">Complete all sections to start your project</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {progress.percentage}% Complete
            </div>
            <div className="text-xs px-3 py-1 bg-green-100 text-green-800 rounded-full">
              {progress.completed || 0}/{progress.total || 0} Questions
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
        {!validation.isValid && validation.missing?.length > 0 && (
          <p className="text-sm text-amber-600 mt-2">
            Missing {validation.missing.length} required fields
          </p>
        )}
      </div>

      {/* Render sections */}
      {sections.map((section, sectionIndex) => (
        <div key={section.section} className="bg-white rounded-lg border border-gray-200">
          <div className="bg-primary px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              {sectionIndex + 1}. {section.name}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {section.questions.map((question) => (
              <QuestionRenderer
                key={question._id}
                question={question}
                value={answers[question.questionKey]}
                onChange={(value) => handleAnswerChange(question.questionKey, value)}
                isSaving={updateAnswerMutation.isPending}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Template Selection Section */}
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onSelect={handleTemplateSelect}
      />

      {/* Submit Section */}
      <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              {validation.isValid && selectedTemplate 
                ? "Ready to Submit!" 
                : "Complete the form to continue"}
            </h3>
            <p className="text-sm text-gray-600">
              {validation.isValid && selectedTemplate
                ? "All questions answered and template selected. Ready to create your WordPress project."
                : `Complete all required questions and select a template to continue.`}
            </p>
            
            {!validation.isValid && (
              <div className="mt-2 text-sm text-amber-700">
                <p className="font-medium">Missing required fields:</p>
                <ul className="list-disc pl-5 mt-1">
                  {validation.missing?.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item.question}</li>
                  ))}
                  {validation.missing?.length > 3 && (
                    <li>...and {validation.missing.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px]">
            <button
              onClick={handleSubmit}
              disabled={!validation.isValid || !selectedTemplate || updateAnswerMutation.isPending}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                validation.isValid && selectedTemplate && !updateAnswerMutation.isPending
                  ? "bg-primary text-white hover:bg-primary-dark cursor-pointer"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {updateAnswerMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Complete Questionnaire
                </>
              )}
            </button>
            
            {(!validation.isValid || !selectedTemplate) && (
              <p className="text-xs text-center text-gray-500">
                {!validation.isValid && !selectedTemplate
                  ? "Complete all fields and select template"
                  : !validation.isValid
                  ? "Complete all required fields"
                  : "Select a template"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsTab;