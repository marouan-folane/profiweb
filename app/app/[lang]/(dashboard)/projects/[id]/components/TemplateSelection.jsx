import React, { useEffect } from 'react';

const TemplateSelection = ({
  templates,
  selectedTemplate,
  handleTemplateSelect,
  disabled
}) => {
  // Default template ID - set this to the ID of the template you want as default
  const defaultTemplateId = templates.length > 0 ? templates[0]._id : null;
  
  // Set default template on component mount if no template is selected
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate && defaultTemplateId && !disabled) {
      handleTemplateSelect(defaultTemplateId);
    }
  }, [templates, selectedTemplate, defaultTemplateId, disabled, handleTemplateSelect]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-8">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">10. Select WordPress Template</h3>
        <p className="text-sm text-primary-100 mt-1">
          Choose a template to define your website's style
          {selectedTemplate && (
            <span className="ml-2 text-green-200">✓ Template selected</span>
          )}
        </p>
      </div>

      <div className="p-6">
        <div className="mb-4">
          {selectedTemplate ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-800 font-medium">
                  Selected: {templates.find(t => t._id === selectedTemplate)?.title}
                </span>
                {selectedTemplate === defaultTemplateId && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800">No template selected. The first template is selected by default.</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template._id}
              onClick={() => !disabled && handleTemplateSelect(template._id)}
              className={`cursor-pointer border rounded-lg p-4 transition-all hover:shadow-md hover:border-primary ${selectedTemplate === template._id
                ? 'border-primary border-2 bg-primary/5 shadow-md'
                : 'border-gray-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${template._id === defaultTemplateId && !selectedTemplate ? 'border-primary/50 border-2 bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {template.title}
                    {template._id === defaultTemplateId && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{template.shortDesc}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Category: {template.category || 'WordPress'}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedTemplate === template._id || (template._id === defaultTemplateId && !selectedTemplate)
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
                  }`}>
                  {(selectedTemplate === template._id || (template._id === defaultTemplateId && !selectedTemplate)) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>No templates available. Please check your connection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelection;