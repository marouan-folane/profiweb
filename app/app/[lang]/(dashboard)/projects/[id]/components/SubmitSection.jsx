import React, { useState } from 'react';

const SubmitSection = ({
  formData,
  selectedTemplate,
  customQuestions,
  requiredFields,
  getCompletionPercentage,
  getOverallCompletionPercentage,
  areAllRequiredFieldsFilled,
  handleSubmit,
  updateProjectMutation,
}) => {
  const currentCompletion = getCompletionPercentage();
  const overallCompletion = getOverallCompletionPercentage();
  const allRequiredFilled = areAllRequiredFieldsFilled();
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Function to check which fields are missing
  const getMissingFields = () => {
    const missingFields = [];
    
    requiredFields.forEach(field => {
      const keys = field.split('.');
      let value;

      if (keys.length === 1) {
        value = formData[field];
      } else if (keys.length === 2) {
        value = formData[keys[0]]?.[keys[1]];
      } else if (keys.length === 3) {
        value = formData[keys[0]]?.[keys[1]]?.[keys[2]];
      }

      if (!value || value.toString().trim() === "") {
        missingFields.push({
          field,
          value,
          isEmpty: !value || value.toString().trim() === ""
        });
      }
    });

    return missingFields;
  };

  const filledRequiredFields = requiredFields.filter(field => {
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

  const missingFields = getMissingFields();

  // Enhanced submit handler with debug info
  const handleSubmitWithDebug = () => {
    console.log('=== DEBUG: Form Validation Check ===');
    console.log('Total required fields:', requiredFields.length);
    console.log('Filled required fields:', filledRequiredFields);
    console.log('Missing required fields:', missingFields.length);
    console.log('Template selected:', selectedTemplate ? 'Yes' : 'No');
    
    // Log each field's status
    console.log('\n=== FIELD BY FIELD CHECK ===');
    requiredFields.forEach(field => {
      const keys = field.split('.');
      let value;
      let path = '';

      if (keys.length === 1) {
        value = formData[field];
        path = `formData['${field}']`;
      } else if (keys.length === 2) {
        value = formData[keys[0]]?.[keys[1]];
        path = `formData['${keys[0]}']['${keys[1]}']`;
      } else if (keys.length === 3) {
        value = formData[keys[0]]?.[keys[1]]?.[keys[2]];
        path = `formData['${keys[0]}']['${keys[1]}']['${keys[2]}']`;
      }

      const status = value && value.toString().trim() !== "" ? '✅ FILLED' : '❌ MISSING';
      console.log(`${status} ${field}:`, {
        value: value || '(empty/null)',
        path,
        type: typeof value,
        isObject: typeof value === 'object',
        isArray: Array.isArray(value)
      });
    });

    // Log missing fields in detail
    if (missingFields.length > 0) {
      console.log('\n=== MISSING FIELDS DETAIL ===');
      missingFields.forEach(({ field, value }) => {
        console.log(`❌ ${field}:`, {
          currentValue: value,
          type: typeof value,
          isEmpty: !value || value.toString().trim() === ""
        });
      });
    }

    // Log custom questions status
    console.log('\n=== CUSTOM QUESTIONS STATUS ===');
    customQuestions.forEach((q, index) => {
      const isRequiredAndMissing = q.isRequired && (!q.answer || q.answer.toString().trim() === "");
      console.log(`Custom ${index}: "${q.label}"`, {
        isRequired: q.isRequired,
        answer: q.answer || '(empty)',
        status: isRequiredAndMissing ? '❌ REQUIRED & MISSING' : '✓ OK'
      });
    });

    // console.log('=== END DEBUG ===\n');

    // Set debug info for display
    setDebugInfo({
      timestamp: new Date().toISOString(),
      totalRequired: requiredFields.length,
      filled: filledRequiredFields,
      missing: missingFields.length,
      templateSelected: !!selectedTemplate,
      missingFields: missingFields.map(mf => ({
        field: mf.field,
        value: mf.value,
        path: mf.field.split('.').reduce((acc, key) => `${acc}['${key}']`, 'formData')
      })),
      customQuestions: customQuestions.map((q, index) => ({
        label: q.label,
        isRequired: q.isRequired,
        answer: q.answer,
        isMissing: q.isRequired && (!q.answer || q.answer.toString().trim() === "")
      }))
    });

    // Show debug panel
    setShowDebug(true);

    // Proceed with normal submit
    handleSubmit();
  };

  return (
    <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
      {/* Debug Button */}
      {/* <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-1"
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div> */}

      {/* Debug Panel */}
      {/* {showDebug && (
        <div className="mb-6 bg-gray-800 text-gray-100 rounded-lg p-4 text-sm font-mono">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-white">Debug Information</h4>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>Total Required Fields:</div>
              <div className="text-right">{requiredFields.length}</div>
              
              <div>Filled Required Fields:</div>
              <div className="text-right">
                <span className={filledRequiredFields === requiredFields.length ? 'text-green-400' : 'text-yellow-400'}>
                  {filledRequiredFields}
                </span>
              </div>
              
              <div>Missing Required Fields:</div>
              <div className="text-right">
                <span className={missingFields.length === 0 ? 'text-green-400' : 'text-red-400'}>
                  {missingFields.length}
                </span>
              </div>
              
              <div>Template Selected:</div>
              <div className="text-right">
                <span className={selectedTemplate ? 'text-green-400' : 'text-red-400'}>
                  {selectedTemplate ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div>Custom Questions:</div>
              <div className="text-right">{customQuestions.length}</div>
              
              <div>Required Custom Missing:</div>
              <div className="text-right">
                {customQuestions.filter(q => q.isRequired && (!q.answer || q.answer.toString().trim() === "")).length}
              </div>
            </div>
            
            {missingFields.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="font-semibold text-red-400 mb-2">Missing Required Fields:</div>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {missingFields.map((mf, index) => (
                    <li key={index} className="flex items-center">
                      <span className="text-red-400 mr-2">❌</span>
                      <span className="text-gray-300">{mf.field}</span>
                      <span className="text-gray-500 ml-2 text-xs">({typeof mf.value})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="font-semibold text-blue-400 mb-2">Required Fields List:</div>
              <div className="text-xs opacity-75">
                {requiredFields.map((field, idx) => (
                  <div key={idx} className="flex items-center py-0.5">
                    <span className="mr-2">
                      {filledRequiredFieldsList.includes(field) ? '✅' : '❌'}
                    </span>
                    <code>{field}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )} */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          {/* <h3 className="font-semibold text-gray-900 mb-1">Ready to Start Your WordPress Project</h3>
          <p className="text-sm text-gray-600 mb-3">
            {allRequiredFilled && selectedTemplate
              ? "All required information provided and template selected!"
              : `Complete all required fields and select a template (${overallCompletion}% completed)`}
          </p> */}

          {/* Progress Bar */}
          {/* <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-md">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${overallCompletion}%` }}
            ></div>
          </div> */}

          {/* Progress Details */}
          {/* <div className="flex justify-between text-xs text-gray-500 mt-2 max-w-md">
            <span>{overallCompletion}% Complete</span>
            <span>
              {filledRequiredFields} of {requiredFields.length} required fields
              {selectedTemplate ? " + template selected" : " (template needed)"}
              {customQuestions.length > 0 ? ` + ${customQuestions.length} custom fields` : ""}
            </span>
          </div> */}

          {/* Missing Fields Summary */}
          {/* {missingFields.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2 text-amber-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-medium">
                  {missingFields.length} required field{missingFields.length === 1 ? '' : 's'} missing
                </span>
              </div>
              <div className="mt-1 text-xs text-amber-700">
                Missing: {missingFields.slice(0, 3).map(mf => mf.field).join(', ')}
                {missingFields.length > 3 && ` and ${missingFields.length - 3} more...`}
              </div>
            </div>
          )} */}

          {/* Auto-save indicator */}
          {/* {currentCompletion > 0 && !updateProjectMutation.isPending && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="inline-flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Auto-save enabled
              </span>
            </p>
          )} */}
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          {/* Submit Button - Always clickable */}
          <button
            onClick={handleSubmitWithDebug}
            className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
          >
            {updateProjectMutation.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Project...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Save & Complete Questionnaire
              </>
            )}
          </button>

          {/* Status messages */}
          {!allRequiredFilled && currentCompletion > 0 && (
            <p className="text-xs text-amber-600 mt-1 text-center">
              {requiredFields.length - filledRequiredFields} more required fields needed
            </p>
          )}
          {allRequiredFilled && !selectedTemplate && (
            <p className="text-xs text-red-600 mt-1 text-center">
              Please select a template above
            </p>
          )}
        </div>
      </div>

      {/* Debug console info */}
      {/* <div className="mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span>Check browser console (F12) for detailed field-by-field debugging</span>
        </div>
      </div> */}
    </div>
  );
};

// Helper to get list of filled fields
const filledRequiredFieldsList = (formData, requiredFields) => {
  return requiredFields.filter(field => {
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

export default SubmitSection;