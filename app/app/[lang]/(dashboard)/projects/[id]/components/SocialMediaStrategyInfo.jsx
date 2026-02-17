import React from 'react';

const SocialMediaStrategyInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-blue-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">10. Social Media Strategy</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Social Media Strategy */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Social Media Strategy
          </label>
          <textarea
            value={formData.socialMediaStrategy || ""}
            onChange={(e) => handleInputChange('socialMediaStrategy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={6}
            placeholder="List social media platforms and strategy (Facebook, Instagram, Twitter, LinkedIn, YouTube, Pinterest, etc.)"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Mention which social media platforms you want to integrate and your strategy for each
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaStrategyInfo;