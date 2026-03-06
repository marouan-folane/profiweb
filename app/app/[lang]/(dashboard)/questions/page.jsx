"use client";
import { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { QUESTION_REGISTRY, questionTranslations } from "../projects/[id]/components/questionTranslations";
import { useSession } from "next-auth/react";
import { api } from "@/config/axios.config";
import {
    DndContext, PointerSensor, KeyboardSensor,
    useSensor, useSensors, DragOverlay, closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext, verticalListSortingStrategy,
    useSortable, arrayMove, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Design tokens (Apple Style) ──────────────────────────────────────────────────
const A = {
    bg: "bg-[#F5F5F7]",          // Classic Apple gray background
    card: "bg-white",
    accent: "bg-[#0071E3]",      // Apple Blue
    accentH: "hover:bg-[#0077ED]",
    accentT: "text-[#0071E3]",
    accentB: "border-[#0071E3]",
    accentSh: "shadow-[#0071E330]",
    dark: "text-[#1D1D1F]",      // Deep charcoal/black
    mid: "text-[#86868B]",       // Apple secondary text gray
    border: "border-[#D2D2D7]",  // Soft gray divider
    glass: "backdrop-blur-xl bg-white/70",
};

// ── API ───────────────────────────────────────────────────────────────────────
const fetchTemplates = () => api.get("/question-templates").then(r => r.data);
const patchTemplate = ({ questionKey, data }) => api.patch(`/question-templates/${questionKey}`, data).then(r => r.data);
const postTemplate = (data) => api.post("/question-templates", data).then(r => r.data);
const deleteTemplate = (questionKey) => api.delete(`/question-templates/${questionKey}`).then(r => r.data);
const seedTemplates = (questions) => api.post("/question-templates/seed", { questions }).then(r => r.data);

// Section management API
const reorderSections = (sectionIds) => api.post("/question-templates/reorder-sections", { sectionIds }).then(r => r.data);
const createSection = (sectionId, sectionName, insertAfterSection) => api.post("/question-templates/create-section", { sectionId, sectionName, insertAfterSection }).then(r => r.data);
const updateSectionOrder = (sectionId, newOrder) => api.patch(`/question-templates/sections/${sectionId}/order`, { newOrder }).then(r => r.data);

// ── Helpers (defined outside component to avoid re-creation) ──────────────────
const buildMap = (qs) => {
    const m = new Map();
    qs.forEach(q => {
        if (!m.has(q.section)) m.set(q.section, { sectionId: q.section, sectionName: q.sectionName || q.section, questions: [] });
        m.get(q.section).questions.push(q);
    });
    return m;
};

/**
 * Custom collision detector: when dragging a SECTION, only consider other sections
 * as droppables. This prevents question cards (which are also registered droppables
 * via their own SortableContext) from intercepting section-vs-section collision.
 */
const sectionAwareCollision = (args) => {
    const activeId = String(args.active.id);
    if (activeId.startsWith('section-')) {
        // Filter droppables to only section-* wrappers
        const sectionOnly = args.droppableContainers.filter(
            c => String(c.id).startsWith('section-')
        );
        return closestCenter({ ...args, droppableContainers: sectionOnly });
    }
    return closestCenter(args);
};

// ── Types ─────────────────────────────────────────────────────────────────────
const TYPES = ["text", "textarea", "select", "checkbox", "multiselect", "radio", "number", "email", "tel", "url", "date"];
const TYPE_META = {
    text: { icon: "lucide:type", pill: "bg-sky-50 text-sky-600 border-sky-200", label: "Text" },
    textarea: { icon: "lucide:align-left", pill: "bg-indigo-50 text-indigo-600 border-indigo-200", label: "Textarea" },
    select: { icon: "lucide:chevron-down-square", pill: "bg-violet-50 text-violet-600 border-violet-200", label: "Select" },
    checkbox: { icon: "lucide:check-square", pill: "bg-emerald-50 text-emerald-600 border-emerald-200", label: "Checkbox" },
    multiselect: { icon: "lucide:list-checks", pill: "bg-teal-50 text-teal-600 border-teal-200", label: "Multi" },
    radio: { icon: "lucide:circle-dot", pill: "bg-pink-50 text-pink-600 border-pink-200", label: "Radio" },
    number: { icon: "lucide:hash", pill: "bg-orange-50 text-orange-600 border-orange-200", label: "Number" },
    email: { icon: "lucide:mail", pill: "bg-blue-50 text-blue-600 border-blue-200", label: "Email" },
    tel: { icon: "lucide:phone", pill: "bg-lime-50 text-lime-600 border-lime-200", label: "Phone" },
    url: { icon: "lucide:link", pill: "bg-cyan-50 text-cyan-600 border-cyan-200", label: "URL" },
    date: { icon: "lucide:calendar", pill: "bg-rose-50 text-rose-600 border-rose-200", label: "Date" },
};
const tm = (t) => TYPE_META[t] || { icon: "lucide:help-circle", pill: "bg-gray-50 text-gray-500 border-gray-200", label: t };

// Section header colors (icon circles)
const SEC_COLORS = [
    "bg-yellow-400", "bg-orange-400", "bg-pink-400", "bg-violet-400",
    "bg-sky-400", "bg-emerald-400", "bg-rose-400", "bg-indigo-400",
];

// ── Translations ──────────────────────────────────────────────────────────────
const LANG_META = {
    en: { label: "EN 🇬🇧", placeholder: "English description…" },
    fr: { label: "FR 🇫🇷", placeholder: "Description en français…" },
    ar: { label: "AR 🇸🇦", placeholder: "الوصف بالعربية…", dir: "rtl" },
    de: { label: "DE 🇩🇪", placeholder: "Beschreibung auf Deutsch…" },
};

// Derive supported languages dynamically from the registry to ensure consistency
const getSupportedLangs = () => {
    const keys = new Set(["en", "fr", "ar", "de"]); // Defaults
    Object.values(questionTranslations || {}).forEach(t => Object.keys(t).forEach(k => keys.add(k)));
    return Array.from(keys).map(k => ({
        key: k,
        ...(LANG_META[k] || { label: k.toUpperCase(), placeholder: `Description for ${k.toUpperCase()}…` })
    }));
};
const LANGS = getSupportedLangs();

function TranslationFields({ value = {}, onChange }) {
    const [open, setOpen] = useState(false);
    const hasContent = LANGS.some(l => value[l.key]);
    return (
        <div className="rounded-2xl border border-[#D2D2D7] overflow-hidden bg-white">
            <button type="button" onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-3.5 text-[14px] font-bold transition-all ${open ? "bg-[#0071E3]/5 text-[#0071E3] border-b border-[#0071E3]/20" : "bg-white text-[#1D1D1F] hover:bg-gray-50"}`}>
                <span className="flex items-center gap-2.5">
                    <Icon icon="lucide:globe" className="w-5 h-5 opacity-70" />
                    Translations (EN · FR · AR · DE)
                    {hasContent && <span className="w-2 h-2 rounded-full bg-[#0071E3] inline-block animate-pulse" />}
                </span>
                <Icon icon={open ? "lucide:chevron-up" : "lucide:chevron-down"} className="w-4 h-4 opacity-40" />
            </button>
            {open && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FBFBFD]">
                    {LANGS.map(lang => (
                        <div key={lang.key} className="space-y-1.5 ml-1">
                            <label className="text-[10px] font-bold text-[#86868B] uppercase tracking-[0.1em]">{lang.label}</label>
                            <textarea rows={3} dir={lang.dir || "ltr"} placeholder={lang.placeholder}
                                className="w-full px-4 py-3 border border-[#D2D2D7] rounded-xl outline-none focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/5 text-[14px] resize-none bg-white transition-all placeholder:text-[#C5C5C7]"
                                value={value[lang.key] || ""}
                                onChange={e => onChange({ ...value, [lang.key]: e.target.value })} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function InlineField({ label, children, span }) {
    return (
        <div className={span === 2 ? "col-span-2" : ""}>
            <label className="block text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1.5 ml-1">{label}</label>
            {children}
        </div>
    );
}
const inputCls = "w-full px-4 py-3 border border-[#D2D2D7] rounded-2xl outline-none focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/10 text-[15px] bg-[#FBFBFD] transition-all placeholder:text-[#C5C5C7]";
const selectCls = `${inputCls} appearance-none bg-no-repeat bg-[right_1rem_center]`;

// ── Question Card ─────────────────────────────────────────────────────────────
function QuestionCard({ question, onEdit, onToggleVis, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.questionKey, data: { question }
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : 'auto'
    };
    const meta = tm(question.type);

    return (
        <div ref={setNodeRef} style={style} className="group px-1">
            <div className={`bg-white rounded-[20px] border transition-all duration-300 ${!question.isVisible
                ? "border-dashed border-gray-200 opacity-50 bg-gray-50/50"
                : "border-[#E5E5E7] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
                }`}>
                <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                        {/* Drag grip — subtle Apple-style handle */}
                        <div {...attributes} {...listeners}
                            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-[#D2D2D7] hover:text-[#0071E3] transition-colors">
                            <Icon icon="lucide:grip-horizontal" className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-tight uppercase ${meta.pill}`}>
                                    <Icon icon={meta.icon} className="w-3.5 h-3.5" />
                                    {meta.label}
                                </span>
                                {question.isRequired && (
                                    <span className="text-[10px] px-2.5 py-1 bg-red-50 text-red-500 font-bold rounded-full border border-red-100 uppercase tracking-tight">Required</span>
                                )}
                            </div>

                            <p className="text-[16px] font-semibold text-[#1D1D1F] leading-tight mb-1">{question.question}</p>
                            <p className="text-[12px] font-mono text-[#86868B] flex items-center gap-1">
                                <Icon icon="lucide:code-2" className="w-3 h-3" />
                                {question.questionKey}
                            </p>

                            {question.placeholder && (
                                <p className="text-[12px] text-[#86868B]/70 italic mt-2 line-clamp-1 border-l-2 border-[#E5E5E7] pl-2">
                                    {question.placeholder}
                                </p>
                            )}
                        </div>

                        {/* Quick Actions Bar */}
                        <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button onClick={() => onEdit(question)}
                                className="p-2 text-[#86868B] hover:text-[#0071E3] hover:bg-white rounded-lg transition-all shadow-sm shadow-transparent hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]" title="Edit">
                                <Icon icon="lucide:pencil" className="w-4 h-4" />
                            </button>
                            <button onClick={() => onToggleVis(question.questionKey, question.isVisible)}
                                className={`p-2 rounded-lg transition-all shadow-sm shadow-transparent hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${question.isVisible ? "text-[#86868B] hover:text-amber-500 hover:bg-white" : "text-[#0071E3] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.05)]"}`}
                                title={question.isVisible ? "Hide" : "Show"}>
                                <Icon icon={question.isVisible ? "lucide:eye-off" : "lucide:eye"} className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(question)}
                                className="p-2 text-[#86868B] hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm shadow-transparent hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)]" title="Delete">
                                <Icon icon="lucide:trash-2" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Insert Section Button (appears between sections) ──────────────────────────
function InsertSectionButton({ afterSectionId, onClick }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            className="relative flex items-center gap-3 py-1 group/insert"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={`flex-1 h-px transition-all duration-300 ${hovered ? 'bg-[#0071E3]/40' : 'bg-transparent'}`} />
            <button
                onClick={() => onClick(afterSectionId)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[12px] font-bold transition-all duration-300 whitespace-nowrap
                    ${hovered
                        ? 'border-[#0071E3] text-[#0071E3] bg-[#0071E3]/5 shadow-sm scale-100 opacity-100'
                        : 'border-dashed border-[#D2D2D7] text-[#86868B] bg-transparent opacity-0 group-hover/insert:opacity-100 scale-95'}`}
            >
                <Icon icon="lucide:plus" className="w-3.5 h-3.5" />
                Insert Section Here
            </button>
            <div className={`flex-1 h-px transition-all duration-300 ${hovered ? 'bg-[#0071E3]/40' : 'bg-transparent'}`} />
        </div>
    );
}

// ── Section Accordion ─────────────────────────────────────────────────────────
function SectionAccordion({ sectionId, sectionName, questions, colorIdx, isExpanded, onToggleExpand, onEdit, onToggleVis, onDelete, onToggleSectionVis, onAddToSection, onDeleteSection, onMoveUp, onMoveDown, sectionIndex, totalSections }) {
    // Apply sortable to the ENTIRE card wrapper so the whole card moves during drag
    const { setNodeRef, isOver, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: `section-${sectionId}`,
        data: { sectionId, type: 'section' }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : 'auto',
    };

    const questionKeys = questions.map(q => q.questionKey);
    const visibleCount = questions.filter(q => q.isVisible !== false).length;
    const allVisible = questions.length === 0 || questions.every(q => q.isVisible !== false);
    const accentColor = SEC_COLORS[colorIdx % SEC_COLORS.length];

    return (
        // setNodeRef on the outer wrapper — the ENTIRE card is the draggable + droppable unit
        <div
            ref={setNodeRef}
            style={style}
            className={`group/section flex flex-col bg-white rounded-[24px] border transition-all duration-300 overflow-hidden
                ${isDragging ? 'shadow-2xl shadow-black/20 border-[#0071E3]/30' : 'border-[#E5E5E7] hover:border-[#D2D2D7]'}
                ${isOver && !isDragging ? 'ring-2 ring-[#0071E3] ring-offset-2' : ''}`}
        >
            {/* ── Section Header (Clickable for Expand, drag handle inside) ── */}
            <div
                onClick={onToggleExpand}
                className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-[#FBFBFD]' : 'hover:bg-[#FBFBFD]'}`}
            >
                <div className="flex items-center gap-5 min-w-0">
                    {/* Drag Handle — stopPropagation so click doesn't toggle expand */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#D2D2D7] hover:text-[#0071E3] transition-colors p-1 -ml-1"
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to reorder section"
                    >
                        <Icon icon="lucide:grip-vertical" className="w-5 h-5" />
                    </div>

                    <div className={`w-12 h-12 rounded-2xl ${accentColor} flex items-center justify-center shadow-lg shadow-black/5 flex-shrink-0 transition-transform duration-300 group-hover/section:scale-105`}>
                        <Icon icon="lucide:box" className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1D1D1F] leading-tight flex items-center gap-2">
                            {sectionName}
                            {!allVisible && <Icon icon="lucide:eye-off" className="w-4 h-4 text-[#86868B]" />}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[12px] font-mono text-[#86868B] bg-gray-100 px-2 py-0.5 rounded-lg">{sectionId}</span>
                            <span className="text-[12px] font-semibold text-[#86868B]/60 flex items-center gap-1.5">
                                <Icon icon="lucide:list" className="w-3.5 h-3.5" />
                                {questions.length} questions ({visibleCount} visible)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                        disabled={sectionIndex === 0}
                        className="p-2.5 rounded-full text-[#86868B] border border-[#D2D2D7] hover:text-[#0071E3] hover:border-[#0071E3] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Move section up"
                    >
                        <Icon icon="lucide:chevron-up" className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                        disabled={sectionIndex === totalSections - 1}
                        className="p-2.5 rounded-full text-[#86868B] border border-[#D2D2D7] hover:text-[#0071E3] hover:border-[#0071E3] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Move section down"
                    >
                        <Icon icon="lucide:chevron-down" className="w-4 h-4" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleSectionVis(sectionId, allVisible, questions); }}
                        className={`p-2.5 rounded-full transition-all border ${allVisible ? 'text-[#86868B] border-[#D2D2D7] hover:bg-white' : 'text-[#0071E3] border-[#0071E3] bg-[#0071E3]/5'}`}
                        title={allVisible ? 'Hide all questions in section' : 'Show all questions in section'}
                    >
                        <Icon icon={allVisible ? 'lucide:eye' : 'lucide:eye-off'} className="w-4 h-4" />
                    </button>

                    {onDeleteSection && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteSection({ sectionId, sectionName, questions }); }}
                            className="p-2.5 rounded-full text-red-500 border border-gray-100 hover:border-red-100 hover:bg-red-50/50 transition-all opacity-0 group-hover/section:opacity-100"
                            title="Delete section"
                        >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" />
                        </button>
                    )}

                    <div className={`p-2 rounded-full transition-transform duration-500 ${isExpanded ? 'rotate-180 bg-gray-100' : 'bg-transparent text-[#86868B]'}`}>
                        <Icon icon="lucide:chevron-down" className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* ── Expanded Content Area ── */}
            <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden bg-[#FBFBFD]/50 border-t border-[#F5F5F7]">
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SortableContext items={questionKeys} strategy={verticalListSortingStrategy}>
                                {questions.map(q => (
                                    <QuestionCard key={q.questionKey} question={q}
                                        onEdit={onEdit} onToggleVis={onToggleVis} onDelete={onDelete} />
                                ))}
                            </SortableContext>
                        </div>

                        {questions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 rounded-[20px] border-2 border-dashed border-[#D2D2D7] bg-white gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B]">
                                    <Icon icon="lucide:layers" className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-semibold text-[#86868B]">No questions in this section yet</p>
                            </div>
                        )}

                        {/* Add question inline button */}
                        <div className="mt-6 flex justify-center">
                            <button onClick={() => onAddToSection(sectionId, sectionName)}
                                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[14px] font-bold shadow-sm hover:shadow-md hover:border-[#86868B] active:scale-95 transition-all">
                                <Icon icon="lucide:plus" className="w-4 h-4 text-[#0071E3]" />
                                Add question to {sectionName}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Form helpers ──────────────────────────────────────────────────────────────
const CUSTOM_KEY = "__custom__";

function QuestionForm({ draft, setDraft, allSections = { ids: [], names: [] }, isEdit = false, existingKeys = [] }) {
    const set = (k, v) => setDraft(p => ({ ...p, [k]: v }));
    const needsOptions = ["select", "checkbox", "multiselect", "radio"].includes(draft.type);
    const [useCustomKey, setUseCustomKey] = useState(isEdit && !QUESTION_REGISTRY.some(q => q.questionKey === draft.questionKey));

    const allRegistrySections = [...new Set(QUESTION_REGISTRY.map(q => q.sectionName || q.section))];

    const handleKeySelect = (selectedKey) => {
        const entry = QUESTION_REGISTRY.find(q => q.questionKey === selectedKey);
        if (entry) {
            const trans = questionTranslations[selectedKey] || {};
            setDraft(p => ({
                ...p,
                questionKey: entry.questionKey,
                question: entry.question || p.question,
                type: entry.type || p.type,
                section: entry.section || p.section,
                sectionName: entry.sectionName || p.sectionName,
                placeholder: entry.placeholder || "",
                isRequired: entry.isRequired ?? p.isRequired,
                options: entry.options || [],
                translations: { ...p.translations, ...trans },
            }));
        }
    };

    const handleSectionPopulate = (sName) => {
        const entry = QUESTION_REGISTRY.find(q => (q.sectionName || q.section) === sName);
        if (entry) {
            setDraft(p => ({
                ...p,
                section: entry.section,
                sectionName: entry.sectionName || entry.section
            }));
        }
    };

    const optionsStr = (draft.options || [])
        .map(o => (typeof o === "string" ? o : o.label)).join(", ");

    const registryBySec = QUESTION_REGISTRY.reduce((acc, q) => {
        const g = q.sectionName || q.section;
        if (!acc[g]) acc[g] = [];
        acc[g].push(q);
        return acc;
    }, {});

    const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);

    const handleFieldChange = (key, val) => {
        set(key, val);
        // Smart slugging & Registry Lookup for custom entries
        if (key === "question" && !isEdit) {
            const slug = slugify(val);
            if (!draft.questionKey) set("questionKey", slug);

            // Check for registry match (case-insensitive)
            const registryMatch = QUESTION_REGISTRY.find(q => slugify(q.question) === slug || q.questionKey.toLowerCase() === slug);
            if (registryMatch) {
                const trans = questionTranslations[registryMatch.questionKey] || {};
                setDraft(p => ({
                    ...p,
                    questionKey: registryMatch.questionKey,
                    type: registryMatch.type || p.type,
                    placeholder: registryMatch.placeholder || p.placeholder,
                    options: registryMatch.options || p.options,
                    translations: { ...p.translations, ...trans }
                }));
            }
        }
        if (key === "sectionName" && !isEdit) {
            set("section", slugify(val));
        }
    };

    return (
        <div className="space-y-6">
            {!isEdit && (
                <div className="p-4 bg-[#F5F5F7] rounded-3xl border border-[#E5E5E7] space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Quick Select Section</p>
                    <select className={selectCls} value={allRegistrySections.includes(draft.sectionName) ? draft.sectionName : (draft.sectionName ? "custom" : "")}
                        onChange={(e) => handleSectionPopulate(e.target.value)}>
                        <option value="">— Select a group from registry —</option>
                        {allRegistrySections.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="custom">✏️ Custom Group (New)...</option>
                    </select>
                </div>
            )}

            <div className="space-y-4">
                {/* Section & Question Labels — more prominent */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InlineField label="Section Name (Group)">
                        <input list={`sec-name-list-${isEdit ? "e" : "a"}`} className={inputCls} value={draft.sectionName || ""}
                            placeholder="e.g. Business Information"
                            onChange={e => handleFieldChange("sectionName", e.target.value)} />
                    </InlineField>
                    <InlineField label="Question Label (User Seen)">
                        <input className={inputCls} value={draft.question} placeholder="e.g. What is your address?"
                            onChange={e => handleFieldChange("question", e.target.value)} />
                    </InlineField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <InlineField label="Input Type">
                        <select className={selectCls} value={draft.type} onChange={e => set("type", e.target.value)}>
                            {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t]?.label || t}</option>)}
                        </select>
                    </InlineField>
                    <InlineField label="Section ID (Internal)">
                        <input list={`sec-list-${isEdit ? "e" : "a"}`} className={inputCls}
                            value={draft.section} placeholder="e.g. business"
                            onChange={e => set("section", e.target.value)} />
                    </InlineField>
                </div>

                <InlineField label="Placeholder Help Text">
                    <input className={inputCls} value={draft.placeholder || ""}
                        placeholder="Hint shown inside the input…"
                        onChange={e => set("placeholder", e.target.value)} />
                </InlineField>

                {/* Technical System ID — always available but secondary */}
                <InlineField label="Internal System ID (Question Key)">
                    <input className={`${inputCls} font-mono ${isEdit ? "bg-gray-50 text-gray-400" : ""}`}
                        value={draft.questionKey} readOnly={isEdit}
                        placeholder="e.g. businessAddress" onChange={e => set("questionKey", e.target.value)} />
                </InlineField>
            </div>

            {needsOptions && (
                <InlineField label="Selection Options (Comma Separated)">
                    <input className={inputCls} value={optionsStr}
                        placeholder="Option A, Option B, Option C"
                        onChange={e => {
                            const opts = e.target.value.split(",").map(s => ({ value: s.trim(), label: s.trim() })).filter(o => o.value);
                            set("options", opts);
                        }} />
                </InlineField>
            )}

            <div className="flex items-center gap-6 pt-2 pb-2">
                {[{ key: "isRequired", label: "Required Field", active: "bg-red-400" }, { key: "isVisible", label: "Initially Visible", active: "bg-[#0071E3]" }].map(({ key, label, active }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                        <div className={`relative w-11 h-6 rounded-full transition-all ${draft[key] ? active : "bg-gray-200"}`}>
                            <input type="checkbox" className="sr-only" checked={!!draft[key]} onChange={e => set(key, e.target.checked)} />
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${draft[key] ? "translate-x-5" : ""}`} />
                        </div>
                        <span className="text-sm font-bold text-[#1D1D1F]">{label}</span>
                    </label>
                ))}
            </div>

            <TranslationFields value={draft.translations || {}} onChange={v => set("translations", v)} />

            {/* Support Lists */}
            <datalist id={`sec-list-${isEdit ? "e" : "a"}`}>
                {(allSections?.ids || []).map(s => <option key={s} value={s} />)}
            </datalist>
            <datalist id={`sec-name-list-${isEdit ? "e" : "a"}`}>
                {(allSections?.names || []).map(sn => <option key={sn} value={sn} />)}
            </datalist>
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, icon, isAdd = false, onClose, onSave, isSaving, saveLabel = "Save", canSave = true, children }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
                {/* Header */}
                <div className={`p-6 pb-5 border-b border-gray-100 flex items-center justify-between ${isAdd ? "bg-yellow-50" : ""}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isAdd ? "bg-yellow-400" : "bg-gray-900"}`}>
                            <Icon icon={icon} className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                        <Icon icon="lucide:x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[68vh] overflow-y-auto">{children}</div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-800 font-medium text-sm transition-all">
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={isSaving || !canSave}
                        className="px-6 py-2.5 bg-yellow-400 text-gray-900 rounded-2xl font-bold text-sm shadow-lg shadow-yellow-200 hover:bg-yellow-500 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                        {isSaving && <Icon icon="lucide:loader-2" className="animate-spin w-4 h-4" />}
                        {saveLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent = false }) {
    return (
        <div className={`rounded-[24px] p-6 flex flex-col gap-4 border transition-all duration-300 ${accent ? "bg-[#1D1D1F] border-[#1D1D1F] shadow-xl shadow-black/10" : "bg-white border-[#E5E5E7] shadow-sm hover:shadow-md"}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent ? "bg-white/10" : "bg-[#F5F5F7]"}`}>
                <Icon icon={icon} className={`w-6 h-6 ${accent ? "text-white" : "text-[#1D1D1F]"}`} />
            </div>
            <div>
                <p className={`text-3xl font-black tracking-tight ${accent ? "text-white" : "text-[#1D1D1F]"}`}>{value}</p>
                <p className={`text-[12px] font-bold ${accent ? "text-white/60" : "text-[#86868B]"} uppercase tracking-widest mt-0.5`}>{label}</p>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuestionsManagementPage() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const [editingQ, setEditingQ] = useState(null);
    const [editDraft, setEditDraft] = useState(null);
    const [addTarget, setAddTarget] = useState(null);
    const [addDraft, setAddDraft] = useState(null);
    const [deletingQ, setDeletingQ] = useState(null);
    const [deletingSection, setDeletingSection] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSection, setFilterSection] = useState("all");
    const [activeDragItem, setActiveDragItem] = useState(null);
    const [expandedSections, setExpandedSections] = useState(new Set());
    // Insert-section-between state
    const [insertSectionModal, setInsertSectionModal] = useState(null); // { afterSectionId } | null
    const [insertSectionDraft, setInsertSectionDraft] = useState({ id: '', name: '' });
    const [isInsertingSec, setIsInsertingSec] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const { data: templatesData, isLoading } = useQuery({
        queryKey: ["question-templates"], queryFn: fetchTemplates,
    });

    const updateMutation = useMutation({
        mutationFn: patchTemplate,
        onSuccess: () => { queryClient.invalidateQueries(["question-templates"]); toast.success("Saved ✓"); setEditingQ(null); },
        onError: () => toast.error("Failed to save"),
    });
    const createMutation = useMutation({
        mutationFn: postTemplate,
        onSuccess: () => { queryClient.invalidateQueries(["question-templates"]); toast.success("Question created!"); setAddTarget(null); setAddDraft(null); },
        onError: () => toast.error("Failed to create"),
    });
    const deleteMutation = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => { queryClient.invalidateQueries(["question-templates"]); toast.success("Deleted"); setDeletingQ(null); },
        onError: () => toast.error("Failed to delete"),
    });
    const seedMutation = useMutation({
        mutationFn: seedTemplates,
        onSuccess: () => { queryClient.invalidateQueries(["question-templates"]); toast.success("Seeded from registry!"); },
        onError: () => toast.error("Seed failed"),
    });

    // Section management mutations
    const reorderSectionsMutation = useMutation({
        mutationFn: reorderSections,
        onSuccess: () => { queryClient.invalidateQueries(["question-templates"]); toast.success("Sections reordered!"); },
        onError: () => toast.error("Failed to reorder sections"),
    });

    const openEdit = (q) => { setEditingQ(q); setEditDraft({ ...q }); };
    const handleToggleVis = (qk, isVis) => updateMutation.mutate({ questionKey: qk, data: { isVisible: !isVis } });

    // Section management handlers
    const handleReorderSections = useCallback((newOrder) => {
        reorderSectionsMutation.mutate(newOrder);
    }, [reorderSectionsMutation]);

    const handleMoveSection = (sectionId, direction) => {
        const current = sectionIdsRef.current;
        const currentIndex = current.indexOf(sectionId);
        if (direction === 'up' && currentIndex > 0) {
            const newOrder = [...current];
            [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
            setOrderedSectionIds(newOrder);
            handleReorderSections(newOrder);
        } else if (direction === 'down' && currentIndex < current.length - 1) {
            const newOrder = [...current];
            [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
            setOrderedSectionIds(newOrder);
            handleReorderSections(newOrder);
        }
    };

    const handleToggleSectionExpand = (action) => {
        if (action === 'all') {
            setExpandedSections(new Set(sectionIdsRef.current));
        } else if (action === 'none') {
            setExpandedSections(new Set());
        } else {
            setExpandedSections(prev => {
                const next = new Set(prev);
                next.has(action) ? next.delete(action) : next.add(action);
                return next;
            });
        }
    };

    const handleMoveSectionUp = (sectionId) => {
        const current = sectionIdsRef.current;
        const currentIndex = current.indexOf(sectionId);
        if (currentIndex > 0) {
            const newOrder = [...current];
            [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
            setOrderedSectionIds(newOrder);
            handleReorderSections(newOrder);
        }
    };

    const handleMoveSectionDown = (sectionId) => {
        const current = sectionIdsRef.current;
        const currentIndex = current.indexOf(sectionId);
        if (currentIndex < current.length - 1) {
            const newOrder = [...current];
            [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
            setOrderedSectionIds(newOrder);
            handleReorderSections(newOrder);
        }
    };
    const handleDeleteSection = () => {
        if (!deletingSection || !deletingSection.questions.length) {
            setDeletingSection(null);
            return;
        }

        const qCount = deletingSection.questions.length;
        toast.promise(
            Promise.all(deletingSection.questions.map(q => api.delete(`/question-templates/${q.questionKey}`))),
            {
                loading: `Removing ${qCount} questions from "${deletingSection.sectionName}"...`,
                success: `Section deleted successfully ✓`,
                error: "Failed to delete section",
            }
        ).then(() => {
            queryClient.invalidateQueries(["question-templates"]);
            setDeletingSection(null);
        });
    };

    const handleSectionVis = (sid, allVis, qs) => {
        if (!qs.length) return;
        const newVis = !allVis;
        toast.promise(
            Promise.all(qs.map(q => api.patch(`/question-templates/${q.questionKey}`, { isVisible: newVis, isSectionVisible: newVis }))),
            {
                loading: `${newVis ? "Showing" : "Hiding"} all questions in ${sid}...`,
                success: `Section "${sid}" updated ✓`,
                error: (err) => `Failed to update section: ${err.message || "Unknown error"}`,
            }
        ).then(() => {
            queryClient.invalidateQueries(["question-templates"]);
        });
    };
    const openAddToSection = (sectionId, sectionName) => {
        setAddTarget({ sectionId, sectionName });
        setAddDraft({ questionKey: "", question: "", type: "text", section: sectionId, sectionName, placeholder: "", isRequired: false, isVisible: true, translations: {} });
    };
    const openAddNew = () => {
        const f = allSectionIds[0] || "general";
        setAddTarget("new");
        setAddDraft({ questionKey: "", question: "", type: "text", section: f, sectionName: "", placeholder: "", isRequired: false, isVisible: true, translations: {} });
    };

    const allQuestions = templatesData?.data?.templates || [];

    // ── Section IDs derived from ALL questions (unfiltered) — used for DnD reordering
    // This MUST come from allQuestions, not filtered, so indexOf never returns -1 during drag
    const allQSectionMap = useMemo(() => buildMap(allQuestions), [allQuestions]);
    const allQSectionIds = useMemo(() => [...allQSectionMap.keys()], [allQSectionMap]);

    // Calculate comprehensive section list from DB + Static Registry
    const allSectionIds = useMemo(() => [...new Set([
        ...allQuestions.map(q => q.section),
        ...QUESTION_REGISTRY.map(q => q.section)
    ])].filter(Boolean), [allQuestions]);

    const allSectionNames = useMemo(() => [...new Set([
        ...allQuestions.map(q => q.sectionName),
        ...QUESTION_REGISTRY.map(q => q.sectionName)
    ])].filter(Boolean), [allQuestions]);

    const sectionsData = { ids: allSectionIds, names: allSectionNames };

    // ── orderedSectionIds: starts as allQSectionIds, updates optimistically on drag ──
    const [orderedSectionIds, setOrderedSectionIds] = useState(null);
    // Use orderedSectionIds when set (after first drag), otherwise allQSectionIds
    const effectiveSectionIds = orderedSectionIds || allQSectionIds;

    // Keep a ref always pointing to the latest effectiveSectionIds — zero stale-closure risk
    const sectionIdsRef = useRef(effectiveSectionIds);
    sectionIdsRef.current = effectiveSectionIds;

    // Filtered questions for display (search/section filter)
    const sourceQuestions = useMemo(() => {
        // Use effectiveSectionIds order to preserve user's drag order
        const qBySection = buildMap(allQuestions);
        return effectiveSectionIds.flatMap(sid => (qBySection.get(sid)?.questions || []));
    }, [allQuestions, effectiveSectionIds]);

    const filtered = useMemo(() => sourceQuestions.filter(q => {
        const s = !searchQuery || q.question?.toLowerCase().includes(searchQuery.toLowerCase()) || q.questionKey?.toLowerCase().includes(searchQuery.toLowerCase());
        const sec = filterSection === 'all' || q.section === filterSection;
        return s && sec;
    }), [sourceQuestions, searchQuery, filterSection]);

    const sectionMap = useMemo(() => buildMap(filtered), [filtered]);
    // Display section IDs (filtered)
    const displaySectionIds = useMemo(() => [...sectionMap.keys()], [sectionMap]);

    // Keep sectionMap ref fresh
    const sectionMapRef = useRef(sectionMap);
    sectionMapRef.current = sectionMap;

    // DnD handlers — use refs so callbacks never capture stale values
    const handleDragStart = useCallback(({ active }) => {
        const activeId = String(active.id);
        if (activeId.startsWith('section-')) {
            const sectionId = activeId.replace(/^section-/, '');
            setActiveDragItem({ type: 'section', id: sectionId });
        } else {
            const q = allQuestions.find(q => q.questionKey === activeId);
            setActiveDragItem({ type: 'question', data: q || null });
        }
    }, [allQuestions]);

    const handleDragEnd = useCallback(({ active, over }) => {
        const activeId = String(active.id);
        const overId = over ? String(over.id) : null;

        setActiveDragItem(null);
        if (!overId || activeId === overId) return;

        // Helper: strip 'section-' prefix
        const toSec = (id) => id?.startsWith('section-') ? id.replace(/^section-/, '') : null;

        const activeSectionId = toSec(activeId);
        const overSectionId = toSec(overId);

        // ── Section reorder ─────────────────────────────────────────────────────
        if (activeSectionId) {
            // READ from ref — always has the latest order, no stale closure issue
            const current = sectionIdsRef.current;

            // Resolve the target section:
            // • Primary: overId is 'section-X' → overSectionId already set
            // • Fallback: overId is a question key (pointer inside an expanded section)
            //   → look up which section that question belongs to
            let resolvedOverSection = overSectionId;
            if (!resolvedOverSection) {
                const overQ = allQuestions.find(q => q.questionKey === overId);
                if (overQ) resolvedOverSection = overQ.section;
            }

            if (!resolvedOverSection || activeSectionId === resolvedOverSection) return;

            const oldIndex = current.indexOf(activeSectionId);
            const newIndex = current.indexOf(resolvedOverSection);
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
            const newOrder = arrayMove(current, oldIndex, newIndex);
            // Immediate optimistic update — UI reorders before API responds
            setOrderedSectionIds(newOrder);
            // Persist to server
            handleReorderSections(newOrder);
            return;
        }

        // ── Question moved into another section ─────────────────────────────────
        if (!activeSectionId) {
            const activeQ = allQuestions.find(q => q.questionKey === activeId);
            if (!activeQ) return;
            // Target section: either the section the user hovered over, or derived from the over-question's section
            let targetSectionId = overSectionId;
            if (!targetSectionId) {
                const overQ = allQuestions.find(q => q.questionKey === overId);
                if (overQ) targetSectionId = overQ.section;
            }
            if (!targetSectionId || activeQ.section === targetSectionId) return;
            const curMap = sectionMapRef.current;
            if (!curMap.has(targetSectionId)) return;
            updateMutation.mutate({ questionKey: activeQ.questionKey, data: { section: targetSectionId, sectionName: curMap.get(targetSectionId).sectionName } });
        }
    }, [allQuestions, handleReorderSections, updateMutation]);

    // ── Insert Section Between ───────────────────────────────────────────────────
    const openInsertSection = (afterSectionId) => {
        setInsertSectionModal({ afterSectionId });
        setInsertSectionDraft({ id: '', name: '' });
    };

    const handleInsertSection = async () => {
        const { id, name } = insertSectionDraft;
        if (!id.trim() || !name.trim()) {
            toast.error('Section ID and Name are required');
            return;
        }
        if (sectionIds.includes(id.trim())) {
            toast.error('A section with this ID already exists');
            return;
        }
        setIsInsertingSec(true);
        try {
            await createSection(id.trim(), name.trim(), insertSectionModal.afterSectionId);
            await queryClient.invalidateQueries(['question-templates']);
            toast.success(`Section "${name.trim()}" created! Add the first question below.`);
            setInsertSectionModal(null);
            // Sections only appear in the DB once they have a question — open add-question modal immediately
            openAddToSection(id.trim(), name.trim());
        } catch (e) {
            toast.error('Failed to create section');
        } finally {
            setIsInsertingSec(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center animate-pulse">
                <Icon icon="lucide:layers" className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-400">Loading questions…</p>
        </div>
    );

    const activeMeta = activeDragItem && activeDragItem.type === 'question' ? tm(activeDragItem.data?.type) : null;
    const totalVisible = allQuestions.filter(q => q.isVisible !== false).length;

    return (
        <div className="min-h-screen bg-[#F5F5F7] p-6 sm:p-10 space-y-10 font-sans selection:bg-[#0071E3]/20">

            {/* ── Top Navigation Bar (Apple Style Glass) ── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 rounded-3xl bg-[#1D1D1F] flex items-center justify-center shadow-2xl shadow-black/20">
                            <Icon icon="lucide:layers" className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-[#1D1D1F] tracking-tight">Questions</h1>
                            <p className="text-[14px] font-semibold text-[#86868B]">Global System Configuration Dashboard</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={openAddNew}
                        className="flex items-center gap-2.5 px-7 py-3.5 bg-[#fccf3c] text-white text-[15px] font-bold rounded-full shadow-lg shadow-[#fccf3c]/20 hover:bg-[#fccf3c]/80 active:scale-95 transition-all">
                        <Icon icon="lucide:plus" className="w-5 h-5" />
                        Create Question
                    </button>
                    {["superadmin", "admin"].includes(session?.user?.role) && (
                        <button
                            onClick={() => {
                                if (confirm("Reset all global questions to the default registry?")) {
                                    const merged = QUESTION_REGISTRY.map(q => ({
                                        ...q,
                                        translations: questionTranslations[q.questionKey] || {}
                                    }));
                                    seedMutation.mutate(merged);
                                }
                            }}
                            className="flex items-center gap-2.5 px-6 py-3.5 bg-white text-[#1D1D1F] border border-[#D2D2D7] text-[15px] font-bold rounded-full hover:bg-gray-50 active:scale-95 transition-all">
                            <Icon icon="lucide:refresh-cw" className={`w-4 h-4 ${seedMutation.isPending ? "animate-spin" : ""}`} />
                            Sync Registry
                        </button>
                    )}
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon="lucide:layers" label="Total Questions" value={allQuestions.length} accent />
                <StatCard icon="lucide:eye" label="Visible" value={totalVisible} />
                <StatCard icon="lucide:layout-grid" label="Sections" value={sectionsData.ids.length} />
                <StatCard icon="lucide:eye-off" label="Hidden" value={allQuestions.length - totalVisible} />
            </div>

            {/* ── Filters & Search ── */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-[28px] border border-[#E5E5E7] shadow-sm">
                <div className="relative flex-1 w-full">
                    <Icon icon="lucide:search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] w-5 h-5" />
                    <input type="text" placeholder="Search questions by name or key…"
                        className="w-full pl-12 pr-5 py-3.5 bg-transparent border-none outline-none text-[16px] text-[#1D1D1F] placeholder:text-[#86868B]/60"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div className="h-6 w-px bg-[#D2D2D7] hidden sm:block" />
                <select className="px-5 py-3 border-none outline-none text-[15px] font-bold text-[#1D1D1F] bg-transparent cursor-pointer w-full sm:w-auto min-w-[200px]"
                    value={filterSection} onChange={e => setFilterSection(e.target.value)}>
                    <option value="all">Every Section</option>
                    {sectionsData.ids.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="px-5 py-2.5 bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl text-[13px] font-bold flex items-center gap-2 flex-shrink-0">
                    <Icon icon="lucide:database" className="w-4 h-4 text-[#0071E3]" />
                    {filtered.length} Total Results
                </div>
            </div>

            {/* ── Help Tip ── */}
            <div className="flex items-center gap-5 bg-white p-5 px-6 rounded-[28px] border border-[#E5E5E7] shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/5 flex items-center justify-center flex-shrink-0">
                    <Icon icon="lucide:info" className="w-6 h-6 text-[#0071E3]" />
                </div>
                <div>
                    <p className="text-[15px] font-bold text-[#1D1D1F]">Workflow Management</p>
                    <p className="text-[14px] text-[#86868B]">Drag items to reorder inside sections or drop them into other sections to move them. Drag sections by the grip handle to reorder sections.</p>
                </div>
            </div>

            {/* ── Kanban Grid ── */}
            <DndContext sensors={sensors} collisionDetection={sectionAwareCollision}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveDragItem(null)}>

                {displaySectionIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                        <div className="w-20 h-20 rounded-3xl bg-yellow-100 flex items-center justify-center mb-4">
                            <Icon icon="lucide:inbox" className="w-10 h-10 text-yellow-400" />
                        </div>
                        <p className="font-bold text-gray-700 text-lg">No questions found</p>
                        <p className="text-sm mt-1">{allQuestions.length === 0 ? "Click 'Seed from Registry' to initialize." : "No results matching your filters."}</p>
                    </div>
                ) : (
                    <SortableContext items={displaySectionIds.map(id => `section-${id}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                            {/* Expand / Collapse all */}
                            <div className="flex items-center justify-end gap-3 px-2 pb-2">
                                <button onClick={() => setExpandedSections(new Set(displaySectionIds))}
                                    className="text-[13px] font-bold text-[#0071E3] hover:text-[#0077ED] px-4 py-2 bg-white rounded-full border border-[#D2D2D7] shadow-sm transition-all">
                                    Expand All
                                </button>
                                <button onClick={() => setExpandedSections(new Set())}
                                    className="text-[13px] font-bold text-[#86868B] hover:text-[#1D1D1F] px-4 py-2 bg-white rounded-full border border-[#D2D2D7] shadow-sm transition-all">
                                    Collapse All
                                </button>
                            </div>

                            {/* First: insert before the very first section */}
                            <InsertSectionButton afterSectionId={null} onClick={() => openInsertSection(null)} />

                            {displaySectionIds.map((sid, idx) => {
                                const sec = sectionMap.get(sid);
                                return (
                                    <div key={sid}>
                                        <SectionAccordion
                                            sectionId={sid}
                                            sectionName={sec.sectionName}
                                            questions={sec.questions}
                                            colorIdx={idx}
                                            isExpanded={expandedSections.has(sid)}
                                            onToggleExpand={() => setExpandedSections(prev => {
                                                const next = new Set(prev);
                                                next.has(sid) ? next.delete(sid) : next.add(sid);
                                                return next;
                                            })}
                                            onEdit={openEdit}
                                            onToggleVis={handleToggleVis}
                                            onDelete={q => setDeletingQ(q)}
                                            onToggleSectionVis={handleSectionVis}
                                            onDeleteSection={setDeletingSection}
                                            onAddToSection={openAddToSection}
                                            onMoveUp={() => handleMoveSectionUp(sid)}
                                            onMoveDown={() => handleMoveSectionDown(sid)}
                                            sectionIndex={idx}
                                            totalSections={displaySectionIds.length}
                                        />
                                        {/* Insert section AFTER this section */}
                                        <InsertSectionButton afterSectionId={sid} onClick={() => openInsertSection(sid)} />
                                    </div>
                                );
                            })}
                        </div>
                    </SortableContext>
                )}

                <DragOverlay dropAnimation={{ duration: 180 }}>
                    {activeDragItem ? (
                        activeDragItem.type === 'section' ? (
                            <div className="bg-white border border-[#D2D2D7] rounded-[20px] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-xs rotate-[2deg] cursor-grabbing">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <Icon icon="lucide:layout-grid" className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-[#1D1D1F] truncate">Section: {activeDragItem.id}</p>
                                        <p className="text-[11px] font-mono text-[#86868B]">Reordering section</p>
                                    </div>
                                </div>
                            </div>
                        ) : activeDragItem.data && activeMeta ? (
                            <div className="bg-white border border-[#D2D2D7] rounded-[20px] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-w-xs rotate-[2deg] cursor-grabbing">
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold ${activeMeta.pill}`}>
                                        <Icon icon={activeMeta.icon} className="w-3 h-3" />{activeMeta.label}
                                    </span>
                                    <p className="text-[14px] font-bold text-[#1D1D1F] truncate">{activeDragItem.data.question}</p>
                                </div>
                                <p className="text-[11px] font-mono text-[#86868B] mt-1">{activeDragItem.data.questionKey}</p>
                            </div>
                        ) : null
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* ── Edit Modal ── */}
            {editingQ && editDraft && (
                <Modal title={`Edit — ${editingQ.questionKey}`} icon="lucide:pencil"
                    onClose={() => { setEditingQ(null); setEditDraft(null); }}
                    onSave={() => { const { questionKey, ...rest } = editDraft; updateMutation.mutate({ questionKey, data: rest }); }}
                    isSaving={updateMutation.isPending} saveLabel="Save Changes" canSave={!!editDraft.question}>
                    <QuestionForm draft={editDraft} setDraft={setEditDraft} allSections={sectionsData} isEdit />
                </Modal>
            )}

            {/* ── Add Modal ── */}
            {addDraft && (
                <Modal title={addTarget && addTarget !== "new" ? `Add to "${addTarget.sectionName}"` : "Add Global Question"}
                    icon="lucide:plus-circle" isAdd
                    onClose={() => { setAddTarget(null); setAddDraft(null); }}
                    onSave={() => createMutation.mutate(addDraft)}
                    isSaving={createMutation.isPending} saveLabel="Create Question"
                    canSave={!!addDraft.questionKey && !!addDraft.question}>

                    {addDraft.questionKey && !addDraft.questionKey.startsWith("__") && (
                        <div className="flex items-center gap-4 bg-[#F5F5F7] border border-[#E5E5E7] rounded-[20px] px-5 py-4 text-[14px] text-[#1D1D1F] mb-6 font-medium shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 flex items-center justify-center flex-shrink-0">
                                <Icon icon="lucide:check-circle-2" className="w-5 h-5 text-[#0071E3]" />
                            </div>
                            <div>
                                <p className="font-bold">Registry Match</p>
                                <p className="text-[#86868B] text-[13px]">The key <code className="bg-white px-1.5 py-0.5 rounded border border-[#D2D2D7] text-[#1D1D1F] font-mono mx-1">{addDraft.questionKey}</code> was found in the global registry. All fields have been pre-filled.</p>
                            </div>
                        </div>
                    )}
                    <QuestionForm draft={addDraft} setDraft={setAddDraft} allSections={sectionsData}
                        existingKeys={allQuestions.map(q => q.questionKey)} />
                </Modal>
            )}

            {/* ── Delete Confirm ── */}
            {deletingQ && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Icon icon="lucide:trash-2" className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900">Delete Question?</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            <span className="font-bold text-gray-700">"{deletingQ.question}"</span> will be permanently removed from the global registry.
                        </p>
                        <code className="block text-[11px] font-mono text-gray-400 mt-1">{deletingQ.questionKey}</code>
                        <div className="flex items-center gap-3 justify-center mt-6">
                            <button onClick={() => setDeletingQ(null)}
                                className="px-5 py-2.5 text-gray-600 border border-gray-200 rounded-2xl hover:bg-gray-50 text-sm font-semibold transition-all">
                                Cancel
                            </button>
                            <button onClick={() => deleteMutation.mutate(deletingQ.questionKey)}
                                disabled={deleteMutation.isPending}
                                className="px-5 py-2.5 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-60">
                                {deleteMutation.isPending && <Icon icon="lucide:loader-2" className="animate-spin w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm (Section) ── */}
            {deletingSection && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center mx-auto mb-5">
                            <Icon icon="lucide:trash-2" className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Delete Section?</h3>
                        <p className="text-[#86868B] mt-3 leading-relaxed text-[15px]">
                            Are you sure you want to remove <span className="font-bold text-[#1D1D1F]">"{deletingSection.sectionName}"</span>?
                            <br /><span className="text-red-500 font-bold">This will delete all {deletingSection.questions.length} questions inside it.</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button onClick={() => setDeletingSection(null)}
                                className="px-6 py-3 text-[#1D1D1F] border border-[#D2D2D7] rounded-2xl hover:bg-gray-50 text-[14px] font-bold transition-all active:scale-95">
                                Cancel
                            </button>
                            <button onClick={handleDeleteSection}
                                className="px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-[14px] hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200 active:scale-95">
                                Delete All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Insert Section Modal ── */}
            {insertSectionModal !== null && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Header */}
                        <div className="p-6 pb-5 border-b border-gray-100 flex items-center justify-between bg-[#0071E3]/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#0071E3] flex items-center justify-center">
                                    <Icon icon="lucide:layers" className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#1D1D1F]">Insert New Section</h2>
                                    <p className="text-[12px] text-[#86868B] mt-0.5">
                                        {insertSectionModal.afterSectionId
                                            ? <>After <span className="font-mono font-bold text-[#0071E3]">{insertSectionModal.afterSectionId}</span></>
                                            : 'At the beginning'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setInsertSectionModal(null)}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <Icon icon="lucide:x" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5 ml-1">Section Name (User Visible)</label>
                                <input
                                    className={inputCls}
                                    placeholder="e.g. Business Details"
                                    value={insertSectionDraft.name}
                                    autoFocus
                                    onChange={e => {
                                        const name = e.target.value;
                                        const autoId = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
                                        setInsertSectionDraft(p => ({ ...p, name, id: p.id || autoId }));
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5 ml-1">Section ID (Internal Key)</label>
                                <input
                                    className={`${inputCls} font-mono`}
                                    placeholder="e.g. businessdetails"
                                    value={insertSectionDraft.id}
                                    onChange={e => setInsertSectionDraft(p => ({ ...p, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                                />
                                <p className="text-[11px] text-[#86868B] mt-1.5 ml-1">Lowercase letters, numbers and hyphens only</p>
                            </div>
                            {/* Info note */}
                            <div className="flex items-start gap-3 bg-[#F5F5F7] rounded-2xl px-4 py-3 border border-[#E5E5E7]">
                                <Icon icon="lucide:info" className="w-4 h-4 text-[#0071E3] flex-shrink-0 mt-0.5" />
                                <p className="text-[12px] text-[#86868B] leading-relaxed">
                                    After clicking <span className="font-bold text-[#1D1D1F]">Create Section</span>, you'll be prompted to add the first question. Sections become visible once they contain at least one question.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setInsertSectionModal(null)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-800 font-medium text-sm transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInsertSection}
                                disabled={isInsertingSec || !insertSectionDraft.id.trim() || !insertSectionDraft.name.trim()}
                                className="px-6 py-2.5 bg-[#0071E3] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#0071E3]/20 hover:bg-[#0077ED] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isInsertingSec && <Icon icon="lucide:loader-2" className="animate-spin w-4 h-4" />}
                                <Icon icon="lucide:plus" className="w-4 h-4" />
                                Create Section
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
