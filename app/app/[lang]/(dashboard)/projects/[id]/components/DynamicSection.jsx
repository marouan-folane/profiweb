"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import DynamicField from "./DynamicField";
import {
    useDroppable,
    useDraggable,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─────────────────────────────────────────────────────────────────────────────
// DynamicSection
// Renders one section (group of questions) with:
//   - Section header with admin eye/hide toggle
//   - Collapse animation when admin hides the section
//   - "Add field" panel for admins (custom champs)
//   - Each field rendered via <DynamicField /> with sortable drag support
// ─────────────────────────────────────────────────────────────────────────────
const FIELD_TYPES = [
    { value: "text", label: "Text" },
    { value: "textarea", label: "Long text" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "tel", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "date", label: "Date" },
    { value: "select", label: "Dropdown (select)" },
    { value: "checkbox", label: "Checkboxes (multi)" },
    { value: "radio", label: "Radio buttons" },
];

const emptyNewField = () => ({
    questionKey: "",
    label: "",
    type: "text",
    placeholder: "",
    isRequired: false,
    options: "",  // comma-separated string, converted on save
    // Optional multi-language helper text for the ? popup
    descriptionEn: "",
    descriptionFr: "",
    descriptionAr: "",
    descriptionDe: "",
});

// ─── SortableQuestionItem: wraps each question with @dnd-kit drag handle ───
const SortableQuestionItem = ({
    question,
    formValues,
    onFieldChange,
    isAdmin,
    canSeeHidden,
    onToggleField,
    onEditSave,
    onDelete,
    disabled,
    validationErrors,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: question.questionKey,
        data: { question },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div ref={setNodeRef} style={style} className="group relative">
            {/* ── Drag handle (visible on hover, admin-only) ── */}
            {isAdmin && !disabled && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
                    title="Drag to move question to another section"
                >
                    <Icon icon="lucide:grip-vertical" className="w-4 h-4" />
                </div>
            )}
            <DynamicField
                question={question}
                value={formValues[question.questionKey] ?? question.answer ?? ""}
                onChange={onFieldChange}
                isAdmin={isAdmin}
                canSeeHidden={canSeeHidden}
                onToggleVisibility={isAdmin ? onToggleField : undefined}
                onEditSave={isAdmin ? onEditSave : undefined}
                onDelete={isAdmin ? (key) => onDelete(key) : undefined}
                disabled={disabled}
                validationError={validationErrors[question.questionKey]}
            />
        </div>
    );
};

