// Create a new file AIWorkInstructions.jsx:

import React from 'react';

const AIWorkInstructions = ({
  formData,
  handleInputChange,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-indigo-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">AI Work Instructions</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Communication Language */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Communication Language (Case Worker)
          </label>
          <select
            value={formData.communicationLanguage || ""}
            onChange={(e) => handleInputChange('communicationLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            <option value="">Select language...</option>
            {["German", "English", "French", "Arabic"].map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Output Languages */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Output Languages for Website Texts
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["English", "German", "French"].map((lang) => (
              <div key={lang} className="flex items-center">
                <input
                  type="checkbox"
                  id={`outputLang_${lang}`}
                  checked={(formData.outputLanguages || []).includes(lang)}
                  onChange={() => {
                    const currentLangs = [...(formData.outputLanguages || [])];
                    const updatedLangs = currentLangs.includes(lang)
                      ? currentLangs.filter(l => l !== lang)
                      : [...currentLangs, lang];
                    handleInputChange('outputLanguages', updatedLangs);
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`outputLang_${lang}`} className="ml-2 text-sm text-gray-700">
                  {lang}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Select the languages in which the website should be created
          </p>
        </div>

        {/* Language Order */}
        {(formData.outputLanguages || []).length > 1 && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-md">
            <label className="block text-sm font-medium text-gray-700">
              Language Order (Fixed)
            </label>
            <div className="space-y-2">
              {["English", "German", "French"].map((lang, index) => (
                <div key={lang} className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-medium mr-2">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700">{lang}</span>
                  {(formData.outputLanguages || []).includes(lang) && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This order is fixed and applies to all texts and pages without deviation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIWorkInstructions;