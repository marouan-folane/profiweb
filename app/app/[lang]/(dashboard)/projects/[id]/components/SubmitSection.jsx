import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { completeInfoQuestionnaire } from "@/config/functions/project";

const SubmitSection = ({
  formData,
  selectedTemplate,
  customQuestions,
  requiredFields,
  getCompletionPercentage,
  getOverallCompletionPercentage,
  areAllRequiredFieldsFilled,
  handleSubmit,
  handleSaveDraft,
  updateProjectMutation,
  infoStatus,
  isLockedForEdit,
  isInfoDept,
  isSuperAdmin,
  projectId
}) => {
  const router = useRouter();
  const [completeMutationLoading, setCompleteMutationLoading] = useState(false);
  const [draftSaveLoading, setDraftSaveLoading] = useState(false);
  const allRequiredFilled = areAllRequiredFieldsFilled();

  const filledRequiredFields = requiredFields.filter(field => {
    const keys = field.split('.');
    let value;
    if (keys.length === 1) value = formData[field];
    else if (keys.length === 2) value = formData[keys[0]]?.[keys[1]];
    else if (keys.length === 3) value = formData[keys[0]]?.[keys[1]]?.[keys[2]];
    return value && value.toString().trim() !== "";
  }).length;

  const handleCompleteQuestionnaire = async () => {
    // HARD LOCK: client-side guard (backend also enforces this)
    if (isLockedForEdit || infoStatus === 'completed') {
      toast.error('Questionnaire is already completed and locked.');
      return;
    }

    if (!allRequiredFilled) {
      toast.error("Please fill all required fields before completing.");
      return;
    }

    try {
      setCompleteMutationLoading(true);
      // First save the questions without redirecting
      await handleSubmit(false);

      // Then mark as completed
      const response = await completeInfoQuestionnaire(projectId);
      if (response && (response.status === 'success' || response.status === 'ok')) {
        toast.success("Questionnaire completed successfully!");

        // Redirection logic: For Info Dept, go back to project list
        // For SuperAdmin/others, just reload to show locked state (as-is)
        setTimeout(() => {
          if (isInfoDept && !isSuperAdmin) {
            router.push('/projects');
          } else {
            window.location.reload();
          }
        }, 1500);
      } else {
        const errorMsg = response?.message || response?.error || "Failed to complete questionnaire";
        toast.error(errorMsg);
        console.error("Completion failed:", response);
      }
    } catch (error) {
      console.error("Completion error:", error);
      toast.error(error.message || "An error occurred during completion");
    } finally {
      setCompleteMutationLoading(false);
    }
  };

  const onSaveDraft = async () => {
    try {
      setDraftSaveLoading(true);
      await handleSaveDraft();
    } catch (error) {
      console.error("Draft save error:", error);
    } finally {
      setDraftSaveLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-4">

      {/* ===== LOCKED BANNER — shown when questionnaire is completed ===== */}
      {infoStatus === 'completed' && (
        <div className="flex items-start gap-4 bg-green-50 border border-green-300 rounded-xl p-5 shadow-sm">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-green-800">Questionnaire Completed &amp; Locked 🔒</h3>
            <p className="text-sm text-green-700 mt-0.5">
              This questionnaire has been submitted and is now <strong>permanently locked</strong>.
              No further modifications are allowed by anyone.
            </p>
          </div>
        </div>
      )}

      {/* ===== SUBMIT PANEL — hidden once questionnaire is completed ===== */}
      {infoStatus !== 'completed' && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-4 items-end">

            <div className="flex flex-wrap gap-3 justify-end items-center">
              {/* Save Draft Button */}
              <button
                onClick={onSaveDraft}
                disabled={updateProjectMutation?.isPending || completeMutationLoading || draftSaveLoading}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {draftSaveLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Draft...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Draft
                  </>
                )}
              </button>

              {/* Complete button — only visible to d.i / superadmin */}
              {(isInfoDept || isSuperAdmin) && (
                <button
                  onClick={handleCompleteQuestionnaire}
                  disabled={updateProjectMutation?.isPending || completeMutationLoading || draftSaveLoading}
                  className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {updateProjectMutation?.isPending || completeMutationLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Save &amp; Complete Questionnaire
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Status hint messages */}
            <div className="min-w-[200px] text-right">
              {!allRequiredFilled && (
                <p className="text-xs text-amber-600 mt-1">
                  {requiredFields.length - filledRequiredFields} more required field(s) needed
                </p>
              )}
              {allRequiredFilled && !selectedTemplate && (
                <p className="text-xs text-red-600 mt-1">
                  Please select a template above
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitSection;