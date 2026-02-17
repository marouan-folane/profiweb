import React from 'react';

const PreliminaryInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  const languageOptions = [
    "",
    "German",
    "English", 
    "French",
    "Arabic",
    "Spanish",
    "Other"
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-gray-700 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">Preliminary Information</h3>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Case Worker Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Case Worker
            </label>
            <input
              type="text"
              value={formData.caseWorkerName || ""}
              onChange={(e) => handleInputChange('caseWorkerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="Name of case worker"
              disabled={disabled}
            />
          </div>

          {/* Case Worker Language */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Language of Case Worker
            </label>
            <select
              value={formData.caseWorkerLanguage || ""}
              onChange={(e) => handleInputChange('caseWorkerLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              disabled={disabled}
            >
              {languageOptions.map((option, idx) => (
                <option key={idx} value={option}>
                  {option || "Select language..."}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreliminaryInfo;