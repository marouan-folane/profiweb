import React, { useState } from 'react';

const CustomFields = ({
  customQuestions,
  setCustomQuestions,
  showAddCustomField,
  setShowAddCustomField,
  newCustomField,
  setNewCustomField,
  validationErrors,
  setValidationErrors,
  disabled
}) => {
  // Input types for custom fields
  const inputTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Dropdown Select' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' },
    { value: 'tel', label: 'Phone Number' },
    { value: 'url', label: 'URL' }
  ];

  // Handle adding a custom field
  const handleAddCustomField = () => {
    if (!newCustomField.questionKey || !newCustomField.label) {
      alert("Please provide a field ID and label for the custom field.");
      return;
    }

    // Generate a unique questionKey if not provided
    const questionKey = newCustomField.questionKey.toLowerCase().replace(/\s+/g, '_');

    const newField = {
      ...newCustomField,
      questionKey,
      question: newCustomField.label,
      order: customQuestions.length + 1,
      isCustom: true,
      answer: "",
      options: (newCustomField.type === 'select' || newCustomField.type === 'radio' || newCustomField.type === 'checkbox')
        ? newCustomField.options.map(opt => ({ value: opt, label: opt }))
        : []
    };

    setCustomQuestions(prev => [...prev, newField]);

    // Reset new custom field form
    setNewCustomField({
      questionKey: "",
      label: "",
      type: "text",
      placeholder: "",
      isRequired: false,
      section: "custom",
      sectionName: "Custom Fields",
      options: []
    });

    setShowAddCustomField(false);
  };

  // Remove custom field
  const handleRemoveCustomField = (index) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // Handle custom answer change
  const handleCustomAnswerChange = (questionKey, value) => {
    setCustomQuestions(prev =>
      prev.map(q => q.questionKey === questionKey ? { ...q, answer: value } : q)
    );

    // Clear validation error
    const errorKey = `custom_${customQuestions.findIndex(q => q.questionKey === questionKey)}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => ({ ...prev, [errorKey]: null }));
    }
  };

  // Add option to custom field
  const handleAddOption = () => {
    if (newCustomField.type === 'select' || newCustomField.type === 'radio' || newCustomField.type === 'checkbox') {
      setNewCustomField(prev => ({
        ...prev,
        options: [...prev.options, ""]
      }));
    }
  };

  // Handle option change
  const handleOptionChange = (index, value) => {
    setNewCustomField(prev => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  // Remove option
  const handleRemoveOption = (index) => {
    setNewCustomField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  // Render custom question input based on type
  const renderCustomQuestionInput = (question) => {
    const errorKey = `custom_${customQuestions.findIndex(q => q.questionKey === question.questionKey)}`;
    const hasError = validationErrors[errorKey];

    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            value={question.answer || ""}
            onChange={(e) => handleCustomAnswerChange(question.questionKey, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            rows={4}
            placeholder={question.placeholder}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <select
            value={question.answer || ""}
            onChange={(e) => handleCustomAnswerChange(question.questionKey, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            disabled={disabled}
          >
            <option value="">Select an option...</option>
            {question.options?.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label || option.value}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  id={`${question.questionKey}_${idx}`}
                  name={question.questionKey}
                  value={option.value}
                  checked={question.answer === option.value}
                  onChange={(e) => handleCustomAnswerChange(question.questionKey, e.target.value)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`${question.questionKey}_${idx}`} className="ml-2 text-sm text-gray-700">
                  {option.label || option.value}
                </label>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        const currentAnswers = question.answer ? question.answer.split(',').map(a => a.trim()).filter(a => a) : [];

        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${question.questionKey}_${idx}`}
                  checked={currentAnswers.includes(option.value)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let newAnswers;
                    if (isChecked) {
                      newAnswers = [...currentAnswers, option.value];
                    } else {
                      newAnswers = currentAnswers.filter(a => a !== option.value);
                    }
                    handleCustomAnswerChange(question.questionKey, newAnswers.join(', '));
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`${question.questionKey}_${idx}`} className="ml-2 text-sm text-gray-700">
                  {option.label || option.value}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type={question.type}
            value={question.answer || ""}
            onChange={(e) => handleCustomAnswerChange(question.questionKey, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${hasError ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={question.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-8">
      <div className="bg-purple-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">11. Custom Questions (Optional)</h3>
        <p className="text-sm text-purple-100 mt-1">
          Add your own questions to gather specific information for your project
        </p>
      </div>

      <div className="p-6">
        {/* Add Custom Field Button */}
        <button
          onClick={() => setShowAddCustomField(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors mb-6"
          disabled={disabled}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Field
        </button>

        {/* Add Custom Field Form */}
        {showAddCustomField && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Add New Custom Field</h4>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Field ID (Internal)*
                  </label>
                  <input
                    type="text"
                    value={newCustomField.questionKey}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, questionKey: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g., special_requirements"
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-500">Unique identifier for this field</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Field Label*
                  </label>
                  <input
                    type="text"
                    value={newCustomField.label}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g., Special Requirements"
                    disabled={disabled}
                  />
                  <p className="text-xs text-gray-500">Display label for the field</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Input Type
                  </label>
                  <select
                    value={newCustomField.type}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, type: e.target.value, options: (e.target.value === 'select' || e.target.value === 'radio' || e.target.value === 'checkbox') ? prev.options : [] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    disabled={disabled}
                  >
                    {inputTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Placeholder (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustomField.placeholder}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, placeholder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="e.g., Enter your special requirements..."
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* Options for select/radio/checkbox */}
              {(newCustomField.type === 'select' || newCustomField.type === 'radio' || newCustomField.type === 'checkbox') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Options (One per line)
                  </label>
                  <div className="space-y-2">
                    {newCustomField.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          placeholder={`Option ${index + 1}`}
                          disabled={disabled}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-800"
                          disabled={disabled}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    disabled={disabled}
                  >
                    + Add Option
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newCustomField.isRequired}
                    onChange={(e) => setNewCustomField(prev => ({ ...prev, isRequired: e.target.checked }))}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={disabled}
                  />
                  <span className="text-sm text-gray-700">Required field</span>
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustomField}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    disabled={disabled || !newCustomField.questionKey || !newCustomField.label}
                  >
                    Add Field
                  </button>
                  <button
                    onClick={() => setShowAddCustomField(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    disabled={disabled}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Custom Fields */}
        {customQuestions.length > 0 ? (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Your Custom Fields</h4>
            {customQuestions.map((question, index) => {
              const errorKey = `custom_${index}`;
              const hasError = validationErrors[errorKey];

              return (
                <div key={question.questionKey} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {question.label}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {inputTypes.find(t => t.value === question.type)?.label}
                        {question.sectionName && ` • Section: ${question.sectionName}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveCustomField(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      disabled={disabled}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Render appropriate input */}
                  {renderCustomQuestionInput(question)}

                  {hasError && (
                    <p className="text-sm text-red-600 mt-2">{hasError}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No custom fields added yet. Add your own questions if needed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFields;