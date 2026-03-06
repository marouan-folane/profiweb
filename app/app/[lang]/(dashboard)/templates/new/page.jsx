"use client";

import { useState, useRef } from "react";
import { createTemplate } from "@/config/functions/template";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  XCircle,
  Layout,
  Settings2,
  Palette,
  ListOrdered,
  List,
  Minus,
  AlertCircle,
  Loader2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
        });

        setErrors({ submit: result.message || "Failed to create template" });
      }
    } catch (error) {
      // Show error toast
      toast.error("An error occurred", {
        description: error.message || "Please try again later.",
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
      switch (type) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-3xl md:text-4xl font-bold bg-clip-text  dark:from-white dark:via-white/90 dark:to-slate-400 mb-4 tracking-tight capitalize">
            Create New Template
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-base max-w-lg mx-auto leading-relaxed px-4">
            Propel your projects forward by defining a high-performance baseline structure.
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col gap-6 md:gap-8">
          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Title Field */}
              <div className="space-y-3">
                <label
                  htmlFor="title"
                  className="block text-[12px] sm:text-[14px]  font-bold dark:text-[#ddc165]/80 CAPITALIZE"
                >
                  Template Title *
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-[#FCCF3C] transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white/50 dark:bg-slate-900/50 border rounded-2xl focus:ring-2 focus:ring-[#FCCF3C]/20 focus:border-[#FCCF3C] dark:text-white transition-all duration-300 placeholder-slate-400 text-xs sm:text-sm ${errors.title ? "border-red-500/50 bg-red-500/5" : "border-slate-200 dark:border-white/10"
                      }`}
                    placeholder="Enter a unique template title (e.g., Modern Dashboard)"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="flex justify-between items-center px-2">
                  {errors.title ? (
                    <span className="text-[12px] sm:text-[14px] font-black text-red-500 tracking-wider font-xs">{errors.title}</span>
                  ) : <span />}
                  <span className="text-[12px] sm:text-[14px] font-black text-slate-400 tracking-wider">
                    {formData.title.length}/100
                  </span>
                </div>
              </div>

              {/* Colors Field */}
              <div className="space-y-3">
                <label
                  htmlFor="colors"
                  className="block text-[12px] sm:text-[14px] font-bold dark:text-[#ddc165]/80 CAPITALIZE"
                >
                  Color Palette (Optional)
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Palette className="h-4 w-4 text-slate-400 group-focus-within:text-[#FCCF3C] transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="colors"
                    name="colors"
                    value={formData.colors}
                    onChange={handleChange}
                    className={`w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white/50 dark:bg-slate-900/50 border rounded-2xl focus:ring-2 focus:ring-[#FCCF3C]/20 focus:border-[#FCCF3C] dark:text-white transition-all duration-300 placeholder-slate-400 text-xs sm:text-sm ${errors.colors ? "border-red-500/50 bg-red-500/5" : "border-slate-200 dark:border-white/10"
                      }`}
                    placeholder="#FCCF3C, #0F172A, #818CF8"
                  />
                </div>
                <div className="flex justify-between items-center px-2">
                  {errors.colors ? (
                    <span className="text-[12px] sm:text-[14px] font-black text-red-500 tracking-wider line-clamp-1">{errors.colors}</span>
                  ) : (
                    <span className="text-[10px] sm:text-[12px]  text-slate-400 tracking-wider flex items-center gap-1">
                      HEX, RGB, OR HSL SUPPORTED. Separate with commas.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Short Description Field */}
            <div className="space-y-3">
              <label
                htmlFor="shortDesc"
                className="block text-[12px] sm:text-[14px]  font-bold dark:text-[#ddc165]/80 CAPITALIZE"
              >
                Short Description *
              </label>
              <textarea
                id="shortDesc"
                name="shortDesc"
                value={formData.shortDesc}
                onChange={handleChange}
                rows={2}
                className={`w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/50 dark:bg-slate-900/50 border rounded-2xl focus:ring-2 focus:ring-[#FCCF3C]/20 focus:border-[#FCCF3C] dark:text-white transition-all duration-300 placeholder-slate-400 resize-none ${errors.shortDesc ? "border-red-500/50 bg-red-500/5" : "border-slate-200 dark:border-white/10"
                  }`}
                placeholder="Briefly describe the template (e.g., A clean dashboard layout with modern components)"
                maxLength={200}
              />
              <div className="flex justify-between items-center px-2">
                {errors.shortDesc ? (
                  <span className="text-[12px] sm:text-[14px]  text-red-500 tracking-wider">{errors.shortDesc}</span>
                ) : <span />}
                <span className="text-[12px] sm:text-[14px]  text-slate-400 tracking-wider">
                  {formData.shortDesc.length}/200
                </span>
              </div>
            </div>

            {/* Structure Field with List Toolbar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="structure"
                  className="text-[12px] sm:text-[14px] font-bold tracking-[0.2em] dark:text-[#ddc165]/80 CAPITALIZE"
                >
                  Instructions *
                </label>
                <span className="text-[12px] sm:text-[14px]  text-slate-400  tracking-widest hidden sm:block">
                  Rich formatting available via engine toolbar
                </span>
              </div>

              {/* List Formatting Toolbar */}
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-2 flex flex-wrap gap-2 shadow-inner">
                <button
                  type="button"
                  onClick={() => insertList('bullet')}
                  className="flex-1 min-w-[100px] sm:min-w-[120px] h-9 sm:h-10 px-2 sm:px-4 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] sm:text-[12px] md:text-[14px] font-black tracking-widest text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10 CAPITALIZE"
                >
                  <List className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FCCF3C]" />
                  <span>Bullets</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertList('dash')}
                  className="flex-1 min-w-[100px] sm:min-w-[120px] h-9 sm:h-10 px-2 sm:px-4 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] sm:text-[12px] md:text-[14px] font-black tracking-widest text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10 CAPITALIZE"
                >
                  <Minus className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FCCF3C]" />
                  <span>Dashes</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertList('number')}
                  className="flex-1 min-w-[100px] sm:min-w-[120px] h-9 sm:h-10 px-2 sm:px-4 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] sm:text-[12px] md:text-[14px] font-black tracking-widest text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-white/10 CAPITALIZE"
                >
                  <ListOrdered className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#FCCF3C]" />
                  <span>Numbred List</span>
                </button>
              </div>

              <textarea
                ref={textareaRef}
                id="structure"
                name="structure"
                value={formData.structure}
                onChange={handleChange}
                rows={8}
                className={`w-full px-4 sm:px-5 py-4 sm:py-5 bg-white/50 dark:bg-slate-900/50 border rounded-3xl focus:ring-2 focus:ring-[#FCCF3C]/20 focus:border-[#FCCF3C] dark:text-white transition-all duration-300 font-mono text-[13px] sm:text-sm leading-relaxed ${errors.structure ? "border-red-500/50 bg-red-500/5" : "border-slate-200 dark:border-white/10"
                  }`}
                placeholder="Enter instructions or structure here..."
              />
              {errors.structure && (
                <div className="px-2">
                  <span className="  text-[14px] font-black text-red-500  tracking-wider">{errors.structure}</span>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="pt-8 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-col sm:flex-row gap-5">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] h-12 sm:h-14 bg-[#FCCF3C] text-white font-black tracking-[0.2em] text-[10px] sm:text-xs rounded-2xl hover:opacity-90 shadow-xl shadow-yellow-500/10 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing ARCH-DATA...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                      <span>Create Template</span>
                    </div>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleClearForm}
                  className="flex-1 h-12  sm:h-14 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white font-black tracking-[0.2em] text-[10px] sm:text-xs rounded-2xl hover:bg-white dark:hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 mr-2 opacity-60 capitalize" />
                  Clear form
                </Button>
              </div>
            </div>
          </form>

          {/* Guidelines Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-6 rounded-2xl bg-[#FCCF3C]/5 dark:bg-[#FCCF3C]/5 border border-[#FCCF3C]/10 dark:border-[#FCCF3C]/5">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="h-4 w-4 text-[#ddc165]" />
                <h3 className="  text-[14px] font-black CAPITALIZE tracking-[0.2em] text-[#ddc165]">List Formatting</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Use the toolbar to insert bullet points, dashes, or numbered lists. Each item will be placed on a new line automatically.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-blue-500/5 dark:bg-blue-500/5 border border-blue-500/10 dark:border-blue-500/5">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-blue-500" />
                <h3 className="  text-[14px] font-black CAPITALIZE tracking-[0.2em] text-blue-500">Color Format</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Use hex codes (#RRGGBB) or valid CSS color functions. Separate multiple colors with commas.
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Page;
