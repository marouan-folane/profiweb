"use client";

import { useState, useRef } from "react";
import { createTemplate } from "@/config/functions/template";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

const Page = () => {
  const router = useRouter();
  const textareaRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    shortDesc: "",
    structure: "",
    colors: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Template title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title should not exceed 100 characters";
    }

    // Short description validation
    if (!formData.shortDesc.trim()) {
      newErrors.shortDesc = "Short description is required";
    } else if (formData.shortDesc.length > 200) {
      newErrors.shortDesc = "Short description should not exceed 200 characters";
    }

    // Structure validation
    if (!formData.structure.trim()) {
      newErrors.structure = "Template structure is required";
    }

    // Colors validation (optional but if provided, validate format)
    if (formData.colors) {
      const colorArray = formData.colors
        .split(",")
        .map((color) => color.trim())
        .filter((color) => color);

      const invalidColors = colorArray.filter(
        (color) => !/^#([0-9A-F]{3}){1,2}$/i.test(color) && !/^(rgb|hsl|rgba|hsla)\(/.test(color)
      );

      if (invalidColors.length > 0) {
        newErrors.colors = `Invalid color format: ${invalidColors.join(", ")}. Use hex (#RRGGBB) or CSS color functions`;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Show error toast for validation errors
      toast.error("Please fix the form errors", {
        description: "Check all required fields and try again.",
        duration: 5000,
      });
      return;
    }

    setLoading(true);

    try {
      // Process colors string into array
      const colorsArray = formData.colors
        .split(",")
        .map((color) => color.trim())
        .filter((color) => color);

      const templateData = {
        title: formData.title,
        shortDesc: formData.shortDesc,
        structure: formData.structure,
        colors: colorsArray,
      };

      // Show loading toast
      const loadingToast = toast.loading("Creating template...", {
        duration: Infinity,
      });

      // Call the createTemplate function
      const result = await createTemplate(templateData);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (result.status === "success") {
        // Show success toast
        toast.success(result.message || "Template created successfully!", {
          description: `"${formData.title}" has been added to your templates.`,
          duration: 5000,
        });

        router.push("/templates/list");

        // Reset form
        setFormData({
          title: "",
          shortDesc: "",
          structure: "",
          colors: "",
        });
      } else {
        // Show error toast
        toast.error("Failed to create template", {
          description: result.message || "Please try again.",
          duration: 5000,
        });

        setErrors({ submit: result.message || "Failed to create template" });
      }
    } catch (error) {
      // Show error toast
      toast.error("An error occurred", {
        description: error.message || "Please try again later.",
        duration: 5000,
      });

      setErrors({ submit: error.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleClearForm = () => {
    setFormData({
      title: "",
      shortDesc: "",
      structure: "",
      colors: "",
    });
    setErrors({});

    // Show info toast
    toast.info("Form cleared", {
      description: "All form fields have been reset.",
      duration: 3000,
    });
  };

  // List formatting functions
  const insertList = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.structure.substring(start, end);
    
    let listText = "";
    
    if (selectedText) {
      // If text is selected, convert each line to a list item (each on new line)
      const lines = selectedText.split('\n').filter(line => line.trim());
      if (type === 'bullet') {
        listText = lines.map(line => `• ${line}`).join('\n');
      } else if (type === 'dash') {
        listText = lines.map(line => `- ${line}`).join('\n');
      } else if (type === 'number') {
        listText = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
      }
      
      const newText = formData.structure.substring(0, start) + listText + formData.structure.substring(end);
      setFormData(prev => ({ ...prev, structure: newText }));
    } else {
      // If no text is selected, insert a new list with multiple items on separate lines
      const currentText = formData.structure;
      const cursorPos = start;
      const textBeforeCursor = currentText.substring(0, cursorPos);
      const textAfterCursor = currentText.substring(cursorPos);
      
      // Check if we're at the beginning of a line or need a new line
      const needsNewLine = cursorPos > 0 && currentText.charAt(cursorPos - 1) !== '\n';
      
      let listItems = "";
      switch(type) {
        case 'bullet':
          listItems = "• Item 1\n• Item 2\n• Item 3";
          break;
        case 'dash':
          listItems = "- Item 1\n- Item 2\n- Item 3";
          break;
        case 'number':
          listItems = "1. Item 1\n2. Item 2\n3. Item 3";
          break;
      }
      
      // Add newline before list if needed
      if (needsNewLine && cursorPos > 0) {
        listItems = '\n' + listItems;
      }
      
      // Add newline after list if needed
      if (textAfterCursor.length > 0 && !textAfterCursor.startsWith('\n')) {
        listItems = listItems + '\n';
      }
      
      const newText = textBeforeCursor + listItems + textAfterCursor;
      setFormData(prev => ({ ...prev, structure: newText }));
      
      // Focus back on textarea and place cursor at end of inserted text
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + listItems.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
            Create New Template
          </h1>
          <p className="text-lg text-gray-600">
            Design and add a new template to your collection
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-200">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errors.submit}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Field */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Template Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.title
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
                  }`}
                placeholder="Enter a unique template title (e.g., Modern Dashboard)"
                maxLength={100}
              />
              <div className="flex justify-between mt-2">
                {errors.title ? (
                  <p className="text-sm text-red-600">{errors.title}</p>
                ) : (
                  <div />
                )}
                <p className="text-sm text-gray-500">
                  {formData.title.length}/100 characters
                </p>
              </div>
            </div>

            {/* Short Description Field */}
            <div>
              <label
                htmlFor="shortDesc"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Short Description *
              </label>
              <textarea
                id="shortDesc"
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${errors.shortDesc
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
                  }`}
                placeholder="Briefly describe the template (e.g., A clean dashboard layout with modern components)"
                maxLength={200}
              />
              <div className="flex justify-between mt-2">
                {errors.shortDesc ? (
                  <p className="text-sm text-red-600">{errors.shortDesc}</p>
                ) : (
                  <div />
                )}
                <p className="text-sm text-gray-500">
                  {formData.shortDesc.length}/200 characters
                </p>
              </div>
            </div>

            {/* Structure Field with List Toolbar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="structure"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Instructions *
                </label>
                <div className="text-xs text-gray-500">
                  Use toolbar for list formatting (each item on new line)
                </div>
              </div>
              
              {/* List Formatting Toolbar */}
              <div className="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertList('bullet')}
                  className="px-3 py-2 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1 text-sm"
                  title="Bullet List (3 items on separate lines)"
                >
                  <Icon icon="heroicons:list-bullet" className="w-4 h-4" />
                  <span>• Bullet List</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertList('dash')}
                  className="px-3 py-2 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1 text-sm"
                  title="Dash List (3 items on separate lines)"
                >
                  <Icon icon="heroicons:minus" className="w-4 h-4" />
                  <span>- Dash List</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertList('number')}
                  className="px-3 py-2 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1 text-sm"
                  title="Numbered List (3 items on separate lines)"
                >
                  <Icon icon="heroicons:list-numbered" className="w-4 h-4" />
                  <span>1. Numbered List</span>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                id="structure"
                name="structure"
                value={formData.structure}
                onChange={handleChange}
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-mono text-sm ${errors.structure
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300 hover:border-gray-400"
                  }`}
                placeholder="Enter instructions or structure here..."
              />
              {errors.structure && (
                <p className="mt-2 text-sm text-red-600">{errors.structure}</p>
              )}
            </div>

            {/* Colors Field */}
            <div>
              <label
                htmlFor="colors"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Color Palette (Optional)
              </label>
              <input
                type="text"
                id="colors"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                  errors.colors
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                placeholder="Enter colors separated by commas (e.g., #3B82F6, #1E40AF, #93C5FD)"
              />
              {errors.colors ? (
                <p className="mt-2 text-sm text-red-600">{errors.colors}</p>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Use hex codes (#RRGGBB) or CSS color functions (rgb(), hsl(), etc.)
                </p>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating Template...
                    </>
                  ) : (
                    <>
                      <Icon icon="heroicons:plus-circle" className="w-5 h-5 mr-2" />
                      Create Template
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 flex items-center justify-center"
                >
                  <Icon icon="heroicons:x-circle" className="w-5 h-5 mr-2" />
                  Clear Form
                </button>
              </div>
            </div>

            {/* Required Fields Note */}
            <div className="mt-4 text-sm text-gray-500">
              <p className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Fields marked with * are required
              </p>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">List Formatting</h3>
            <p className="text-sm text-blue-700">
              Use the toolbar to insert bullet points, dashes, or numbered lists. Each item will be placed on a new line automatically.
            </p>
          </div>
          <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
            <h3 className="font-semibold text-purple-800 mb-2">Color Format</h3>
            <p className="text-sm text-purple-700">
              Use hex codes (#RRGGBB) or valid CSS color functions. Separate multiple colors with commas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;