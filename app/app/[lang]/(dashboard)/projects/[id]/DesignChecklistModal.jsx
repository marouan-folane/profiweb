"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { getProjectChecklist, createOrUpdateItem } from "@/config/functions/checklist";
import { validateDesignChecklist, completeDesignWorkflow, getProject } from "@/config/functions/project";
import { useQueryClient } from "@tanstack/react-query";

const designDepartmentSections = [
    {
        id: 'visual_identity',
        title: "Visual Identity",
        items: [
            { id: 'color_palette', label: 'Color palette selected and documented', checked: false },
            { id: 'typography', label: 'Typography system established', checked: false },
            { id: 'logo_usage', label: 'Logo usage guidelines created', checked: false },
            { id: 'iconography', label: 'Iconography style defined', checked: false },
        ]
    },
    {
        id: 'layout_design',
        title: "Layout & Wireframing",
        items: [
            { id: 'wireframes', label: 'Website wireframes created', checked: false },
            { id: 'responsive_design', label: 'Responsive design mockups', checked: false },
            { id: 'ui_components', label: 'UI component library created', checked: false },
            { id: 'spacing_system', label: 'Spacing and grid system defined', checked: false },
        ]
    },
    {
        id: 'graphic_elements',
        title: "Graphic Elements",
        items: [
            { id: 'custom_illustrations', label: 'Custom illustrations created', checked: false },
            { id: 'photo_selection', label: 'Photography selected/created', checked: false },
            { id: 'animations', label: 'Micro-animations designed', checked: false },
            { id: 'graphic_patterns', label: 'Graphic patterns/textures', checked: false },
        ]
    }
];

const DesignChecklistModal = ({ isOpen, onClose, projectId, projectTitle, onSuccess }) => {
    const queryClient = useQueryClient();
    const [sections, setSections] = useState(designDepartmentSections);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [project, setProject] = useState(null);

    useEffect(() => {
        if (isOpen && projectId) {
            loadData();
        }
    }, [isOpen, projectId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [checklistRes, projectRes] = await Promise.all([
                getProjectChecklist(projectId),
                getProject(projectId)
            ]);

            if (projectRes.status === 'success') {
                setProject(projectRes.data.project);
            }

            if (checklistRes.status === 'success') {
                const savedSections = checklistRes.data.sections;
                const merged = designDepartmentSections.map(section => {
                    const saved = savedSections.find(s => s.id === section.id);
                    if (!saved) return section;
                    return {
                        ...section,
                        items: section.items.map(item => {
                            const savedItem = saved.items.find(si => si.id === item.id);
                            return savedItem ? { ...item, checked: savedItem.checked } : item;
                        })
                    };
                });
                setSections(merged);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            toast.error("Failed to load checklist data");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = async (sectionId, itemId) => {
        if (project?.designStatus === 'completed') return;

        const updated = sections.map(section => {
            if (section.id !== sectionId) return section;
            return {
                ...section,
                items: section.items.map(item => {
                    if (item.id !== itemId) return item;
                    const updatedItem = { ...item, checked: !item.checked };

                    // Persist change
                    setIsSaving(true);
                    createOrUpdateItem(projectId, {
                        itemId: updatedItem.id,
                        label: updatedItem.label,
                        checked: updatedItem.checked,
                        isCustom: false,
                        sectionId: section.id
                    }).finally(() => setIsSaving(false));

                    return updatedItem;
                })
            };
        });
        setSections(updated);
    };

    const allChecked = sections.every(s => s.items.every(i => i.checked));
    const checkedCount = sections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0);
    const totalCount = sections.reduce((acc, s) => acc + s.items.length, 0);

    const handleConfirm = async () => {
        if (!allChecked) {
            toast.error("Please complete all items before confirming");
            return;
        }

        setIsConfirming(true);
        try {
            // 1. Validate checklist
            const validateRes = await validateDesignChecklist(projectId);
            if (validateRes.status !== 'success') {
                toast.error(validateRes.message || "Failed to validate checklist");
                return;
            }

            // 2. Complete workflow
            const completeRes = await completeDesignWorkflow(projectId);
            if (completeRes.status === 'success') {
                toast.success("Design workflow completed successfully!");
                queryClient.invalidateQueries(['projects']);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(completeRes.message || "Failed to complete workflow");
            }
        } catch (err) {
            console.error('Error confirming:', err);
            toast.error("An error occurred");
        } finally {
            setIsConfirming(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                            <Icon icon="lucide:palette" className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Design Department Checklist</DialogTitle>
                            <p className="text-sm text-gray-500">{projectTitle}</p>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-20 text-center">
                        <Icon icon="lucide:loader-2" className="w-10 h-10 animate-spin text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Loading checklist...</p>
                    </div>
                ) : (
                    <div className="space-y-6 my-4">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="text-sm font-medium text-gray-600">
                                Progress: <span className="text-indigo-600">{checkedCount}/{totalCount} items completed</span>
                            </div>
                            <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full transition-all duration-500"
                                    style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                                />
                            </div>
                        </div>

                        {sections.map(section => (
                            <div key={section.id} className="space-y-3">
                                <h3 className="font-bold text-gray-900 border-l-4 border-pink-500 pl-3 leading-none">{section.title}</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {section.items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(section.id, item.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${item.checked ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-200 hover:border-pink-300'}`}
                                        >
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 text-white' : 'bg-gray-100 text-transparent group-hover:bg-pink-100'}`}>
                                                <Icon icon="lucide:check" className="w-3.5 h-3.5 stroke-[3]" />
                                            </div>
                                            <span className={`text-sm font-medium transition-all ${item.checked ? 'text-green-800 line-through' : 'text-gray-700'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                    <div className="flex w-full items-center justify-between gap-4">
                        <Button variant="outline" onClick={onClose} disabled={isConfirming || isSaving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!allChecked || isConfirming || isSaving || project?.designStatus === 'completed'}
                            className={`flex-1 gap-2 ${allChecked ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200' : 'bg-gray-200 cursor-not-allowed text-gray-500'}`}
                        >
                            {isConfirming ? (
                                <>
                                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                <>
                                    <Icon icon="lucide:check-circle" className="w-4 h-4" />
                                    {project?.designStatus === 'completed' ? 'Design Workflow Completed' : 'Confirm Design Completion'}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DesignChecklistModal;