const DynamicSection = ({
    section,             // { section, sectionName, questions: Question[] }
    formValues,          // { [questionKey]: value }
    onFieldChange,       // (questionKey, value) => void
    onToggleSection,     // (sectionId, isVisible) => void   — admin only
    onToggleField,       // (questionKey, isVisible) => void — admin only
    onAddCustomField,    // (sectionId, newField) => void    — admin only
    onEditSave,          // (questionKey, patch) => void     — admin only
    onDelete,            // (questionKey) => void            — admin only
    isAdmin = false,
    canSeeHidden = false,
    disabled = false,
    validationErrors = {},
}) => {
    const [showAddField, setShowAddField] = useState(false);
    const [newField, setNewField] = useState(emptyNewField());
    const [addError, setAddError] = useState("");

    // Derive section visibility from the first question's isSectionVisible
    const isSectionVisible = section.questions.length > 0 && section.questions[0]?.isSectionVisible !== false;

    // Only count visible questions for the badge
    const visibleCount = section.questions.filter(
        (q) => q.isVisible !== false && q.isSectionVisible !== false
    ).length;

    // ── Droppable zone so questions from other sections can be dropped here ──
    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `section-drop-${section.section}`,
        data: { sectionId: section.section },
    });

    // Strict hiding:
    if (section.questions.length === 0 && !isAdmin) return null;
    if (!isSectionVisible && !canSeeHidden) return null;

    const handleNewFieldChange = (key, val) => {
        setNewField((prev) => ({ ...prev, [key]: val }));
        setAddError("");
    };

    const handleSaveNewField = () => {
        if (!newField.label.trim()) {
            setAddError("Field label is required.");
            return;
        }
        const key =
            newField.questionKey.trim() ||
            `custom_${section.section}_${Date.now()}`;

        const parsedOptions = newField.options
            ? newField.options
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean)
                .map((o) => ({ value: o, label: o }))
            : [];

        onAddCustomField(section.section, {
            questionKey: key,
            question: newField.label.trim(),
            type: newField.type,
            placeholder: newField.placeholder,
            isRequired: newField.isRequired,
            section: section.section,
            sectionName: section.sectionName,
            options: parsedOptions,
            isCustom: true,
            isVisible: true,
            isSectionVisible: true,
            translations: {
                en: newField.descriptionEn?.trim() || "",
                fr: newField.descriptionFr?.trim() || "",
                ar: newField.descriptionAr?.trim() || "",
                de: newField.descriptionDe?.trim() || "",
            },
        });

        setNewField(emptyNewField());
        setShowAddField(false);
        setAddError("");
    };

    const questionKeys = section.questions
        .filter((q) => q.isVisible !== false || canSeeHidden)
        .map((q) => q.questionKey);

    return (
        <div
            className={`rounded-xl border transition-all duration-300 mb-5 overflow-hidden ${!isSectionVisible && isAdmin
                ? "border-dashed border-gray-300 opacity-60"
                : "border-gray-200 shadow-sm"
                }`}
        >
            
            {/* ── Section Header ─────────────────────────────────────────────── */}
            <div
                className={`flex items-center justify-between px-6 py-4 ${isSectionVisible ? "bg-primary" : "bg-gray-200"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <h3 className={`text-base font-semibold ${isSectionVisible ? "text-white" : "text-gray-500"}`}>
                        {section.sectionName}
                    </h3>

                    {/* Field count badge */}
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSectionVisible
                            ? "bg-white/20 text-white"
                            : "bg-gray-300 text-gray-600"
                            }`}
                    >
                        {visibleCount} field{visibleCount !== 1 ? "s" : ""}
                    </span>

                    {/* Section key badge (always visible) */}
                    <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isSectionVisible
                            ? "bg-white/10 text-white/70"
                            : "bg-gray-100 text-gray-400"
                            }`}
                    >
                        {section.section}
                    </span>

                    {/* Hidden badge */}
                    {!isSectionVisible && isAdmin && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium flex items-center gap-1">
                            <Icon icon="lucide:eye-off" className="w-3 h-3" />
                            Hidden from client
                        </span>
                    )}
                </div>
                

                {/* Admin: section-level visibility toggle */}
                {isAdmin && onToggleSection && (
                    <button
                        type="button"
                        onClick={() => onToggleSection(section.section, !isSectionVisible)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${isSectionVisible
                            ? "bg-white/20 text-white hover:bg-white/30"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                        title={isSectionVisible ? "Hide this section from client" : "Show this section"}
                    >
                        <Icon
                            icon={isSectionVisible ? "lucide:eye-off" : "lucide:eye"}
                            className="w-3.5 h-3.5"
                        />
                        {isSectionVisible ? "Hide section" : "Show section"}
                    </button>
                )}
            </div>
            

            {/* ── Fields (droppable + sortable zone) ───────────────────────────── */}
            <div
                ref={setDropRef}
                className={`p-6 space-y-5 transition-colors duration-150 min-h-[60px] ${isOver ? "bg-blue-50 ring-2 ring-inset ring-blue-300 rounded-b-xl" : ""}`}
            >
                <SortableContext items={questionKeys} strategy={verticalListSortingStrategy}>
                    {section.questions.map((q) => {
                        if (!q.isVisible && !canSeeHidden) return null;

                        return (
                            <SortableQuestionItem
                                key={q.questionKey}
                                question={q}
                                formValues={formValues}
                                onFieldChange={onFieldChange}
                                isAdmin={isAdmin}
                                canSeeHidden={canSeeHidden}
                                onToggleField={onToggleField}
                                onEditSave={onEditSave}
                                onDelete={onDelete}
                                disabled={disabled}
                                validationErrors={validationErrors}
                            />
                        );
                    })}
                </SortableContext>

                {section.questions.length === 0 && (
                    <div className={`py-6 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed ${isOver ? "border-blue-400 bg-blue-50" : "border-gray-200"}`}>
                        <Icon icon="lucide:plus-circle" className="w-5 h-5 text-gray-300" />
                        <p className="text-sm text-gray-400 italic">
                            {isOver ? "Drop question here" : "No questions in this section yet."}
                        </p>
                    </div>
                )}

                {/* ── Admin: Add Custom Field Panel ─────────────────────────────── */}
                {isAdmin && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                        {!showAddField ? (
                            <button
                                type="button"
                                onClick={() => setShowAddField(true)}
                                className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                            >
                                <Icon icon="lucide:plus-circle" className="w-4 h-4" />
                                Add custom field to this section
                            </button>
                        ) : (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                    <Icon icon="lucide:plus-circle" className="w-4 h-4" />
                                    New custom field — {section.sectionName}
                                </h4>

                                {/* Label */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Field label <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newField.label}
                                        onChange={(e) => handleNewFieldChange("label", e.target.value)}
                                        placeholder="e.g. Secondary phone number"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                {/* Type + Placeholder */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Field type
                                        </label>
                                        <select
                                            value={newField.type}
                                            onChange={(e) => handleNewFieldChange("type", e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            {FIELD_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Placeholder text
                                        </label>
                                        <input
                                            type="text"
                                            value={newField.placeholder}
                                            onChange={(e) => handleNewFieldChange("placeholder", e.target.value)}
                                            placeholder="Optional hint text…"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Options (for select/checkbox/radio) */}
                                {["select", "checkbox", "radio", "multiselect"].includes(newField.type) && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Options <span className="text-gray-400">(comma-separated)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newField.options}
                                            onChange={(e) => handleNewFieldChange("options", e.target.value)}
                                            placeholder="Option A, Option B, Option C"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                )}

                                {/* Required toggle */}
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={newField.isRequired}
                                        onChange={(e) => handleNewFieldChange("isRequired", e.target.checked)}
                                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    Mark as required
                                </label>

                                {/* Multi-language descriptions for ? popup */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Description (EN)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={newField.descriptionEn}
                                            onChange={(e) => handleNewFieldChange("descriptionEn", e.target.value)}
                                            placeholder="Help text shown in English"
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary resize-y"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Description (FR)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={newField.descriptionFr}
                                            onChange={(e) => handleNewFieldChange("descriptionFr", e.target.value)}
                                            placeholder="Texte d'aide en français"
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary resize-y"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Description (AR)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={newField.descriptionAr}
                                            onChange={(e) => handleNewFieldChange("descriptionAr", e.target.value)}
                                            placeholder="نص المساعدة بالعربية"
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary resize-y"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            Description (DE)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={newField.descriptionDe}
                                            onChange={(e) => handleNewFieldChange("descriptionDe", e.target.value)}
                                            placeholder="Hilfetext auf Deutsch"
                                            className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-primary resize-y"
                                        />
                                    </div>
                                </div>

                                {addError && (
                                    <p className="text-xs text-red-600">{addError}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleSaveNewField}
                                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors font-medium"
                                    >
                                        Add field
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddField(false);
                                            setNewField(emptyNewField());
                                            setAddError("");
                                        }}
                                        className="px-4 py-2 text-gray-600 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DynamicSection;
