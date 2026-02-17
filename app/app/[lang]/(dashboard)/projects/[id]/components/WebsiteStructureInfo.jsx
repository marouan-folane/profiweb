import React, { useEffect } from 'react';

const WebsiteStructureInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  // Website language options
  const websiteLanguages = [
    { value: "arabic", label: "Arabic" },
    { value: "english", label: "English" },
    { value: "french", label: "French" },
    { value: "german", label: "German" }
  ];

  // Website pages options - Use values that match what backend expects
  // Update the websitePagesOptions array to include the pages from the document:
  const websitePagesOptions = [
    { value: "Home", label: "Home" },
    { value: "Services", label: "Services" },
    { value: "About Us", label: "About Us" },
    { value: "Our Products", label: "Our Products" },
    { value: "Blog", label: "Blog" },
    { value: "FAQ", label: "FAQ" },
    { value: "Testimonials", label: "Testimonials" },
    { value: "Contact / Call to Action", label: "Contact / Call to Action" },
    { value: "Rules / Terms", label: "Rules / Terms" },
    { value: "Portfolio / Gallery", label: "Portfolio / Gallery" },
    { value: "Team / Staff", label: "Team / Staff" }
  ];

  // Initialize form data if needed
  useEffect(() => {
    if (!formData.websitePages) {
      handleInputChange('websitePages', []);
    }
    if (!formData.websiteLanguages) {
      handleInputChange('websiteLanguages', []);
    }
  }, []);

  // Handle language toggle - SIMPLIFIED VERSION
  const handleLanguageToggle = (languageValue) => {
    const currentLanguages = Array.isArray(formData.websiteLanguages)
      ? [...formData.websiteLanguages]
      : [];

    // Ensure we're working with string values
    const cleanValue = String(languageValue);

    const updatedLanguages = currentLanguages.includes(cleanValue)
      ? currentLanguages.filter(lang => lang !== cleanValue)
      : [...currentLanguages, cleanValue];

    console.log('Updated languages:', updatedLanguages);
    handleInputChange('websiteLanguages', updatedLanguages);
  };

  // Handle page toggle - SIMPLIFIED VERSION
  const handleWebsitePagesToggle = (pageValue) => {
    const currentPages = Array.isArray(formData.websitePages)
      ? [...formData.websitePages]
      : [];

    // Ensure we're working with string values
    const cleanValue = String(pageValue);

    const updatedPages = currentPages.includes(cleanValue)
      ? currentPages.filter(page => page !== cleanValue)
      : [...currentPages, cleanValue];

    console.log('Updated pages:', updatedPages);
    handleInputChange('websitePages', updatedPages);
  };

  // Check if a page is selected
  const isPageSelected = (pageValue) => {
    if (!Array.isArray(formData.websitePages)) return false;

    // Check if the exact value exists
    return formData.websitePages.includes(String(pageValue));
  };

  // Check if a language is selected
  const isLanguageSelected = (languageValue) => {
    if (!Array.isArray(formData.websiteLanguages)) return false;

    // Check if the exact value exists
    return formData.websiteLanguages.includes(String(languageValue));
  };

  // Debug function
  const debugState = () => {
    console.log('=== WebsiteStructureInfo Debug ===');
    console.log('formData.websitePages:', formData.websitePages);
    console.log('Type of websitePages:', typeof formData.websitePages);
    console.log('Is Array?', Array.isArray(formData.websitePages));

    if (Array.isArray(formData.websitePages)) {
      formData.websitePages.forEach((page, index) => {
        console.log(`Page ${index}:`, page, 'Type:', typeof page);
      });
    }

    console.log('formData.websiteLanguages:', formData.websiteLanguages);
    console.log('Type of websiteLanguages:', typeof formData.websiteLanguages);
    console.log('Is Array?', Array.isArray(formData.websiteLanguages));
    console.log('=== End Debug ===');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">8. Website Structure & Pages</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Website Pages */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Required Website Pages
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {websitePagesOptions.map((page, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  id={`page_${page.value.replace(/\s+/g, '_')}`}
                  checked={isPageSelected(page.value)}
                  onChange={() => handleWebsitePagesToggle(page.value)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  disabled={disabled}
                />
                <label
                  htmlFor={`page_${page.value.replace(/\s+/g, '_')}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {page.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Select all pages that should be included in your website
          </p>
        </div>

        {/* Low Priority Services */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Services Not to Feature Prominently
          </label>
          <textarea
            value={formData.lowPriorityServices || ""}
            onChange={(e) => handleInputChange('lowPriorityServices', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Services to keep in background"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Services that are less important or should be in secondary sections
          </p>
        </div>

        {/* Mandatory Homepage Content */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Mandatory Homepage Content
          </label>
          <textarea
            value={formData.mandatoryHomepageContent || ""}
            onChange={(e) => handleInputChange('mandatoryHomepageContent', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Content that MUST appear on homepage"
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Any specific content, messages, or elements that must be on the homepage
          </p>
        </div>

        {/* Website Languages */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Website Languages Needed
          </label>
          <div className="space-y-2">
            {websiteLanguages.map((language, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  id={`language_${language.value}`}
                  checked={isLanguageSelected(language.value)}
                  onChange={() => handleLanguageToggle(language.value)}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  disabled={disabled}
                />
                <label
                  htmlFor={`language_${language.value}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {language.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Select all languages needed for your website
          </p>
        </div>

        {/* Service Highlight */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Which service should be highlighted on the homepage?
          </label>
          <input
            type="text"
            value={formData.highlightedService || ""}
            onChange={(e) => handleInputChange('highlightedService', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            placeholder="e.g., Basic package for 3000 dh"
            disabled={disabled}
          />
        </div>

        {/* Services not to feature prominently */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Are there any services that should not be prominently featured?
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="lowPriorityNo"
                name="lowPriorityServices"
                value="No"
                checked={formData.lowPriorityServices === "No"}
                onChange={(e) => handleInputChange('lowPriorityServices', e.target.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                disabled={disabled}
              />
              <label htmlFor="lowPriorityNo" className="ml-2 text-sm text-gray-700">
                No
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="lowPriorityYes"
                name="lowPriorityServices"
                value="Yes"
                checked={formData.lowPriorityServices === "Yes"}
                onChange={(e) => handleInputChange('lowPriorityServices', e.target.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                disabled={disabled}
              />
              <label htmlFor="lowPriorityYes" className="ml-2 text-sm text-gray-700">
                Yes
              </label>
            </div>
            {formData.lowPriorityServices === "Yes" && (
              <textarea
                value={formData.lowPriorityServicesDetails || ""}
                onChange={(e) => handleInputChange('lowPriorityServicesDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                rows={2}
                placeholder="Please specify which services..."
                disabled={disabled}
              />
            )}
          </div>
        </div>

        {/* Mandatory Homepage Content */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Is there any content that absolutely must appear on the homepage?
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="radio"
                id="mandatoryNo"
                name="mandatoryHomepageContent"
                value="No"
                checked={formData.mandatoryHomepageContent === "No"}
                onChange={(e) => handleInputChange('mandatoryHomepageContent', e.target.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                disabled={disabled}
              />
              <label htmlFor="mandatoryNo" className="ml-2 text-sm text-gray-700">
                No
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="mandatoryYes"
                name="mandatoryHomepageContent"
                value="Yes"
                checked={formData.mandatoryHomepageContent === "Yes"}
                onChange={(e) => handleInputChange('mandatoryHomepageContent', e.target.value)}
                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                disabled={disabled}
              />
              <label htmlFor="mandatoryYes" className="ml-2 text-sm text-gray-700">
                Yes
              </label>
            </div>
            {formData.mandatoryHomepageContent === "Yes" && (
              <textarea
                value={formData.mandatoryHomepageContentDetails || ""}
                onChange={(e) => handleInputChange('mandatoryHomepageContentDetails', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                rows={2}
                placeholder="Please specify the content..."
                disabled={disabled}
              />
            )}
          </div>
        </div>

        {/* Competitive Environment */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Are there typical competitors or market participants you want to differentiate from?
          </label>
          <textarea
            value={formData.competitiveEnvironment || ""}
            onChange={(e) => handleInputChange('competitiveEnvironment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={3}
            placeholder="Describe competitors you want to differentiate from..."
            disabled={disabled}
          />
        </div>

        {/* AI Communication Language */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Communication language for the case worker
          </label>
          <select
            value={formData.communicationLanguage || ""}
            onChange={(e) => handleInputChange('communicationLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            {["German", "English", "French", "Arabic"].map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Output Languages */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Output languages for the website texts
          </label>
          <div className="space-y-2">
            {["English", "German", "French"].map((lang) => (
              <div key={lang} className="flex items-center">
                <input
                  type="checkbox"
                  id={`output_${lang.toLowerCase()}`}
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
                <label htmlFor={`output_${lang.toLowerCase()}`} className="ml-2 text-sm text-gray-700">
                  {lang}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteStructureInfo;