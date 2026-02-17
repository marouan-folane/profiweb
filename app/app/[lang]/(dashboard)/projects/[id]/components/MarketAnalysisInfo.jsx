import React from 'react';

const MarketAnalysisInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">7. Market Analysis</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Liked Competitors */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Competitors You Like
          </label>
          <textarea
            value={formData.likedCompetitors || ""}
            onChange={(e) => handleInputChange('likedCompetitors', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="List competitor websites you admire and why"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Mention specific features, design elements, or content you like from competitor sites
          </p>
        </div>

        {/* Competitive environment & positioning */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Competitive environment & positioning (optional)
          </label>
          <textarea
            value={formData.competitiveEnvironment || ""}
            onChange={(e) => handleInputChange('competitiveEnvironment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Describe your competitive environment and how you want to position yourself"
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Market Size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Market Size
            </label>
            <input
              type="text"
              value={formData.marketSize || ""}
              onChange={(e) => handleInputChange('marketSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g., $10 billion"
              disabled={disabled}
            />
          </div>

          {/* Market Growth Rate */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Market Growth Rate
            </label>
            <input
              type="text"
              value={formData.marketGrowthRate || ""}
              onChange={(e) => handleInputChange('marketGrowthRate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g., 20%"
              disabled={disabled}
            />
          </div>

          {/* Market Share */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Market Share
            </label>
            <input
              type="text"
              value={formData.marketShare || ""}
              onChange={(e) => handleInputChange('marketShare', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder="e.g., 15%"
              disabled={disabled}
            />
          </div>
        </div>

        {/* Differentiation from Competitors */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Competitors to Differentiate From
          </label>
          <textarea
            value={formData.differentiationCompetitors || ""}
            onChange={(e) => handleInputChange('differentiationCompetitors', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="List competitors you want to stand out from and how"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Explain how you want to be different from these competitors
          </p>
        </div>

        {/* Special features compared to competitors */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Special features compared to competitors
          </label>
          <textarea
            value={formData.specialFeaturesCompared || ""}
            onChange={(e) => handleInputChange('specialFeaturesCompared', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="What special features do you have compared to competitors?"
            disabled={disabled}
          />
        </div>

        {/* Content Restrictions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Content Restrictions / No-Go List
          </label>
          <textarea
            value={formData.contentRestrictions || ""}
            onChange={(e) => handleInputChange('contentRestrictions', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Any content, colors, or elements to avoid?"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Mention anything you don't want on your website (colors, phrases, images, etc.)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysisInfo;