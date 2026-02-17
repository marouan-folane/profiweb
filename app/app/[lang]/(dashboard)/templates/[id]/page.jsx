"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTemplateById, updateTemplate } from "@/config/functions/template";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import Link from "next/link";

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const templateId = params.id;

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        shortDesc: "",
        structure: "",
        colors: "",
    });
    const [errors, setErrors] = useState({});
    const textareaRef = useRef(null);

    // Fetch template data
    const { data: templateRes, isLoading, isError, error } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => getTemplateById(templateId),
        enabled: !!templateId,
    });

    const template = templateRes?.data?.template || templateRes?.template;

    // Initialize form data when template is loaded
    useEffect(() => {
        if (template) {
            setFormData({
                title: template.title || "",
                shortDesc: template.shortDesc || "",
                structure: template.structure || "",
                colors: Array.isArray(template.colors) ? template.colors.join(", ") : "",
            });
        }
    }, [template]);

    // Update template mutation
    const updateMutation = useMutation({
        mutationFn: (data) => updateTemplate(templateId, data),
        onSuccess: (result) => {
            if (result.status === "success" || result.data) {
                toast.success("Template updated successfully!");
                queryClient.invalidateQueries(['template', templateId]);
                queryClient.invalidateQueries(['templates']);
                setIsEditing(false);
            } else {
                toast.error(result.message || "Failed to update template");
            }
        },
        onError: (err) => {
            toast.error(err.message || "An error occurred during update");
        }
    });

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = "Template title is required";
        if (!formData.shortDesc.trim()) newErrors.shortDesc = "Short description is required";
        if (!formData.structure.trim()) newErrors.structure = "Template structure is required";

        if (formData.colors) {
            const colorArray = formData.colors.split(",").map(c => c.trim()).filter(c => c);
            const invalidColors = colorArray.filter(c => !/^#([0-9A-F]{3}){1,2}$/i.test(c) && !/^(rgb|hsl|rgba|hsla)\(/.test(c));
            if (invalidColors.length > 0) {
                newErrors.colors = `Invalid colors: ${invalidColors.join(", ")}`;
            }
        }
        return newErrors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const colorsArray = formData.colors.split(",").map(c => c.trim()).filter(c => c);
        updateMutation.mutate({
            title: formData.title,
            shortDesc: formData.shortDesc,
            structure: formData.structure,
            colors: colorsArray,
        });
    };

    // Text editor functions for lists only - UPDATED to ensure items are on separate lines
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Icon icon="eos-icons:loading" className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (isError || !template) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
                <Icon icon="heroicons:exclamation-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Template</h2>
                <p className="text-red-600 mb-6">{error?.message || "Template not found"}</p>
                <Link href="/templates/list" className="text-blue-600 hover:underline font-medium">
                    Back to list
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Breadcrumbs */}
            <nav className="flex mb-8 text-sm text-gray-500 items-center space-x-2">
                <Link href="/templates/list" className="hover:text-blue-600 transition-colors">Templates</Link>
                <Icon icon="heroicons:chevron-right" className="w-4 h-4" />
                <span className="text-gray-900 font-medium truncate">{template.title}</span>
            </nav>

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                                {isEditing ? "Edit Template" : template.title}
                            </h1>
                            <p className="text-gray-600">{isEditing ? "Modify template details below" : template.shortDesc}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                                >
                                    <Icon icon="heroicons:pencil-square" className="w-5 h-5 mr-2" />
                                    Edit Template
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="inline-flex items-center px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Template Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Short Description *</label>
                                <textarea
                                    name="shortDesc"
                                    value={formData.shortDesc}
                                    onChange={handleChange}
                                    rows={2}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.shortDesc ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                                />
                                {errors.shortDesc && <p className="mt-1 text-sm text-red-500">{errors.shortDesc}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-700">Instructions / Structure *</label>
                                    <div className="text-xs text-gray-500">
                                        Use toolbar for list formatting (each item on new line)
                                    </div>
                                </div>
                                
                                {/* Simplified Toolbar - Lists only */}
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

                                {/* Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    name="structure"
                                    value={formData.structure}
                                    onChange={handleChange}
                                    rows={12}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 ${errors.structure ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                                />
                                {errors.structure && <p className="mt-1 text-sm text-red-500">{errors.structure}</p>}
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg"
                                >
                                    {updateMutation.isPending ? (
                                        <Icon icon="eos-icons:loading" className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                        <Icon icon="heroicons:check-circle" className="w-5 h-5 mr-2" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Instructions</h3>
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 font-mono text-sm whitespace-pre-wrap text-gray-800 leading-relaxed shadow-inner">
                                    {template.structure}
                                </div>
                            </section>

                            {template.colors && template.colors.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Color Palette</h3>
                                    <div className="flex flex-wrap gap-4">
                                        {template.colors.map((color, i) => (
                                            <div key={i} className="group relative">
                                                <div
                                                    className="w-16 h-16 rounded-2xl shadow-md border-2 border-white ring-1 ring-gray-100 transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {color}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section className="pt-8 border-t border-gray-100">
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center">
                                        <Icon icon="heroicons:calendar" className="w-4 h-4 mr-1.5" />
                                        Created on {new Date(template.createdAt).toLocaleDateString()}
                                    </div>
                                    {template.createdBy && (
                                        <div className="flex items-center">
                                            <Icon icon="heroicons:user-circle" className="w-4 h-4 mr-1.5" />
                                            ID: {template.createdBy}
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Page;