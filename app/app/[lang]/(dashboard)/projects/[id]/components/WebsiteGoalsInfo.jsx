import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import FieldDescriptionPopout from './FieldDescriptionPopout';
import { questionTranslations } from './questionTranslations';

const WebsiteGoalsInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  const [openField, setOpenField] = useState(null);
  const businessTypeOptions = [
    "",
    "B2B (Business to Business)",
    "B2C (Business to Consumer)",
    "Mixed"
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">6. Website Goals & Target Audience</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Website Purpose */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Website Goals
            </label>
            {questionTranslations.websitePurpose && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'websitePurpose' ? null : 'websitePurpose')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'websitePurpose' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'websitePurpose' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.websitePurpose}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <textarea
            value={formData.websitePurpose || ""}
            onChange={(e) => handleInputChange('websitePurpose', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={4}
            placeholder="What should visitors do on your website? (e.g., contact you, buy products, get information)"
            disabled={disabled}
          />
        </div>

        {/* Target Customers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Target Audience
            </label>
            {questionTranslations.targetCustomers && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'targetCustomers' ? null : 'targetCustomers')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'targetCustomers' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'targetCustomers' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.targetCustomers}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <textarea
            value={formData.targetCustomers || ""}
            onChange={(e) => handleInputChange('targetCustomers', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Describe your ideal customers/clients"
            disabled={disabled}
          />
        </div>

        {/* Business Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Business Type
          </label>
          <select
            value={formData.businessType || ""}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            {businessTypeOptions.map((option, idx) => (
              <option key={idx} value={option}>
                {option || "Select business type..."}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500">
            Select whether your business serves other businesses (B2B) or consumers (B2C)
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebsiteGoalsInfo;