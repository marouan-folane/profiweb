"use client";
import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import FieldDescriptionPopout from "./FieldDescriptionPopout";
import { questionTranslations } from "./questionTranslations";

// ─── Option presets (for built-in keys that don't get options from the API) ───
const CHECKBOX_PRESETS = {
    websitePages: ["Home", "About Us", "Services", "Portfolio", "Blog", "Contact", "FAQ", "Pricing", "Team", "Testimonials"],
    websiteLanguages: ["French", "Arabic", "English", "German", "Spanish"],
    outputLanguages: ["French", "Arabic", "English", "German"],
    toneAndDemeanor: ["Professional", "Reliable", "International", "Friendly", "Formal", "Casual", "Innovative", "Traditional"],
    tonality: ["Modern", "Classic", "Minimalist", "Bold", "Elegant", "Playful", "Corporate", "Creative"],
};
const SELECT_PRESETS = {
    legalForm: ["SARL", "SA", "SNC", "SCS", "SCA", "SCOP", "EI", "Micro-entreprise", "Auto-entrepreneur", "Association", "Other"],
    communicationLanguage: ["French", "Arabic", "English", "German"],
    businessType: ["B2B", "B2C", "B2B2C", "Non-profit", "Government", "Other"],
    logoAvailability: ["Yes - High quality", "Yes - Low quality", "No - Needs to be created"],
    corporateDesignAvailability: ["Yes - Complete brand guide", "Yes - Partial", "No"],
    imageAvailability: ["Yes - Professional photos", "Yes - Amateur photos", "No - Please use stock images"],
    imagesAvailable: ["yes", "no"],
    logoAvailable: ["Yes", "No"],
    corporateDesignAvailable: ["Yes", "No"],
};

