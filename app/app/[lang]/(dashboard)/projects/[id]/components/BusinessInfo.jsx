import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import FieldDescriptionPopout from './FieldDescriptionPopout';
import { questionTranslations } from './questionTranslations';

const BusinessInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  const [openField, setOpenField] = useState(null);
  const legalFormOptions = [
    "",
    "SARL",
    "SA",
    "SNC",
    "SCS",
    "SCA",
    "SCOP",
    "EI",
    "Micro-entreprise",
    "Auto-entrepreneur",
    "Association",
    "Other"
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">4. Business Information (For Website Content)</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Company Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Full Company Name
              {requiredFields.includes('companyName') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {questionTranslations.companyName && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'companyName' ? null : 'companyName')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'companyName' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'companyName' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.companyName}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <input
            type="text"
            value={formData.companyName || ""}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['companyName'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Will appear in website header and footer"
            disabled={disabled}
          />
          {validationErrors['companyName'] && (
            <p className="text-sm text-red-600">{validationErrors['companyName']}</p>
          )}
        </div>

        {/* Legal Form */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Legal Form
          </label>
          <select
            value={formData.legalForm || ""}
            onChange={(e) => handleInputChange('legalForm', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            {legalFormOptions.map((option, idx) => (
              <option key={idx} value={option}>
                {option || "Select legal form..."}
              </option>
            ))}
          </select>
        </div>

        {/* Business Address */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Business Address
              {requiredFields.includes('businessAddress') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {questionTranslations.businessAddress && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'businessAddress' ? null : 'businessAddress')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'businessAddress' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'businessAddress' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.businessAddress}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <textarea
            value={formData.businessAddress || ""}
            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['businessAddress'] ? 'border-red-500' : 'border-gray-300'}`}
            rows={3}
            placeholder="Full company address for contact page"
            disabled={disabled}
          />
          {validationErrors['businessAddress'] && (
            <p className="text-sm text-red-600">{validationErrors['businessAddress']}</p>
          )}
        </div>

        {/* Company Telephone */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Telephone number
              {requiredFields.includes('companyTelephone') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {questionTranslations.companyTelephone && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'companyTelephone' ? null : 'companyTelephone')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'companyTelephone' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'companyTelephone' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.companyTelephone}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            value={formData.companyTelephone || ""}
            onChange={(e) => handleInputChange('companyTelephone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['companyTelephone'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="+212 XXX-XXXXXX"
            disabled={disabled}
          />
          {validationErrors['companyTelephone'] && (
            <p className="text-sm text-red-600">{validationErrors['companyTelephone']}</p>
          )}
        </div>

        {/* Company Email */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              Email address
              {requiredFields.includes('companyEmail') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {questionTranslations.companyEmail && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'companyEmail' ? null : 'companyEmail')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'companyEmail' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'companyEmail' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.companyEmail}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <input
            type="email"
            value={formData.companyEmail || ""}
            onChange={(e) => handleInputChange('companyEmail', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['companyEmail'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="info@company.com"
            disabled={disabled}
          />
          {validationErrors['companyEmail'] && (
            <p className="text-sm text-red-600">{validationErrors['companyEmail']}</p>
          )}
        </div>

        {/* Company Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Company description
          </label>
          <textarea
            value={formData.companyDescription || ""}
            onChange={(e) => handleInputChange('companyDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={4}
            placeholder="Describe your company's mission, vision, and values"
            disabled={disabled}
          />
        </div>

        {/* Brief Company Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Brief Company Description
          </label>
          <textarea
            value={formData.briefCompanyDescription || ""}
            onChange={(e) => handleInputChange('briefCompanyDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={2}
            placeholder="Short summary for homepage (1-2 sentences)"
            maxLength={200}
            disabled={disabled}
          />
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Industry / Field of activity
          </label>
          <input
            type="text"
            value={formData.industry || ""}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="e.g., Marketing, Technology, Healthcare, Retail"
            disabled={disabled}
          />
        </div>

        {/* Services Offered */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 relative">
            <label className="block text-sm font-medium text-gray-700">
              What services does the company offer?
              {requiredFields.includes('servicesOffered') && <span className="text-red-500 ml-1">*</span>}
            </label>
            {questionTranslations.servicesOffered && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenField(openField === 'servicesOffered' ? null : 'servicesOffered')}
                  className={`p-0.5 rounded-full transition-colors ${openField === 'servicesOffered' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon icon="lucide:help-circle" className="w-4 h-4" />
                </button>
                {openField === 'servicesOffered' && (
                  <FieldDescriptionPopout
                    translations={questionTranslations.servicesOffered}
                    onClose={() => setOpenField(null)}
                  />
                )}
              </div>
            )}
          </div>
          <textarea
            value={formData.servicesOffered || ""}
            onChange={(e) => handleInputChange('servicesOffered', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['servicesOffered'] ? 'border-red-500' : 'border-gray-300'}`}
            rows={4}
            placeholder="List all services offered by the company"
            disabled={disabled}
          />
          {validationErrors['servicesOffered'] && (
            <p className="text-sm text-red-600">{validationErrors['servicesOffered']}</p>
          )}
          <p className="text-xs text-gray-500">
            Include service names, descriptions, and pricing if available
          </p>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Call to Action
          </label>
          <textarea
            value={formData.callToAction || ""}
            onChange={(e) => handleInputChange('callToAction', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="What should visitors do after reading your content? (e.g., Order now, Contact us, Get quote)"
            disabled={disabled}
          />
        </div>

        {/* Unique Selling Points */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            What Makes You Unique? (Unique Selling Points)
          </label>
          <textarea
            value={formData.uniqueSellingPoints || ""}
            onChange={(e) => handleInputChange('uniqueSellingPoints', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Key benefits or differentiators for your business"
            disabled={disabled}
          />
        </div>

        {/* Website Objective */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Website Objective
          </label>
          <textarea
            value={formData.websiteObjective || ""}
            onChange={(e) => handleInputChange('websiteObjective', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="What is the main goal of your website?"
            disabled={disabled}
          />
        </div>

        {/* Tone and Demeanor */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tone and Demeanor
          </label>
          <div className="space-y-2">
            {["Professional", "Reliable", "International", "Friendly", "Formal", "Casual", "Innovative", "Traditional"].map((tone, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tone_${tone.toLowerCase()}`}
                  checked={(formData.toneAndDemeanor || []).includes(tone)}
                  onChange={() => {
                    const currentTones = [...(formData.toneAndDemeanor || [])];
                    const updatedTones = currentTones.includes(tone)
                      ? currentTones.filter(t => t !== tone)
                      : [...currentTones, tone];
                    handleInputChange('toneAndDemeanor', updatedTones);
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`tone_${tone.toLowerCase()}`} className="ml-2 text-sm text-gray-700">
                  {tone}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Select the tone that best represents your brand
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfo;