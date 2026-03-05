"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import FieldDescriptionPopout from "@/components/questions/FieldDescriptionPopout";
import { questionTranslations } from "@/components/questions/questionTranslations";

// components/questions/QuestionRenderer.jsx
const QuestionRenderer = ({ question, value, onChange, isSaving }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const popoutRef = useRef(null);

  const questionKey = question?.questionKey;
  const translations =
    (questionKey && questionTranslations?.[questionKey]) || {
      en: question.questionText,
      fr: question.questionText,
      ar: question.questionText,
      de: question.questionText,
    };

  // Close translation popout on outside click
  useEffect(() => {
    if (!showTranslation) return;
    const handler = (e) => {
      if (popoutRef.current && !popoutRef.current.contains(e.target)) {
        setShowTranslation(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTranslation]);

  const renderInput = () => {
    switch (question.answerType) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            rows={4}
            disabled={isSaving}
            placeholder={`Enter ${question.questionText.toLowerCase()}...`}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={isSaving}
          >
            <option value="">Select an option...</option>
            {question.options.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'email':
      case 'tel':
        return (
          <input
            type={question.answerType}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={isSaving}
            placeholder={`Enter ${question.questionText.toLowerCase()}...`}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={isSaving}
            placeholder={`Enter ${question.questionText.toLowerCase()}...`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <span className="inline-flex items-center gap-1.5">
          {question.questionText}

          {/* 🌐 Translation help popout trigger (EN/FR/AR/DE) — visible for all roles */}
          <span className="relative inline-block" ref={popoutRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTranslation((v) => !v);
              }}
              className="text-gray-400 hover:text-indigo-500 transition-colors"
              title="Show field description in multiple languages"
            >
              <Icon icon="lucide:circle-help" className="w-3.5 h-3.5" />
            </button>
            {showTranslation && (
              <FieldDescriptionPopout
                translations={translations}
                onClose={() => setShowTranslation(false)}
              />
            )}
          </span>
        </span>
        {question.validation.required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
      {renderInput()}
      {isSaving && (
        <p className="text-xs text-gray-500">Saving...</p>
      )}
    </div>
  );
};

export default QuestionRenderer;