// ─────────────────────────────────────────────────────────────────────────────
// DynamicField
// Renders ONE question item with:
//   - Proper input for every field type (text/textarea/select/checkbox/etc.)
//   - 🌐 Translator help popout (EN/FR/AR/DE) from questionTranslations.js
//   - 👁 Per-field admin visibility toggle
//   - ✏️  Admin inline edit mode (label, placeholder, required flag)
// ─────────────────────────────────────────────────────────────────────────────
const DynamicField = ({
    question,           // Question doc from API / registry
    value,             // Current answer (string | string[])
    onChange,          // (questionKey, value) => void
    isAdmin = false,
    canSeeHidden = false,
    onToggleVisibility, // (questionKey, isVisible) => void
    onEditSave,         // (questionKey, patch) => void  — admin field edit
    onDelete,           // (questionKey) => void         — admin field delete
    disabled = false,
    validationError,
}) => {
    const {
        questionKey,
        question: label,
        type = "text",
        isRequired = false,
        placeholder = "",
        options = [],
        isVisible = true,
        isSectionVisible = true,
        settings = {},
    } = question;

    const [showTranslation, setShowTranslation] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const popoutRef = useRef(null);
    const fieldId = `field_${questionKey}`;
    const translations =
        question.translations ||
        questionTranslations[questionKey] || {
            en: label,
            fr: label,
            ar: label,
            de: label,
        };

    const [editDraft, setEditDraft] = useState({
        label,
        placeholder,
        isRequired,
        translations: { ...translations }
    });

    // Keep draft in sync with props when they change
    useEffect(() => {
        setEditDraft({
            label,
            placeholder,
            isRequired,
            translations: { ...translations }
        });
    }, [label, placeholder, isRequired, JSON.stringify(translations)]);

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

    // Don't render if field is hidden and user cannot see hidden
    if ((!isVisible || !isSectionVisible) && !canSeeHidden) return null;

    // ── Resolve options from API or preset ──────────────────────────────────
    const resolveOptions = () => {
        if (options && options.length > 0) {
            return options.map((o) =>
                typeof o === "string" ? { value: o, label: o } : { value: o.value ?? o, label: o.label ?? o.value ?? o }
            );
        }
        const preset =
            CHECKBOX_PRESETS[questionKey] || SELECT_PRESETS[questionKey] || [];
        return preset.map((v) => ({ value: v, label: v }));
    };
    const resolvedOptions = resolveOptions();

    // ── Array value helper ───────────────────────────────────────────────────
    const currentArray = Array.isArray(value)
        ? value
        : typeof value === "string" && value
            ? value.split(", ").filter(Boolean)
            : [];

    const handleCheckboxToggle = (opt) => {
        const next = currentArray.includes(opt)
            ? currentArray.filter((v) => v !== opt)
            : [...currentArray, opt];
        onChange(questionKey, next);
    };

    // ── Base input class ─────────────────────────────────────────────────────
    const inputCls = [
        "w-full px-3 py-2 border rounded-lg outline-none transition-all duration-150",
        "focus:ring-2 focus:ring-primary/30 focus:border-primary",
        "placeholder:text-gray-400 text-sm",
        validationError
            ? "border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-400"
            : "border-gray-300 bg-white",
        disabled
            ? "bg-gray-50 text-gray-400 cursor-not-allowed"
            : (!isVisible && canSeeHidden) ? "bg-gray-50 text-gray-400" : "",
    ]
        .filter(Boolean)
        .join(" ");

    // ── Render input by type ─────────────────────────────────────────────────
    const renderInput = () => {
        switch (type) {
            case "textarea":
                return (
                    <textarea
                        id={fieldId}
                        value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        placeholder={placeholder}
                        rows={settings?.rows || 4}
                        maxLength={settings?.maxLength}
                        disabled={disabled}
                        className={`${inputCls} resize-y`}
                    />
                );

            case "select":
                return (
                    <select
                        id={fieldId}
                        value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        disabled={disabled}
                        className={inputCls}
                    >
                        <option value="">Select…</option>
                        {resolvedOptions.map((o, i) => (
                            <option key={i} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                );

            case "checkbox":
            case "multiselect":
                if (resolvedOptions.length === 0) break; // fallback to text below
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {resolvedOptions.map((o, i) => (
                            <label
                                key={i}
                                className={`flex items-center gap-2 cursor-pointer text-sm rounded-lg px-2.5 py-1.5 border transition-colors ${currentArray.includes(o.value)
                                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={currentArray.includes(o.value)}
                                    onChange={() => handleCheckboxToggle(o.value)}
                                    disabled={disabled}
                                    className="h-3.5 w-3.5 text-primary border-gray-300 rounded"
                                />
                                {o.label}
                            </label>
                        ))}
                    </div>
                );

            case "radio":
                return (
                    <div className="flex flex-wrap gap-3 pt-1">
                        {resolvedOptions.map((o, i) => (
                            <label
                                key={i}
                                className={`flex items-center gap-2 cursor-pointer text-sm rounded-lg px-3 py-1.5 border transition-colors ${value === o.value
                                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name={fieldId}
                                    value={o.value}
                                    checked={value === o.value}
                                    onChange={(e) => onChange(questionKey, e.target.value)}
                                    disabled={disabled}
                                    className="h-3.5 w-3.5 text-primary"
                                />
                                {o.label}
                            </label>
                        ))}
                    </div>
                );

            case "number":
                return (
                    <input id={fieldId} type="number" value={value || ""} min={settings?.min} max={settings?.max}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        placeholder={placeholder} disabled={disabled} className={inputCls} />
                );
            case "email":
                return (
                    <input id={fieldId} type="email" value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        placeholder={placeholder || "e.g. info@company.com"} disabled={disabled} className={inputCls} />
                );
            case "tel":
                return (
                    <input id={fieldId} type="tel" value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        placeholder={placeholder || "+212 XXX-XXXXXX"} disabled={disabled} className={inputCls} />
                );
            case "url":
                return (
                    <input id={fieldId} type="url" value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        placeholder={placeholder || "https://"} disabled={disabled} className={inputCls} />
                );
            case "date":
                return (
                    <input id={fieldId} type="date" value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        disabled={disabled} className={inputCls} />
                );
            default: // text
                return (
                    <input id={fieldId} type="text" value={value || ""}
                        onChange={(e) => onChange(questionKey, e.target.value)}
                        placeholder={placeholder} maxLength={settings?.maxLength}
                        disabled={disabled} className={inputCls} />
                );
        }
    };

    // ── Admin: inline edit panel ─────────────────────────────────────────────
    const renderEditPanel = () => (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3 text-xs">
            <p className="font-semibold text-amber-800 flex items-center gap-1.5 border-b border-amber-200 pb-2">
                <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                Edit field — <code className="font-mono text-amber-700">{questionKey}</code>
            </p>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="block text-gray-600 font-semibold uppercase tracking-wider text-[9px]">Label</label>
                    <input
                        type="text" value={editDraft.label}
                        onChange={(e) => setEditDraft((p) => ({ ...p, label: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-gray-600 font-semibold uppercase tracking-wider text-[9px]">Placeholder</label>
                    <input
                        type="text" value={editDraft.placeholder}
                        onChange={(e) => setEditDraft((p) => ({ ...p, placeholder: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="block text-gray-600 font-semibold uppercase tracking-wider text-[9px] mb-1">Help Descriptions (Translations)</label>
                <div className="grid grid-cols-2 gap-2">
                    {['en', 'fr', 'ar', 'de'].map(langKey => (
                        <div key={langKey} className="space-y-0.5">
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{langKey}</span>
                            <textarea
                                rows={2}
                                value={editDraft.translations?.[langKey] || ""}
                                dir={langKey === 'ar' ? 'rtl' : 'ltr'}
                                onChange={(e) => setEditDraft(p => ({
                                    ...p,
                                    translations: { ...p.translations, [langKey]: e.target.value }
                                }))}
                                className="w-full border border-gray-200 rounded-md px-2 py-1 bg-white text-[11px] focus:ring-2 focus:ring-primary/10 outline-none resize-none"
                                placeholder={`Translate to ${langKey.toUpperCase()}...`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium py-1">
                <input
                    type="checkbox" checked={editDraft.isRequired}
                    onChange={(e) => setEditDraft((p) => ({ ...p, isRequired: e.target.checked }))}
                    className="h-3.5 w-3.5 text-primary rounded ring-offset-0 focus:ring-primary/30"
                />
                Mark as required
            </label>

            <div className="flex gap-2 pt-2 border-t border-amber-200">
                <button type="button"
                    onClick={() => {
                        onEditSave?.(questionKey, editDraft);
                        setEditMode(false);
                    }}
                    className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                >
                    Save changes
                </button>
                <button type="button"
                    onClick={() => {
                        setEditMode(false);
                        setEditDraft({ label, placeholder, isRequired, translations: { ...translations } });
                    }}
                    className="px-4 py-1.5 text-gray-600 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-all active:scale-95"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    // ── Display label (supports edit mode ─────────────────────────────────────
    const displayLabel = editMode ? editDraft.label : label;

    return (
        <div
            data-field={questionKey}
            className={`space-y-1.5 transition-opacity duration-200 ${!isVisible && canSeeHidden ? "opacity-40 ring-1 ring-dashed ring-gray-300 rounded-lg p-3 -mx-3" : ""
                }`}
        >
            {/* ── Label row ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-1 flex-wrap">
                <label htmlFor={fieldId} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    {displayLabel}
                    {(editMode ? editDraft.isRequired : isRequired) && (
                        <span className="text-red-500">*</span>
                    )}

                    {/* 🌐 Translation help popout trigger (visible for all roles) */}
                    <div className="relative inline-block" ref={popoutRef}>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setShowTranslation((v) => !v); }}
                            className="text-gray-400 hover:text-indigo-500 transition-colors ml-0.5"
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
                    </div>
                </label>

                {/* Admin control buttons */}
                {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Edit field button */}
                        {onEditSave && (
                            <button
                                type="button"
                                onClick={() => setEditMode((v) => !v)}
                                className={`p-1 rounded transition-colors text-xs ${editMode
                                    ? "text-amber-600 bg-amber-100"
                                    : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                    }`}
                                title="Edit field label / placeholder"
                            >
                                <Icon icon="lucide:pencil" className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Visibility toggle */}
                        {onToggleVisibility && (
                            <button
                                type="button"
                                onClick={() => onToggleVisibility(questionKey, !isVisible)}
                                className={`p-1 rounded transition-colors ${isVisible
                                    ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    : "text-red-500 bg-red-50 hover:bg-red-100"
                                    }`}
                                title={isVisible ? "Hide from client" : "Currently hidden — click to show"}
                            >
                                <Icon icon={isVisible ? "lucide:eye" : "lucide:eye-off"} className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Delete button */}
                        {isAdmin && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(questionKey)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete field globally"
                            >
                                <Icon icon="lucide:trash-2" className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Admin edit panel ────────────────────────────────────────────── */}
            {editMode && renderEditPanel()}

            {/* ── Input ───────────────────────────────────────────────────────── */}
            {!editMode && renderInput()}

            {/* ── Validation error ────────────────────────────────────────────── */}
            {validationError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                    <Icon icon="lucide:circle-alert" className="w-3 h-3" />
                    {validationError}
                </p>
            )}

            {/* Hidden badge for admin/info */}
            {(!isVisible || !isSectionVisible) && canSeeHidden && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <Icon icon="lucide:eye-off" className="w-3 h-3" />
                    Hidden from output / Final report
                </p>
            )}
        </div>
    );
};

export default DynamicField;
