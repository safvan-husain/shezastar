'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

interface SubSubCategory {
    id: string;
    name: string;
}

interface SubCategory {
    id: string;
    name: string;
    subSubCategories: SubSubCategory[];
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

interface CategoryTreeSelectorProps {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

type ExpandedState = Record<string, boolean>;

/**
 * Collects all descendant IDs from a category (sub + subSub IDs).
 */
function getAllDescendantIds(category: Category): string[] {
    const ids: string[] = [];
    category.subCategories.forEach(sub => {
        ids.push(sub.id);
        sub.subSubCategories.forEach(subSub => ids.push(subSub.id));
    });
    return ids;
}

/**
 * Collects all descendant IDs from a subcategory (subSub IDs).
 */
function getSubDescendantIds(sub: SubCategory): string[] {
    return sub.subSubCategories.map(s => s.id);
}

export function CategoryTreeSelector({ selectedIds, onSelectionChange }: CategoryTreeSelectorProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const { showToast } = useToast();

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/categories');
                if (!res.ok) throw new Error('Failed to load categories');
                const data = await res.json();
                setCategories(data);
            } catch (err: any) {
                showToast(err.message || 'Failed to load categories', 'error');
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleExpand = useCallback((id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds]);

    const toggleCategory = useCallback((category: Category) => {
        const catId = category.id;
        const descendantIds = getAllDescendantIds(category);
        const allIds = [catId, ...descendantIds];

        if (isSelected(catId)) {
            // Deselect category + all descendants
            onSelectionChange(selectedIds.filter(id => !allIds.includes(id)));
        } else {
            // Select category + all descendants
            const newIds = new Set([...selectedIds, ...allIds]);
            onSelectionChange(Array.from(newIds));
        }
    }, [selectedIds, onSelectionChange, isSelected]);

    const toggleSubCategory = useCallback((sub: SubCategory, parentCategory: Category) => {
        const subId = sub.id;
        const descendantIds = getSubDescendantIds(sub);
        const allIds = [subId, ...descendantIds];

        if (isSelected(subId)) {
            // Deselect sub + descendants. Also may need to deselect parent if no siblings remain.
            const newSelected = selectedIds.filter(id => !allIds.includes(id));
            // If no sibling subcategories remain selected, deselect parent too
            const siblingIds = parentCategory.subCategories.map(s => s.id);
            const anySiblingSelected = siblingIds.some(sid => sid !== subId && newSelected.includes(sid));
            if (!anySiblingSelected) {
                onSelectionChange(newSelected.filter(id => id !== parentCategory.id));
            } else {
                onSelectionChange(newSelected);
            }
        } else {
            const newIds = new Set([...selectedIds, ...allIds]);
            // If all sibling subs now selected, also select parent
            const siblingIds = parentCategory.subCategories.map(s => s.id);
            const allSiblingsSelected = siblingIds.every(sid => sid === subId || newIds.has(sid));
            if (allSiblingsSelected) {
                newIds.add(parentCategory.id);
            }
            onSelectionChange(Array.from(newIds));
        }
    }, [selectedIds, onSelectionChange, isSelected]);

    const toggleSubSubCategory = useCallback((subSubId: string, parentSub: SubCategory, parentCategory: Category) => {
        if (isSelected(subSubId)) {
            const newSelected = selectedIds.filter(id => id !== subSubId);
            // If no sibling subSubs remain, deselect parent sub too
            const siblingIds = parentSub.subSubCategories.map(s => s.id);
            const anySiblingSelected = siblingIds.some(sid => sid !== subSubId && newSelected.includes(sid));
            if (!anySiblingSelected) {
                const withoutParentSub = newSelected.filter(id => id !== parentSub.id);
                // Also check if parent category should be deselected
                const siblingSubIds = parentCategory.subCategories.map(s => s.id);
                const anySubSelected = siblingSubIds.some(sid => sid !== parentSub.id && withoutParentSub.includes(sid));
                if (!anySubSelected) {
                    onSelectionChange(withoutParentSub.filter(id => id !== parentCategory.id));
                } else {
                    onSelectionChange(withoutParentSub);
                }
            } else {
                onSelectionChange(newSelected);
            }
        } else {
            const newIds = new Set([...selectedIds, subSubId]);
            // If all sibling subSubs selected, also select parent sub
            const siblingIds = parentSub.subSubCategories.map(s => s.id);
            const allSiblingsSelected = siblingIds.every(sid => sid === subSubId || newIds.has(sid));
            if (allSiblingsSelected) {
                newIds.add(parentSub.id);
                // Then check if all subs now selected → select parent category
                const siblingSubIds = parentCategory.subCategories.map(s => s.id);
                if (siblingSubIds.every(sid => newIds.has(sid))) {
                    newIds.add(parentCategory.id);
                }
            }
            onSelectionChange(Array.from(newIds));
        }
    }, [selectedIds, onSelectionChange, isSelected]);

    /**
     * Returns 'checked' | 'indeterminate' | 'unchecked' for a node.
     */
    const getCheckState = useCallback((id: string, descendantIds: string[]): 'checked' | 'indeterminate' | 'unchecked' => {
        const selfSelected = selectedIds.includes(id);
        if (descendantIds.length === 0) return selfSelected ? 'checked' : 'unchecked';
        const allSelected = descendantIds.every(d => selectedIds.includes(d));
        const someSelected = descendantIds.some(d => selectedIds.includes(d));
        if (selfSelected && allSelected) return 'checked';
        if (someSelected || selfSelected) return 'indeterminate';
        return 'unchecked';
    }, [selectedIds]);

    if (loading) {
        return (
            <Card>
                <div className="text-center py-8 text-[var(--text-secondary)]">Loading categories...</div>
            </Card>
        );
    }

    if (categories.length === 0) {
        return (
            <Card>
                <div className="text-center py-8 text-[var(--text-secondary)]">No categories available</div>
            </Card>
        );
    }

    return (
        <Card className="p-0">
            <div className="max-h-[28rem] overflow-y-auto divide-y divide-[var(--border)]">
                {categories.map(category => {
                    const catDescendantIds = getAllDescendantIds(category);
                    const catState = getCheckState(category.id, catDescendantIds);
                    const isExpanded = expanded[category.id];

                    return (
                        <div key={category.id}>
                            {/* Parent category row */}
                            <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors">
                                <CheckboxIcon
                                    state={catState}
                                    onClick={() => toggleCategory(category)}
                                />
                                <span
                                    className="flex-1 font-medium text-sm cursor-pointer select-none"
                                    onClick={() => toggleCategory(category)}
                                >
                                    {category.name}
                                </span>
                                {category.subCategories.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(category.id)}
                                        className="p-1 rounded hover:bg-[var(--muted)] transition-colors"
                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        <ChevronIcon expanded={!!isExpanded} />
                                    </button>
                                )}
                            </div>

                            {/* Subcategories */}
                            {isExpanded && category.subCategories.map(sub => {
                                const subDescendantIds = getSubDescendantIds(sub);
                                const subState = getCheckState(sub.id, subDescendantIds);
                                const subExpanded = expanded[sub.id];

                                return (
                                    <div key={sub.id}>
                                        <div className="flex items-center gap-3 pl-10 pr-4 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors">
                                            <CheckboxIcon
                                                state={subState}
                                                onClick={() => toggleSubCategory(sub, category)}
                                            />
                                            <span
                                                className="flex-1 text-sm cursor-pointer select-none"
                                                onClick={() => toggleSubCategory(sub, category)}
                                            >
                                                {sub.name}
                                            </span>
                                            {sub.subSubCategories.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(sub.id)}
                                                    className="p-1 rounded hover:bg-[var(--muted)] transition-colors"
                                                    aria-label={subExpanded ? 'Collapse' : 'Expand'}
                                                >
                                                    <ChevronIcon expanded={!!subExpanded} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Sub-subcategories */}
                                        {subExpanded && sub.subSubCategories.map(subSub => {
                                            const subSubState = isSelected(subSub.id) ? 'checked' : 'unchecked';
                                            return (
                                                <div
                                                    key={subSub.id}
                                                    className="flex items-center gap-3 pl-16 pr-4 py-2 hover:bg-[var(--bg-subtle)] transition-colors"
                                                >
                                                    <CheckboxIcon
                                                        state={subSubState}
                                                        onClick={() => toggleSubSubCategory(subSub.id, sub, category)}
                                                    />
                                                    <span
                                                        className="flex-1 text-sm cursor-pointer select-none text-[var(--text-secondary)]"
                                                        onClick={() => toggleSubSubCategory(subSub.id, sub, category)}
                                                    >
                                                        {subSub.name}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ——— Helper sub-components ——— */

function CheckboxIcon({ state, onClick }: { state: 'checked' | 'indeterminate' | 'unchecked'; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${state === 'checked'
                    ? 'bg-[var(--primary)] border-[var(--primary)]'
                    : state === 'indeterminate'
                        ? 'bg-[var(--primary)] border-[var(--primary)] opacity-70'
                        : 'border-[var(--border-subtle)] hover:border-[var(--primary)]'
                }`}
            aria-checked={state === 'checked' ? true : state === 'indeterminate' ? 'mixed' : false}
            role="checkbox"
        >
            {state === 'checked' && (
                <svg className="w-3 h-3 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
            {state === 'indeterminate' && (
                <svg className="w-3 h-3 text-[var(--primary-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
            )}
        </button>
    );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
    return (
        <svg
            className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    );
}
