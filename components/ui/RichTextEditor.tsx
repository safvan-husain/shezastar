'use client';

import { useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    label?: string;
    previewLabel?: string;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Enter description...',
    rows = 8,
    label,
    previewLabel = 'Preview (Storefront View)'
}: RichTextEditorProps) {
    const [mode, setMode] = useState<'text' | 'html'>('text');

    // Initialize mode based on content
    useState(() => {
        if (value && /<[a-z][\s\S]*>/i.test(value)) {
            setMode('html');
        }
    });

    const handleTextChange = (text: string) => {
        // Convert text to HTML paragraphs
        const html = text.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => `<p>${line}</p>`)
            .join('');
        onChange(html);
    };

    const getTextFromHtml = (html: string) => {
        if (!html) return '';
        if (!/<[a-z][\s\S]*>/i.test(html)) return html;

        // Replace </p><p> with newline
        let text = html.replace(/<\/p>\s*<p>/gi, '\n');
        // Remove start/end tags
        text = text.replace(/<\/?p>/gi, '');
        // Remove br
        text = text.replace(/<br\s*\/?>/gi, '\n');
        return text;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                {label && (
                    <label className="block text-sm font-semibold text-[var(--foreground)]">
                        {label}
                    </label>
                )}
                <div className="flex bg-[var(--bg-subtle)] rounded-lg p-1 border border-[var(--border)] ml-auto">
                    <button
                        type="button"
                        onClick={() => setMode('text')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'text'
                            ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                    >
                        Text
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('html')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'html'
                            ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                    >
                        HTML
                    </button>
                </div>
            </div>
            <textarea
                value={mode === 'text' ? getTextFromHtml(value) : value}
                onChange={(e) => {
                    if (mode === 'text') {
                        handleTextChange(e.target.value);
                    } else {
                        onChange(e.target.value);
                    }
                }}
                placeholder={mode === 'text' ? placeholder : "<p>Description HTML</p>"}
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-all duration-200 resize-none font-mono text-sm"
                rows={rows}
            />
            {mode === 'text' && (
                <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Text will be automatically formatted as HTML paragraphs.
                </p>
            )}
            {mode === 'html' && (
                <div className="mt-4 border rounded-lg p-4 bg-[var(--bg-subtle)]/30">
                    <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                        {previewLabel}
                    </label>
                    <div
                        className="text-[var(--foreground)] leading-relaxed break-words [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:mb-4 [&_h2]:mb-3 [&_h3]:mb-2"
                        dangerouslySetInnerHTML={{ __html: value || '' }}
                    />
                </div>
            )}
        </div>
    );
}
