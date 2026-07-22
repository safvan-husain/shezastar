'use client';

import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import { EditorContent, type Editor, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    label?: string;
    previewLabel?: string;
    disabled?: boolean;
    className?: string;
    editorClassName?: string;
}

function getActiveBlockStyle(editor: Editor | null) {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    return 'paragraph';
}

function ToolbarButton({
    active,
    disabled,
    label,
    onClick,
    children,
}: {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={`h-9 min-w-9 rounded-[var(--radius-sm)] border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${active
                ? 'border-[var(--border-strong)] bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
                }`}
        >
            {children}
        </button>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Write here...',
    rows = 8,
    label,
    previewLabel = 'Preview',
    disabled,
    className = '',
    editorClassName = '',
}: RichTextEditorProps) {
    const [, forceRender] = useReducer((count) => count + 1, 0);
    const [showLinkControls, setShowLinkControls] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkError, setLinkError] = useState('');
    const linkInputId = useId();
    const valueRef = useRef(value);
    const minHeight = Math.max(rows, 6) * 28;

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                blockquote: false,
                code: false,
                codeBlock: false,
                heading: {
                    levels: [1, 2, 3],
                },
                horizontalRule: false,
                strike: false,
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        [placeholder]
    );

    const editor = useEditor({
        extensions,
        content: value,
        immediatelyRender: false,
        editable: !disabled,
        editorProps: {
            attributes: {
                class: `shezastar-rich-editor ${editorClassName}`,
                style: `min-height: ${minHeight}px;`,
            },
        },
        onUpdate({ editor }) {
            forceRender();
            const html = editor.getHTML();
            if (html !== valueRef.current) {
                onChange(html);
            }
        },
        onSelectionUpdate() {
            forceRender();
        },
        onTransaction() {
            forceRender();
        },
    });

    useEffect(() => {
        if (!editor) return;
        if (value === editor.getHTML()) return;

        try {
            editor.commands.setContent(value || '', { emitUpdate: false });
        } catch {
            editor.commands.setContent(value || '');
        }
    }, [editor, value]);

    const activeBlockStyle = getActiveBlockStyle(editor);
    const canEditLink = Boolean(
        editor && (editor.isActive('link') || editor.state.selection.from !== editor.state.selection.to)
    );

    const openLinkControls = () => {
        if (!editor || disabled || !canEditLink) return;
        setLinkUrl(editor.getAttributes('link').href || '');
        setLinkError('');
        setShowLinkControls(true);
    };

    const applyLink = () => {
        if (!editor || disabled) return;
        const href = linkUrl.trim();
        if (!href) return;
        const applied = editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
        if (!applied) {
            setLinkError('Enter a valid and safe link URL.');
            return;
        }
        setLinkError('');
        setShowLinkControls(false);
    };

    const removeLink = () => {
        if (!editor || disabled) return;
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setLinkUrl('');
        setShowLinkControls(false);
    };

    return (
        <div className={className}>
            <div className="mb-2 flex items-center justify-between gap-3">
                {label && (
                    <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                        {label}
                    </label>
                )}
                <span className="text-xs text-[var(--text-muted)]">{previewLabel}</span>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                    <select
                        value={activeBlockStyle}
                        disabled={!editor || disabled}
                        onChange={(event) => {
                            if (!editor || disabled) return;
                            const chain = editor.chain().focus();
                            if (event.target.value === 'paragraph') chain.setParagraph().run();
                            if (event.target.value === 'h1') chain.setHeading({ level: 1 }).run();
                            if (event.target.value === 'h2') chain.setHeading({ level: 2 }).run();
                            if (event.target.value === 'h3') chain.setHeading({ level: 3 }).run();
                        }}
                        className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                        <option value="paragraph">Normal</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                    </select>

                    <div className="hidden h-6 w-px bg-[var(--border-subtle)] sm:block" />

                    <ToolbarButton
                        label="Bold"
                        active={editor?.isActive('bold')}
                        disabled={!editor || disabled}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                    >
                        B
                    </ToolbarButton>
                    <ToolbarButton
                        label="Italic"
                        active={editor?.isActive('italic')}
                        disabled={!editor || disabled}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                    >
                        <span className="italic">I</span>
                    </ToolbarButton>
                    <ToolbarButton
                        label="Add or edit link"
                        active={editor?.isActive('link')}
                        disabled={!editor || disabled || !canEditLink}
                        onClick={openLinkControls}
                    >
                        Link
                    </ToolbarButton>

                    <div className="hidden h-6 w-px bg-[var(--border-subtle)] sm:block" />

                    <ToolbarButton
                        label="Bullet list"
                        active={editor?.isActive('bulletList')}
                        disabled={!editor || disabled}
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    >
                        List
                    </ToolbarButton>
                    <ToolbarButton
                        label="Numbered list"
                        active={editor?.isActive('orderedList')}
                        disabled={!editor || disabled}
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    >
                        1. List
                    </ToolbarButton>

                    <div className="flex-1" />

                    <ToolbarButton
                        label="Undo"
                        disabled={!editor || disabled || !(editor?.can().chain().focus().undo().run() ?? false)}
                        onClick={() => editor?.chain().focus().undo().run()}
                    >
                        Undo
                    </ToolbarButton>
                    <ToolbarButton
                        label="Redo"
                        disabled={!editor || disabled || !(editor?.can().chain().focus().redo().run() ?? false)}
                        onClick={() => editor?.chain().focus().redo().run()}
                    >
                        Redo
                    </ToolbarButton>
                </div>

                {showLinkControls && (
                    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <label htmlFor={linkInputId} className="sr-only">
                            Link URL
                        </label>
                        <input
                            id={linkInputId}
                            type="text"
                            inputMode="url"
                            value={linkUrl}
                            onChange={(event) => {
                                setLinkUrl(event.target.value);
                                setLinkError('');
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    applyLink();
                                }
                                if (event.key === 'Escape') setShowLinkControls(false);
                            }}
                            placeholder="https://example.com or /page"
                            autoFocus
                            className="h-9 min-w-64 flex-1 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                        <ToolbarButton label="Apply link" disabled={!linkUrl.trim()} onClick={applyLink}>
                            Apply
                        </ToolbarButton>
                        {editor?.isActive('link') && (
                            <ToolbarButton label="Remove link" onClick={removeLink}>
                                Remove
                            </ToolbarButton>
                        )}
                        <ToolbarButton label="Cancel link editing" onClick={() => setShowLinkControls(false)}>
                            Cancel
                        </ToolbarButton>
                        {linkError && (
                            <p role="alert" className="w-full text-xs text-red-600 dark:text-red-400">
                                {linkError}
                            </p>
                        )}
                    </div>
                )}

                <div className="bg-[var(--bg-base)] p-4">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}
