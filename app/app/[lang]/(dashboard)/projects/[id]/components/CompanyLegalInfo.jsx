import React from 'react';

const CompanyLegalInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">5. Company Legal & Background</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Managing Director */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Managing Director / Responsible Person
          </label>
          <input
            type="text"
            value={formData.managingDirector || ""}
            onChange={(e) => handleInputChange('managingDirector', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="Name of CEO or responsible person"
            disabled={disabled}
          />
        </div>

        {/* ICE Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ICE Number
          </label>
          <input
            type="text"
            value={formData.iceNumber || ""}
            onChange={(e) => handleInputChange('iceNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="ICE identification number"
            disabled={disabled}
          />
        </div>

        {/* Year of Foundation */}
        {/* <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Year of Foundation
          </label>
          <input
            type="number"
            value={formData.yearOfFoundation || ""}
            onChange={(e) => handleInputChange('yearOfFoundation', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['yearOfFoundation'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., 1995"
            min="1800"
            max={new Date().getFullYear()}
            disabled={disabled}
          />
          {validationErrors['yearOfFoundation'] && (
            <p className="text-sm text-red-600">{validationErrors['yearOfFoundation']}</p>
          )}
          <p className="text-xs text-gray-500">
            Enter the year your company was founded
          </p>
        </div> */}



        {/* Year of Foundation */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Year of Foundation
          </label>
          <input
            type="number"
            value={formData.yearOfFoundation || ""}
            onChange={(e) => handleInputChange('yearOfFoundation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="e.g., 2022"
            min="1800"
            max={new Date().getFullYear()}
            disabled={disabled}
          />
        </div>




      </div>
    </div>
  );
};

export default CompanyLegalInfo;