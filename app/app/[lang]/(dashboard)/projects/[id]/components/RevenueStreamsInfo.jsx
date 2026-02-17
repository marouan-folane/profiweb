import React from 'react';

const RevenueStreamsInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-orange-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">9. Revenue Streams</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Revenue Streams */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Revenue Streams
          </label>
          <input
            type="text"
            value={formData.revenueStreams || ""}
            onChange={(e) => handleInputChange('revenueStreams', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="e.g., Subscription model, Product sales, Services"
            disabled={disabled}
          />
        </div>

        {/* Subscription Model */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subscription Model
          </label>
          <input
            type="text"
            value={formData.subscriptionModel || ""}
            onChange={(e) => handleInputChange('subscriptionModel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="e.g., Monthly subscription fee"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subscription Fee */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subscription Fee
            </label>
            <input
              type="number"
              value={formData.subscriptionFee || ""}
              onChange={(e) => handleInputChange('subscriptionFee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g., $10/month"
              disabled={disabled}
            />
          </div>

          {/* Subscription Duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subscription Duration
            </label>
            <input
              type="text"
              value={formData.subscriptionDuration || ""}
              onChange={(e) => handleInputChange('subscriptionDuration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g., One year"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Subscription Frequency */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subscription Frequency
          </label>
          <input
            type="text"
            value={formData.subscriptionFrequency || ""}
            onChange={(e) => handleInputChange('subscriptionFrequency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="e.g., Quarterly"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueStreamsInfo;