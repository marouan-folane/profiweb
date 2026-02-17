// components/questions/QuestionRenderer.jsx
const QuestionRenderer = ({ question, value, onChange, isSaving }) => {
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
        {question.questionText}
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