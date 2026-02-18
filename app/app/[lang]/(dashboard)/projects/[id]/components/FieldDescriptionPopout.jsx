"use client";
import React, { useState } from 'react';
import { Icon } from '@iconify/react';

const FieldDescriptionPopout = ({ translations, onClose }) => {
    const [lang, setLang] = useState('en');

    if (!translations) return null;

    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'fr', label: 'FR' },
        { code: 'ar', label: 'AR' },
        { code: 'de', label: 'DE' }
    ];

    return (
        <div className="absolute z-[100] mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in fade-in zoom-in duration-200 left-0">
            <div className="flex justify-between items-center mb-3">
                <div className="flex gap-1">
                    {languages.map((l) => (
                        <button
                            key={l.code}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLang(l.code);
                            }}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${lang === l.code ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Icon icon="lucide:x" className="w-4 h-4" />
                </button>
            </div>
            <p className={`text-xs text-gray-700 leading-relaxed ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {translations[lang] || translations['en'] || "Description not available in this language."}
            </p>
            {/* Tooltip triangle */}
            <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45"></div>
        </div>
    );
};

export default FieldDescriptionPopout;
