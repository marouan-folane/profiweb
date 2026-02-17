import React from 'react';

const BasicProjectInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">1. Basic Project Information</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Project Title
            {requiredFields.includes('title') && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['title'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., Modern Corporate Website for ABC Company"
            disabled={disabled}
          />
          {validationErrors['title'] && (
            <p className="text-sm text-red-600">{validationErrors['title']}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Project Description
            {requiredFields.includes('description') && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['description'] ? 'border-red-500' : 'border-gray-300'}`}
            rows={4}
            placeholder="Describe what you need for your WordPress website..."
            disabled={disabled}
          />
          {validationErrors['description'] && (
            <p className="text-sm text-red-600">{validationErrors['description']}</p>
          )}
        </div>

        {/* Short Description (Note) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            value={formData.shortDescription || ""}
            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={2}
            placeholder="Brief summary (max 200 characters)"
            maxLength={200}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicProjectInfo;