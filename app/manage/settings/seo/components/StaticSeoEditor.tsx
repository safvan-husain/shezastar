'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { StaticPageSeoKey, StaticPageSeoSettings } from '@/lib/app-settings/app-settings.schema';

interface StaticSeoEditorProps {
    initialSettings: StaticPageSeoSettings;
}

type SeoFormEntry = {
    title: string;
    metaDescription: string;
    currentOgImage: string;
    removeOgImage: boolean;
    ogImageFile: File | null;
};

const KEY_LABELS: Record<StaticPageSeoKey, string> = {
    home: 'Home',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    'return-refund': 'Return & Refund',
    products: 'Products',
    blogs: 'Blogs',
    'category-landing': 'Category Landing',
};

const KEY_ORDER: StaticPageSeoKey[] = [
    'home',
    'about',
    'contact',
    'privacy',
    'terms',
    'return-refund',
    'products',
    'blogs',
    'category-landing',
];

function buildInitialForm(settings: StaticPageSeoSettings): Record<StaticPageSeoKey, SeoFormEntry> {
    return {
        home: {
            title: settings.home.title,
            metaDescription: settings.home.metaDescription,
            currentOgImage: settings.home.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        about: {
            title: settings.about.title,
            metaDescription: settings.about.metaDescription,
            currentOgImage: settings.about.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        contact: {
            title: settings.contact.title,
            metaDescription: settings.contact.metaDescription,
            currentOgImage: settings.contact.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        privacy: {
            title: settings.privacy.title,
            metaDescription: settings.privacy.metaDescription,
            currentOgImage: settings.privacy.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        terms: {
            title: settings.terms.title,
            metaDescription: settings.terms.metaDescription,
            currentOgImage: settings.terms.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        'return-refund': {
            title: settings['return-refund'].title,
            metaDescription: settings['return-refund'].metaDescription,
            currentOgImage: settings['return-refund'].ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        products: {
            title: settings.products.title,
            metaDescription: settings.products.metaDescription,
            currentOgImage: settings.products.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        blogs: {
            title: settings.blogs.title,
            metaDescription: settings.blogs.metaDescription,
            currentOgImage: settings.blogs.ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
        'category-landing': {
            title: settings['category-landing'].title,
            metaDescription: settings['category-landing'].metaDescription,
            currentOgImage: settings['category-landing'].ogImage || '',
            removeOgImage: false,
            ogImageFile: null,
        },
    };
}

export default function StaticSeoEditor({ initialSettings }: StaticSeoEditorProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [formByKey, setFormByKey] = useState<Record<StaticPageSeoKey, SeoFormEntry>>(
        () => buildInitialForm(initialSettings)
    );
    const [savingKey, setSavingKey] = useState<StaticPageSeoKey | null>(null);

    const canSaveByKey = useMemo(() => {
        return KEY_ORDER.reduce<Record<StaticPageSeoKey, boolean>>((acc, key) => {
            const entry = formByKey[key];
            acc[key] = entry.title.trim().length > 0 && entry.metaDescription.trim().length > 0;
            return acc;
        }, {} as Record<StaticPageSeoKey, boolean>);
    }, [formByKey]);

    const updateEntry = (key: StaticPageSeoKey, update: Partial<SeoFormEntry>) => {
        setFormByKey((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                ...update,
            },
        }));
    };

    const handleSave = async (key: StaticPageSeoKey) => {
        const entry = formByKey[key];
        const url = `/api/admin/settings/seo/${key}`;
        const method = 'PATCH';
        const formData = new FormData();
        formData.append('title', entry.title.trim());
        formData.append('metaDescription', entry.metaDescription.trim());
        formData.append('currentOgImage', entry.currentOgImage);
        formData.append('removeOgImage', entry.removeOgImage ? 'true' : 'false');
        if (entry.ogImageFile) {
            formData.append('ogImageFile', entry.ogImageFile);
        }

        setSavingKey(key);
        try {
            const response = await fetch(url, {
                method,
                body: formData,
            });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(body.message || 'Failed to update SEO settings', 'error', {
                    status: response.status,
                    body,
                    url,
                    method,
                });
                return;
            }

            showToast(`${KEY_LABELS[key]} SEO updated`, 'success');
            router.refresh();
        } catch (error) {
            showToast('Failed to update SEO settings', 'error', {
                body: error,
                url,
                method,
            });
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div className="space-y-6">
            {KEY_ORDER.map((key) => {
                const entry = formByKey[key];
                const ogPreview = entry.removeOgImage ? '' : entry.currentOgImage;
                return (
                    <section
                        key={key}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-sm"
                    >
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                {KEY_LABELS[key]}
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleSave(key)}
                                disabled={savingKey === key || !canSaveByKey[key]}
                                className="rounded-md bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--secondary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {savingKey === key ? 'Saving...' : 'Save'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={entry.title}
                                    onChange={(event) => updateEntry(key, { title: event.target.value })}
                                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)]"
                                    maxLength={120}
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                                    OG Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => {
                                        const file = event.target.files?.[0] || null;
                                        updateEntry(key, {
                                            ogImageFile: file,
                                            removeOgImage: false,
                                        });
                                    }}
                                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)]"
                                />
                                {ogPreview ? (
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                        Current: {ogPreview}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                        No OG image set
                                    </p>
                                )}
                                {entry.currentOgImage && (
                                    <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                        <input
                                            type="checkbox"
                                            checked={entry.removeOgImage}
                                            onChange={(event) =>
                                                updateEntry(key, {
                                                    removeOgImage: event.target.checked,
                                                    ogImageFile: event.target.checked ? null : entry.ogImageFile,
                                                })
                                            }
                                        />
                                        Remove existing OG image
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                                Meta Description
                            </label>
                            <textarea
                                value={entry.metaDescription}
                                onChange={(event) => updateEntry(key, { metaDescription: event.target.value })}
                                className="min-h-24 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)]"
                                maxLength={320}
                                required
                            />
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
